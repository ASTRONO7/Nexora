import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Paperclip,
    Send,
    Search,
    Command,
    Loader2,
    X,
    FileText,
    Terminal,
    Cpu,
    Rocket,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from './Message';
import { DropZoneOverlay } from './DropZoneOverlay';
import { CodingOutputPanel } from './CodingOutputPanel';
import { getAIResponse, getSuggestions, type ChatMessage } from '../services/ai';
import { uploadFile } from '../services/upload';
import type { Workspace, Message as MessageType, FileData } from '../App';

interface ChatAreaProps {
    workspace: Workspace;
    onSendMessage: (content: string, response: string, attachments?: FileData[]) => void;
    onSaveResponse: (message: MessageType) => void;
    systemPrompt: string;
    isCodingMode?: boolean;
    isStartupMode?: boolean;
    intelligenceSource: 'cloud' | 'local';
    onSourceChange: (source: 'cloud' | 'local') => void;
    onAddFile: (file: FileData) => void;
    onToggleSidebar?: () => void;
    userName?: string;
}

export const ChatArea = ({
    workspace,
    onSendMessage,
    onSaveResponse,
    systemPrompt,
    isCodingMode,
    isStartupMode,
    intelligenceSource,
    onSourceChange,
    onAddFile,
    onToggleSidebar,
    userName
}: ChatAreaProps) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResearchMode, setIsResearchMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [attachments, setAttachments] = useState<FileData[]>([]);
    const [streamingContent, setStreamingContent] = useState('');
    const [terminalOutput, setTerminalOutput] = useState('');
    const [thinkingStage, setThinkingStage] = useState<'none' | 'analyzing' | 'gathering' | 'synthesizing'>('none');
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [codeContent, setCodeContent] = useState('');
    const [codeLanguage, setCodeLanguage] = useState('javascript');
    const [showEditor, setShowEditor] = useState(true);
    const [isExecuting, setIsExecuting] = useState(false);
    const wordQueueRef = useRef<string[]>([]);
    const streamingIntervalRef = useRef<number | null>(null);
    const autoRunTimerRef = useRef<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const handleClearTerminal = () => setTerminalOutput('');

    // Rhythmic Streamer: Drains the word queue at a steady pace
    const startRhythmicStreaming = () => {
        if (streamingIntervalRef.current) return;

        streamingIntervalRef.current = window.setInterval(() => {
            if (wordQueueRef.current.length > 0) {
                // Adaptive cadence: drain faster if queue is backed up
                const count = wordQueueRef.current.length > 10 ? 2 : 1;
                let added = '';
                for (let i = 0; i < count; i++) {
                    const next = wordQueueRef.current.shift();
                    if (next) added += next;
                }

                if (added) {
                    setStreamingContent(prev => prev + added);
                }
            }
        }, 20); // Faster, smoother cadence
    };

    const stopRhythmicStreaming = () => {
        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
        }
    };

    const thinkingStages: { id: typeof thinkingStage, label: string }[] = [
        { id: 'analyzing', label: 'Analyzing objective...' },
        { id: 'gathering', label: 'Gathering workspace context...' },
        { id: 'synthesizing', label: 'Synthesizing response...' }
    ];

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        stopRhythmicStreaming();
        wordQueueRef.current = [];
        setThinkingStage('none');
        setIsLoading(false);
    };

    const handleSend = async (forcedContent?: string) => {
        const contentToSend = forcedContent || input;
        if ((!contentToSend.trim() && attachments.length === 0) || isLoading) return;

        const userContent = contentToSend;
        const currentAttachments = [...attachments];
        setInput('');
        setAttachments([]);
        setIsLoading(true);
        setStreamingContent('');
        setSuggestions([]);
        wordQueueRef.current = [];

        abortControllerRef.current = new AbortController();

        // Start thinking animation sequence
        setThinkingStage('analyzing');
        const stageInterval = setInterval(() => {
            setThinkingStage(prev => {
                if (prev === 'analyzing') return 'gathering';
                if (prev === 'gathering') return 'synthesizing';
                return prev;
            });
        }, 1500);

        try {
            const messages: ChatMessage[] = workspace.messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const hasImages = currentAttachments.some(a => a.type === 'image');

            let processedContent = userContent;
            if (currentAttachments.length > 0) {
                processedContent += "\n\nAttached Files:\n" + currentAttachments.map(a => `- ${a.name} (${a.url})`).join('\n');
            }

            messages.push({ role: 'user', content: processedContent });

            let lastLength = 0;
            const response = await getAIResponse({
                messages,
                systemPrompt: systemPrompt + (isResearchMode ? "\nRESEARCH MODE ENABLED: Provide deep insights and citations." : ""),
                source: intelligenceSource,
                hasImages,
                signal: abortControllerRef.current.signal,
                onToken: (fullText) => {
                    clearInterval(stageInterval);
                    setThinkingStage('none');
                    startRhythmicStreaming();

                    // Extract new parts and split into words/tokens
                    const newText = fullText.slice(lastLength);
                    lastLength = fullText.length;

                    // Split while preserving whitespace
                    const words = newText.split(/(\s+)/).filter(Boolean);
                    wordQueueRef.current.push(...words);
                }
            });

            // Wait for queue to drain before finalizing
            const finalizeInterval = setInterval(() => {
                if (wordQueueRef.current.length === 0) {
                    clearInterval(finalizeInterval);
                    stopRhythmicStreaming();
                    onSendMessage(userContent, response, currentAttachments);
                    setStreamingContent('');
                    abortControllerRef.current = null;

                    // Finalize states snappily
                    setThinkingStage('none');
                    setIsLoading(false);

                    // If in coding mode, extract code blocks
                    // If in coding mode, extract only JS/TS code blocks for execution
                    if (isCodingMode) {
                        const codeBlockRegex = /```(javascript|js|typescript|ts|python|py|cpp|c|java|go|rust|rs)?\n([\s\S]*?)```/gi;
                        let match;
                        let lastLang = 'javascript';
                        const extractedParts: string[] = [];

                        while ((match = codeBlockRegex.exec(response)) !== null) {
                            if (match[1]) lastLang = match[1].toLowerCase();
                            extractedParts.push(match[2]);
                        }

                        if (extractedParts.length > 0) {
                            setCodeContent(extractedParts.join('\n\n'));
                            setCodeLanguage(lastLang);
                            setShowEditor(true);
                        }
                    }

                    // Get follow-up suggestions
                    getSuggestions(userContent, response).then(setSuggestions);
                }
            }, 100);

        } catch (error: any) {
            clearInterval(stageInterval);
            setThinkingStage('none');
            setIsLoading(false);

            if (error.name === 'AbortError') {
                console.log('AI Request Aborted');
            } else {
                console.error('Chat Error:', error);
                onSendMessage(userContent, error.message || "Intelligence network unreachable.");
            }
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files) return;

        const fileList = Array.from(files);
        setUploadingFiles(prev => [...prev, ...fileList.map(f => f.name)]);

        for (const file of fileList) {
            try {
                const result = await uploadFile(file);
                let type: FileData['type'] = 'other';
                if (file.type.includes('pdf')) type = 'pdf';
                else if (file.type.includes('image')) type = 'image';
                else if (file.name.match(/\.(ts|tsx|js|jsx|py|go|rs|c|cpp)$/)) type = 'code';

                const newFileData: FileData = {
                    id: result.fileId,
                    name: file.name,
                    type,
                    size: (result.size / 1024).toFixed(1) + ' KB',
                    date: new Date().toLocaleDateString(),
                    url: result.fileUrl
                };

                setAttachments(prev => [...prev, newFileData]);
                onAddFile(newFileData); // Also add to workspace files list
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                setUploadingFiles(prev => prev.filter(name => name !== file.name));
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;

            // Check if user is near bottom (within 150px)
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

            // Auto-scroll if loading or streaming, but ONLY if they are already at bottom
            // This allows them to scroll up and read without interruptions
            if ((isLoading || streamingContent) && isNearBottom) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }

            // Always scroll to bottom on new messages if they were already at the bottom
            // or if it's the very first message
            if (workspace.messages.length > 0 && isNearBottom) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [workspace.messages, isLoading, streamingContent]);

    // Code Execution Engine
    const executeCode = useCallback(async () => {
        if (!codeContent.trim()) return;

        setTerminalOutput('');
        setIsExecuting(true);

        const lang = codeLanguage.toLowerCase();

        // Native JavaScript/TypeScript Execution
        if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
            const logs: string[] = [];
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            const captureLog = (...args: any[]) => {
                const output = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                logs.push(output);
                setTerminalOutput(prev => {
                    const separator = prev ? '\n' : '';
                    return prev + separator + output;
                });
            };

            console.log = captureLog;
            console.error = captureLog;
            console.warn = captureLog;

            try {
                const runtime = new Function(codeContent);
                runtime();
            } catch (error: any) {
                const errorMessage = `[Runtime Error] ${error.message}${error.stack ? '\n' + error.stack : ''}`;
                setTerminalOutput(prev => prev + (prev ? '\n' : '') + errorMessage);
            } finally {
                console.log = originalLog;
                console.error = originalError;
                console.warn = originalWarn;
                setIsExecuting(false);
            }
            return;
        }

        // Multi-Language Execution via Piston API
        try {
            const languageMap: Record<string, string> = {
                'python': 'python3',
                'py': 'python3',
                'cpp': 'cpp',
                'c': 'c',
                'java': 'java',
                'go': 'go',
                'rust': 'rust',
                'rs': 'rust'
            };

            const pistonLang = languageMap[lang] || lang;

            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: pistonLang,
                    version: '*',
                    files: [{ content: codeContent }]
                })
            });

            const result = await response.json();

            if (result.run) {
                const output = result.run.stdout || result.run.stderr || 'No output';
                setTerminalOutput(output);
            } else if (result.message) {
                setTerminalOutput(`[Execution Error] ${result.message}`);
            }
        } catch (error: any) {
            setTerminalOutput(`[Execution Error] Failed to connect to execution engine. ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    }, [codeContent, codeLanguage]);

    // Auto-run effect
    useEffect(() => {
        if (!isCodingMode || !codeContent.trim() || isLoading) return;

        if (autoRunTimerRef.current) {
            window.clearTimeout(autoRunTimerRef.current);
        }

        autoRunTimerRef.current = window.setTimeout(() => {
            executeCode();
        }, 1000); // 1s debounce

        return () => {
            if (autoRunTimerRef.current) window.clearTimeout(autoRunTimerRef.current);
        };
    }, [codeContent, isCodingMode, executeCode, isLoading]);

    const handleCodeChange = (newCode: string) => {
        setCodeContent(newCode);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-primary)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <DropZoneOverlay isDragging={isDragging} />

            <header style={{
                height: '72px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                backgroundColor: 'var(--bg-secondary)',
                zIndex: 5
            }}>
                <div style={{ width: '100%', maxWidth: '960px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <motion.button
                            onClick={onToggleSidebar}
                            className="mobile-menu-btn"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                padding: '8px',
                                marginRight: '12px',
                                color: 'var(--text-secondary)',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Menu size={20} />
                        </motion.button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: workspace.color, boxShadow: `0 0 10px ${workspace.color}40` }} />
                            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{workspace.name}</span>

                            {isCodingMode && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '100px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    marginLeft: '8px'
                                }}>
                                    <Terminal size={10} color="#10B981" />
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase' }}>Coding Mode</span>
                                </div>
                            )}

                            {isStartupMode && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: '100px',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    marginLeft: '8px'
                                }}>
                                    <Rocket size={10} color="#F59E0B" />
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase' }}>Startup Builder</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCodingMode && (
                            <button
                                onClick={() => setShowEditor(!showEditor)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: showEditor ? 'var(--accent)' : 'var(--bg-secondary)',
                                    color: showEditor ? 'white' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    marginRight: '8px'
                                }}
                            >
                                {showEditor ? 'View Chat' : 'View Editor'}
                            </button>
                        )}
                        <button
                            onClick={() => onSourceChange(intelligenceSource === 'cloud' ? 'local' : 'cloud')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                border: `1px solid ${intelligenceSource === 'local' ? 'var(--accent)' : 'var(--border)'}`,
                                backgroundColor: intelligenceSource === 'local' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: intelligenceSource === 'local' ? 'var(--accent)' : 'var(--text-secondary)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Cpu size={14} />
                            <span className="tablet-hide">{intelligenceSource === 'local' ? 'Local Llama' : 'Nexora Cloud'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <div
                    ref={chatContainerRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '32px 0 160px 0',
                        display: (isCodingMode && showEditor) ? 'none' : 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        scrollBehavior: 'smooth'
                    }}
                >
                    <div style={{ width: '100%', maxWidth: '960px', padding: '0 20px' }}>
                        <AnimatePresence>
                            {workspace.messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                    style={{
                                        textAlign: 'center',
                                        marginTop: '15vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '24px'
                                    }}
                                >
                                    <h2 style={{
                                        fontSize: '48px',
                                        fontWeight: 700,
                                        background: 'linear-gradient(180deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        letterSpacing: '-0.03em'
                                    }}>
                                        {getTimeGreeting()}, {userName?.split(' ')[0] || 'User'}
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px' }}>
                                        How can I assist you today, {userName?.split(' ')[0] || 'User'}?
                                    </p>
                                </motion.div>
                            )}

                            {/* Message List - Optimized Rendering */}
                            {workspace.messages.map((msg, i) => (
                                <Message
                                    key={`msg-${i}`}
                                    role={msg.role}
                                    content={msg.content}
                                    onSave={msg.role === 'assistant' ? () => onSaveResponse(msg) : undefined}
                                />
                            ))}

                            {/* Thinking Animation - Refined for Premium Feel */}
                            {thinkingStage !== 'none' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px' }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        gap: '6px',
                                        padding: '12px 20px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '0 20px 20px 20px',
                                        border: '1px solid var(--border)',
                                        alignItems: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                                                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                                    style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}
                                                />
                                            ))}
                                        </div>
                                        <span style={{ marginLeft: '14px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.01em' }}>
                                            {thinkingStages.find(s => s.id === thinkingStage)?.label}
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Streaming Content */}
                            {streamingContent && (
                                <Message
                                    role="assistant"
                                    content={streamingContent}
                                    isStreaming={true}
                                />
                            )}

                            {isLoading && thinkingStage === 'none' && !streamingContent && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}
                                >
                                    <Loader2 className="animate-spin" size={18} color="var(--text-secondary)" />
                                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        {intelligenceSource === 'local' ? 'Inferring locally...' : 'Processing objectives...'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Suggestions Area */}
                        {suggestions.length > 0 && !isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginTop: '24px',
                                    padding: '0 12px',
                                    justifyContent: 'flex-start'
                                }}
                            >
                                {suggestions.map((suggestion, idx) => (
                                    <motion.button
                                        key={idx}
                                        onClick={() => handleSend(suggestion)}
                                        whileHover={{ scale: 1.02, backgroundColor: 'var(--hover)', borderColor: 'var(--accent)' }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '100px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--bg-secondary)',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        {suggestion}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>

                {isCodingMode && showEditor && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#1E1E1E',
                        borderRight: '1px solid #333',
                        position: 'relative'
                    }}>
                        <div style={{
                            height: '40px',
                            backgroundColor: '#252526',
                            borderBottom: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            gap: '12px'
                        }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
                            <span style={{ fontSize: '11px', color: '#858585', fontWeight: 500, marginLeft: '4px' }}>
                                {codeLanguage === 'javascript' || codeLanguage === 'js' ? 'index.js' :
                                    codeLanguage === 'typescript' || codeLanguage === 'ts' ? 'index.ts' :
                                        codeLanguage === 'python' || codeLanguage === 'py' ? 'main.py' :
                                            codeLanguage === 'cpp' ? 'main.cpp' :
                                                codeLanguage === 'java' ? 'Main.java' :
                                                    `code.${codeLanguage || 'txt'}`}
                            </span>
                            {isExecuting && (
                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    style={{ marginLeft: 'auto', fontSize: '10px', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}
                                >
                                    Running...
                                </motion.div>
                            )}
                        </div>
                        <textarea
                            value={codeContent}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            spellCheck={false}
                            style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#D4D4D4',
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                fontSize: '14px',
                                padding: '24px',
                                resize: 'none',
                                outline: 'none',
                                lineHeight: '1.6',
                                tabSize: 4
                            }}
                        />
                    </div>
                )}

                {isCodingMode && (
                    <CodingOutputPanel
                        output={terminalOutput}
                        onClear={handleClearTerminal}
                    />
                )}
            </div>

            <div style={{
                position: 'absolute',
                bottom: '32px',
                left: isCodingMode ? 'calc(50% - 200px)' : '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '760px',
                padding: '0 20px',
                zIndex: 10
            }}>
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backdropFilter: 'blur(12px)'
                }}>
                    {/* Attachments Area */}
                    <AnimatePresence>
                        {(attachments.length > 0 || uploadingFiles.length > 0) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}
                            >
                                {attachments.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '4px 8px',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            fontSize: '12px',
                                            fontWeight: 500
                                        }}
                                    >
                                        {file.type === 'image' ? (
                                            <img src={file.url} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
                                        ) : (
                                            <FileText size={14} color="var(--text-secondary)" />
                                        )}
                                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.name}
                                        </span>
                                        <button
                                            onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))}
                                            style={{ color: 'var(--text-secondary)', display: 'flex' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                                {uploadingFiles.map((name) => (
                                    <div key={name} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '4px 8px',
                                        backgroundColor: 'rgba(247, 247, 248, 0.5)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <Loader2 size={12} className="animate-spin" />
                                        {name}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={isCodingMode ? "Enter technical objective..." : isStartupMode ? "Build your startup empire..." : "Engage Nexora..."}
                        autoFocus
                        style={{
                            width: '100%',
                            minHeight: '44px',
                            maxHeight: '200px',
                            border: 'none',
                            resize: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '15px',
                            color: 'var(--text-primary)',
                            padding: '8px 4px',
                            lineHeight: '1.5',
                            outline: 'none'
                        }}
                    />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)' }}
                            >
                                <Paperclip size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                multiple
                                onChange={(e) => handleFileUpload(e.target.files)}
                            />

                            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 4px' }} />

                            <button
                                onClick={() => setIsResearchMode(!isResearchMode)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    color: isResearchMode ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    backgroundColor: isResearchMode ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                }}
                            >
                                <Search size={16} />
                                Research mode
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                <Command size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Enter to send
                            </div>
                            <motion.button
                                onClick={() => isLoading ? handleStop() : handleSend()}
                                disabled={!isLoading && (!input.trim() && attachments.length === 0)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: isLoading ? 'var(--bg-secondary)' : ((input.trim() || attachments.length > 0) ? 'var(--accent)' : 'var(--border)'),
                                    color: isLoading ? 'var(--text-primary)' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: isLoading ? '1px solid var(--border)' : 'none',
                                    boxShadow: isLoading ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    position: 'relative'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: '1.5px solid rgba(0,0,0,0.05)',
                                                borderTopColor: 'var(--text-secondary)',
                                                position: 'absolute'
                                            }}
                                        />
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#EF4444',
                                            borderRadius: '1.5px',
                                            zIndex: 1,
                                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)'
                                        }} />
                                    </>
                                ) : (
                                    <Send size={16} />
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
