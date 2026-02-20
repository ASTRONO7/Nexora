import { useState, type FC } from 'react';
import {
    Plus,
    LayoutDashboard,
    Files,
    Search,
    History,
    Bookmark,
    Settings,
    MoreVertical,
    Trash2,
    Edit2,
    User,
    LogOut,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import type { Workspace } from '../App';

const navItems = [
    { icon: Plus, label: 'New Chat', primary: true },
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: LayoutDashboard, label: 'Workspace' },
    { icon: Zap, label: 'Integrations' },
    { icon: Files, label: 'Files' },
    { icon: Search, label: 'Research' },
    { icon: History, label: 'History' },
    { icon: Bookmark, label: 'Saved' },
    { icon: Settings, label: 'Settings' },
];

interface SidebarProps {
    onViewChange: (view: 'chat' | 'files' | 'settings' | 'saved' | 'research' | 'history' | 'dashboard' | 'integrations') => void;
    currentView: 'chat' | 'files' | 'settings' | 'saved' | 'research' | 'history' | 'dashboard' | 'integrations';
    activeWorkspaceId: string;
    workspaces: Workspace[];
    onWorkspaceChange: (id: string) => void;
    onNewChat: () => void;
    onCreateWorkspace: (name: string) => void;
    onDeleteWorkspace: (id: string) => void;
    onRenameWorkspace: (id: string, newName: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
    userName?: string;
}

export const Sidebar: FC<SidebarProps> = ({
    onViewChange,
    currentView,
    activeWorkspaceId,
    workspaces,
    onWorkspaceChange,
    onNewChat,
    onCreateWorkspace,
    onDeleteWorkspace,
    onRenameWorkspace,
    isOpen,
    onClose,
    userName
}) => {
    const { logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            // End session completely as per core rule
            await logout();
            // App.tsx will handle redirect via state change
        } catch (err) {
            console.error('Logout failed:', err);
            setIsLoggingOut(false);
        }
    };

    const handleNavClick = (label: string) => {
        if (label === 'New Chat') {
            onNewChat();
            onViewChange('chat');
        } else if (label === 'Dashboard') {
            onViewChange('dashboard');
        } else if (label === 'Workspace') {
            onViewChange('chat');
        } else if (label === 'Integrations') {
            onViewChange('integrations');
        } else if (label === 'Research') {
            onViewChange('research');
        } else if (label === 'History') {
            onViewChange('history');
        } else if (label === 'Files') {
            onViewChange('files');
        } else if (label === 'Settings') {
            onViewChange('settings');
        } else if (label === 'Saved') {
            onViewChange('saved');
        }
    };

    const handleCreateNewWorkspace = () => {
        const name = prompt("Enter workspace name:");
        if (name) onCreateWorkspace(name);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 40,
                            display: 'none' // Controlled by CSS on mobile
                        }}
                        className="mobile-overlay"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{
                    x: isOpen ? 0 : (window.innerWidth < 768 ? -280 : 0),
                    opacity: 1
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className={`sidebar-container ${isOpen ? 'open' : ''}`}
                style={{
                    width: 'var(--sidebar-width)',
                    height: '100%',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px 12px',
                    zIndex: 50,
                    position: 'relative'
                }}
            >
                <div style={{ padding: '0 8px', marginBottom: '32px' }}>
                    <div style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        overflow: 'hidden'
                    }}>
                        <img
                            src="/Nexora logo.png"
                            alt="Logo"
                            style={{
                                height: '100%',
                                width: 'auto',
                                objectFit: 'contain',
                                filter: 'brightness(1.2) contrast(1.1) invert(var(--logo-invert))',
                                opacity: 0.95,
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            <span style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-sans)',
                                lineHeight: 1.2
                            }}>
                                NEXORA
                            </span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                opacity: 0.6,
                                letterSpacing: '0.5px'
                            }}>
                                V1.0.4
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', paddingBottom: '20px' }}>
                    {navItems.map((item) => {
                        const isActive = (item.label === 'New Chat' && currentView === 'chat') ||
                            (item.label === 'Dashboard' && currentView === 'dashboard') ||
                            (item.label === 'Workspace' && currentView === 'chat') ||
                            (item.label === 'Integrations' && currentView === 'integrations') ||
                            (item.label === 'Files' && currentView === 'files') ||
                            (item.label === 'Settings' && currentView === 'settings') ||
                            (item.label === 'Saved' && currentView === 'saved');

                        return (
                            <motion.button
                                key={item.label}
                                onClick={() => handleNavClick(item.label)}
                                whileHover={{ backgroundColor: 'var(--hover)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    width: '100%',
                                    textAlign: 'left',
                                    color: isActive || (item.primary && currentView === 'chat') ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    border: item.primary ? '1px solid var(--border)' : 'none',
                                    backgroundColor: isActive ? 'var(--hover)' : 'transparent',
                                    marginBottom: item.primary ? '12px' : '2px'
                                }}
                            >
                                <item.icon size={18} strokeWidth={2} />
                                {item.label}
                            </motion.button>
                        );
                    })}

                    <div style={{ marginTop: '24px', padding: '0 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <p style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Workspaces
                            </p>
                            <button
                                onClick={handleCreateNewWorkspace}
                                style={{ color: 'var(--text-secondary)', display: 'flex' }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <AnimatePresence>
                                {workspaces.map((ws) => (
                                    <motion.div
                                        key={ws.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        style={{ position: 'relative' }}
                                    >
                                        <motion.button
                                            onClick={() => {
                                                onWorkspaceChange(ws.id);
                                                onViewChange('chat');
                                            }}
                                            whileHover={{ backgroundColor: 'var(--hover)' }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                width: '100%',
                                                color: activeWorkspaceId === ws.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                backgroundColor: activeWorkspaceId === ws.id ? 'var(--hover)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '2px',
                                                backgroundColor: ws.color
                                            }} />
                                            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ws.name}
                                            </span>

                                            {activeWorkspaceId === ws.id && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newName = prompt("Rename workspace:", ws.name);
                                                            if (newName) onRenameWorkspace(ws.id, newName);
                                                        }}
                                                        style={{ opacity: 0.6 }}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete workspace "${ws.name}"?`)) onDeleteWorkspace(ws.id);
                                                        }}
                                                        style={{ opacity: 0.6 }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* User Menu Popup */}
                <AnimatePresence>
                    {showUserMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{
                                position: 'absolute',
                                bottom: '80px',
                                left: '12px',
                                right: '12px',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                padding: '8px',
                                zIndex: 100
                            }}
                        >
                            <button
                                onClick={() => {
                                    onViewChange('settings');
                                    setShowUserMenu(false);
                                }}
                                className="menu-item"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px',
                                    width: '100%',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <User size={16} /> Edit Profile
                            </button>
                            <button
                                onClick={handleSignOut}
                                disabled={isLoggingOut}
                                className="menu-item"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px',
                                    width: '100%',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#EF4444',
                                    borderRadius: '8px',
                                    cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                                    opacity: isLoggingOut ? 0.7 : 1
                                }}
                            >
                                <LogOut size={16} />
                                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="user-profile-btn"
                    style={{
                        marginTop: 'auto',
                        padding: '12px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'background 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            {userName ? userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{userName || 'User'}</span>
                    </div>
                    <MoreVertical size={16} color="var(--text-secondary)" />
                </div>

                <style>{`
                .menu-item:hover { background: var(--hover); }
                .user-profile-btn:hover { background: var(--hover); }
            `}</style>
            </motion.div>
        </>
    );
};
