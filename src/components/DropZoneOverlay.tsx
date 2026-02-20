import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

interface DropZoneOverlayProps {
    isDragging: boolean;
}

export const DropZoneOverlay = ({ isDragging }: DropZoneOverlayProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 1 : 0 }}
            style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: isDragging ? 'all' : 'none',
                borderRadius: '24px',
                border: '2px dashed var(--accent)',
                margin: '20px'
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Upload size={48} color="var(--accent)" />
                </motion.div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginTop: '16px', color: 'var(--text-primary)' }}>
                    Drop to upload
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Release to attach files to your workspace
                </p>
            </div>
        </motion.div>
    );
};
