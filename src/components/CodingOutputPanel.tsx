import { Terminal, Copy, X, Maximize2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface CodingOutputPanelProps {
    output?: string;
    onClear?: () => void;
    onClose?: () => void;
}

export const CodingOutputPanel = ({ output = "", onClear, onClose }: CodingOutputPanelProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
                width: '400px',
                height: '100%',
                backgroundColor: '#1E1E1E',
                borderLeft: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                color: '#D4D4D4',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '13px',
                zIndex: 20
            }}
        >
            <div style={{
                height: '40px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                backgroundColor: '#252526'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} color="#10B981" />
                    <span style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terminal / Output</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {onClear && (
                        <button
                            onClick={onClear}
                            title="Clear Terminal"
                            style={{ padding: '4px', borderRadius: '4px', color: '#858585', hover: { color: 'white' } } as any}
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                    <button style={{ padding: '4px', borderRadius: '4px', color: '#858585', hover: { color: 'white' } } as any}>
                        <Copy size={13} />
                    </button>
                    <button style={{ padding: '4px', borderRadius: '4px', color: '#858585', hover: { color: 'white' } } as any}>
                        <Maximize2 size={13} />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{ padding: '4px', borderRadius: '4px', color: '#858585', hover: { color: '#EF4444' } } as any}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    padding: '16px',
                    overflowY: 'auto',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: '1.6'
                }}
            >
                {!output && (
                    <div style={{ color: '#555', fontStyle: 'italic', fontSize: '12px' }}>
                        Ready for execution...
                    </div>
                )}
                {output && output.split('\n').map((line, idx) => (
                    <div
                        key={idx}
                        style={{
                            color: line.startsWith('[Runtime Error]') ? '#FF5F56' : '#D4D4D4',
                            marginBottom: '4px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                        }}
                    >
                        {line}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
