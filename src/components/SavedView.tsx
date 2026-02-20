import { Bookmark, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../App';

interface SavedViewProps {
    savedResponses: Message[];
    onDelete: (index: number) => void;
}

export const SavedView = ({ savedResponses, onDelete }: SavedViewProps) => {
    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    return (
        <div style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bookmark size={24} color="var(--accent)" />
                    <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Saved Responses</h2>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <AnimatePresence mode="popLayout">
                    {savedResponses.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{
                                padding: '24px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '16px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}
                        >
                            <div style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                                {msg.content}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                paddingTop: '16px',
                                borderTop: '1px solid var(--border)'
                            }}>
                                <button
                                    onClick={() => handleCopy(msg.content)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        backgroundColor: 'var(--hover)'
                                    }}
                                >
                                    <Copy size={14} /> Copy
                                </button>
                                <button
                                    onClick={() => onDelete(i)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#EF4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.05)'
                                    }}
                                >
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {savedResponses.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                        <Bookmark size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>No saved responses yet.</p>
                        <p style={{ fontSize: '14px', marginTop: '4px' }}>Responses you save from chats will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
