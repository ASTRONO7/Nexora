import { useRef, useState } from 'react';
import {
    Upload,
    FileText,
    Code,
    Image as ImageIcon,
    File as FileIcon,
    Trash2,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileData } from '../App';
import { uploadFile } from '../services/upload';

interface FilesViewProps {
    files: FileData[];
    onUpload: (file: FileData) => void;
    onDelete: (id: string) => void;
}

export const FilesView = ({ files, onUpload, onDelete }: FilesViewProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={20} color="#EF4444" />;
            case 'code': return <Code size={20} color="#3B82F6" />;
            case 'image': return <ImageIcon size={20} color="#10B981" />;
            default: return <FileIcon size={20} color="var(--text-secondary)" />;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await uploadFile(file);

            let type: FileData['type'] = 'other';
            if (file.type.includes('pdf')) type = 'pdf';
            else if (file.type.includes('javascript') || file.type.includes('typescript') || file.type.includes('json') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) type = 'code';
            else if (file.type.includes('image')) type = 'image';
            else if (file.type.includes('word') || file.type.includes('text')) type = 'doc';

            const newFile: FileData = {
                id: result.fileId,
                name: file.name,
                type: type,
                size: (result.size / 1024).toFixed(1) + ' KB',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                url: result.fileUrl
            };

            onUpload(newFile);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ padding: '40px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Files</h2>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: isUploading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
            }}>
                <AnimatePresence mode="popLayout">
                    {files.map((file) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -4 }}
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                padding: '16px',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}
                            onClick={() => window.open(file.url, '_blank')}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--border)'
                                }}>
                                    {getFileIcon(file.type)}
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(file.id);
                                        }}
                                        style={{
                                            padding: '6px',
                                            borderRadius: '6px',
                                            color: 'var(--text-secondary)',
                                            hover: { backgroundColor: 'var(--hover)', color: '#EF4444' }
                                        } as any}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    marginBottom: '2px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {file.name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span>{file.size}</span>
                                    <span>•</span>
                                    <span>{file.date}</span>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                color: 'var(--accent)',
                                fontWeight: 500
                            }}>
                                <ExternalLink size={12} />
                                Open File
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {files.length === 0 && !isUploading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', border: '2px dashed var(--border)', borderRadius: '24px', color: 'var(--text-secondary)' }}>
                        <Upload size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>No files in this workspace</p>
                        <p style={{ fontSize: '14px', marginTop: '4px' }}>Upload docs, code, or images to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
