import { useState } from 'react';
import { Mail, Lock, User, Github, Chrome, ArrowRight, AlertCircle } from 'lucide-react';
import {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signInWithPhone,
    verifyPhoneCode,
    initializeRecaptcha,
    resetPassword
} from '../services/authService';
import type { ConfirmationResult } from 'firebase/auth';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type AuthMode = 'signin' | 'signup' | 'phone' | 'reset';

export const AuthPage = () => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(new URLSearchParams(window.location.search).get('logout') === 'true' ? 'Signed out successfully.' : '');

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }
                await signUpWithEmail(email, password, displayName);
            } else if (mode === 'signin') {
                await signInWithEmail(email, password);
            } else if (mode === 'reset') {
                await resetPassword(email);
                setSuccess('Password reset email sent! Check your inbox.');
                setEmail('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGithub();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!confirmationResult) {
                // Send OTP
                const recaptcha = initializeRecaptcha('recaptcha-container');
                const result = await signInWithPhone(phoneNumber, recaptcha);
                setConfirmationResult(result);
                setSuccess('Verification code sent to your phone!');
            } else {
                // Verify OTP
                await verifyPhoneCode(confirmationResult, verificationCode);
            }
        } catch (err: any) {
            setError(err.message);
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
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '20%',
                right: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }} />

            {/* Auth Card */}
            <div style={{
                width: '440px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '48px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo */}
                <div
                    className="brand-animate"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}
                >
                    <img
                        src="/Nexora logo.png"
                        alt="Nexora Logo"
                        style={{
                            height: '80px',
                            width: '80px',
                            filter: 'brightness(1.5) contrast(1.1)',
                            opacity: 0.9,
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                            objectFit: 'cover'
                        }}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '4px',
                            letterSpacing: '0.05em',
                            margin: 0
                        }}>
                            NEXORA
                        </h1>
                        <p style={{
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 400
                        }}>
                            {mode === 'reset' ? 'Reset Your Password' : 'Sign in to your workspace'}
                        </p>
                    </div>
                </div>

                {/* Mode Tabs */}
                {mode !== 'reset' && (
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '32px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '4px',
                        borderRadius: '8px'
                    }}>
                        {['signin', 'signup', 'phone'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m as AuthMode)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: mode === m ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    border: mode === m ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    color: mode === m ? '#3B82F6' : 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Sign Up' : 'Phone'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={16} color="#EF4444" />
                        <span style={{ fontSize: '13px', color: '#EF4444' }}>{error}</span>
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        fontSize: '13px',
                        color: '#10B981'
                    }}>
                        {success}
                    </div>
                )}

                {/* Email/Password Form */}
                {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                    <form onSubmit={handleEmailAuth} style={{ marginBottom: '24px' }}>
                        {mode === 'signup' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                                    Display Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px 12px 44px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 44px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>
                        </div>

                        {mode !== 'reset' && (
                            <>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                                        Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px 12px 44px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    </div>
                                </div>

                                {mode === 'signup' && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                                            Confirm Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 14px 12px 44px',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {mode === 'signin' && (
                            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode('reset')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#3B82F6',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        textDecoration: 'none'
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {loading ? 'Processing...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                )}

                {/* Phone Auth Form */}
                {mode === 'phone' && (
                    <form onSubmit={handlePhoneSignIn} style={{ marginBottom: '24px' }}>
                        {!confirmationResult ? (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                                    Phone Number
                                </label>
                                <PhoneInput
                                    international
                                    defaultCountry="US"
                                    value={phoneNumber}
                                    onChange={(value) => setPhoneNumber(value || '')}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    required
                                    maxLength={6}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none',
                                        textAlign: 'center',
                                        letterSpacing: '0.5em'
                                    }}
                                />
                            </div>
                        )}

                        <div id="recaptcha-container"></div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {loading ? 'Processing...' : confirmationResult ? 'Verify Code' : 'Send Code'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                )}

                {/* Social Auth Buttons */}
                {mode !== 'reset' && mode !== 'phone' && (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Chrome size={18} />
                                Google
                            </button>

                            <button
                                onClick={handleGithubSignIn}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Github size={18} />
                                GitHub
                            </button>
                        </div>
                    </>
                )}

                {/* Back to Sign In */}
                {mode === 'reset' && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <button
                            onClick={() => setMode('signin')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#3B82F6',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            ← Back to sign in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
