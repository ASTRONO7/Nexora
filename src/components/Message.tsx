import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MessageProps {
    role: 'user' | 'assistant';
    content: string;
    onSave?: () => void;
    isStreaming?: boolean;
}

export const Message = memo(({ role, content, onSave, isStreaming }: MessageProps) => {
    const isAssistant = role === 'assistant';
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] // Premium ease-out expo
            }}
            className="motion-gpu"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isAssistant ? 'flex-start' : 'flex-end',
                gap: '4px',
                marginBottom: '24px',
                width: '100%',
                position: 'relative'
            }}
        >
            <div
                className="prose"
                style={{
                    maxWidth: '100%',
                    padding: '12px 16px',
                    borderRadius: isAssistant ? '0 16px 16px 16px' : '16px 16px 0 16px',
                    backgroundColor: isAssistant ? 'var(--bg-secondary)' : 'var(--accent)',
                    color: isAssistant ? 'var(--text-primary)' : 'white',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    boxShadow: isAssistant ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    border: isAssistant ? '1px solid var(--border)' : 'none',
                    position: 'relative',
                    overflowWrap: 'break-word'
                }}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeText = String(children).replace(/\n$/, '');

                            return !inline ? (
                                <div style={{ position: 'relative', margin: '12px 0' }}>
                                    <div style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '8px',
                                        zIndex: 10,
                                        display: 'flex',
                                        gap: '4px'
                                    }}>
                                        <button
                                            onClick={() => handleCopy(codeText)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        >
                                            {copiedCode === codeText ? <Check size={12} /> : <Copy size={12} />}
                                            {copiedCode === codeText ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <SyntaxHighlighter
                                        {...props}
                                        style={vscDarkPlus}
                                        language={match ? match[1] : 'text'}
                                        PreTag="div"
                                        customStyle={{
                                            borderRadius: '8px',
                                            margin: 0,
                                            fontSize: '13px',
                                            padding: '40px 16px 16px 16px',
                                            backgroundColor: '#1E1E1E'
                                        }}
                                    >
                                        {codeText}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <code
                                    style={{
                                        backgroundColor: isAssistant ? 'var(--hover)' : 'rgba(255,255,255,0.1)',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9em'
                                    }}
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>

                {isStreaming && (
                    <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        style={{
                            display: 'inline-block',
                            width: '4px',
                            height: '14px',
                            backgroundColor: 'currentColor',
                            marginLeft: '4px',
                            verticalAlign: 'middle'
                        }}
                    />
                )}

                {isAssistant && onSave && (
                    <button
                        onClick={onSave}
                        style={{
                            position: 'absolute',
                            right: '-32px',
                            top: '0',
                            padding: '4px',
                            color: 'var(--text-secondary)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                        }}
                        className="save-button"
                    >
                        <Bookmark size={14} />
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    margin: isAssistant ? '0 0 0 4px' : '0 4px 0 0'
                }}>
                    {isAssistant ? 'Nexora' : 'You'}
                </span>
            </div>
            <style>{`
        div:hover .save-button {
          opacity: 1 !important;
        }
      `}</style>
        </motion.div>
    );
});
