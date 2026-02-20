import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { updateUserProfile } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSetupProps {
    onComplete: () => void;
}

export const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
    const { currentUser, updateProfileLocally } = useAuth();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!name.trim()) {
            setError('Please enter your name to continue');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (currentUser) {
                await updateUserProfile(currentUser.uid, {
                    displayName: name.trim(),
                    profileComplete: true
                });
                // Update local state instantly to trigger App.tsx redirect
                updateProfileLocally({
                    displayName: name.trim(),
                    profileComplete: true
                });
                onComplete();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
            color: '#ffffff',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '20%',
                right: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '440px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '48px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center'
                }}
            >
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 24px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}>
                        <img
                            src="/Nexora logo.png"
                            alt="Nexora"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px',
                        letterSpacing: '0.05em'
                    }}>
                        Welcome to Nexora
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                        What should Nexora call you?
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Your Name"
                            style={{
                                width: '100%',
                                padding: '16px 18px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: '#ffffff',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#ef4444',
                            fontSize: '13px',
                            marginBottom: '16px',
                            padding: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                            boxShadow: loading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        {loading ? (
                            <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%' }} />
                        ) : (
                            <>
                                Continue
                                <ArrowRight size={18} />
                                <Sparkles size={16} />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
