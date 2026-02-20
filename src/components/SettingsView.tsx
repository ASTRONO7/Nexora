import { useState } from 'react';
import { Trash2, Plus, User, Palette, Brain, Shield, CreditCard } from 'lucide-react';
import type { Memory } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';

interface SettingsViewProps {
    memories: Memory[];
    onAddMemory: (text: string, category: string) => void;
    onDeleteMemory: (id: string) => void;
    onClearMemories: () => void;
    theme: 'light' | 'dark' | 'system';
    onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

type SettingsSection = 'Profile' | 'Appearance' | 'Memory' | 'Security' | 'Billing';

export const SettingsView = ({
    memories,
    onAddMemory,
    onDeleteMemory,
    onClearMemories,
    theme,
    onThemeChange
}: SettingsViewProps) => {
    const { currentUser, userProfile } = useAuth();
    const [activeSection, setActiveSection] = useState<SettingsSection>('Profile');
    const [editedName, setEditedName] = useState(userProfile?.displayName || '');
    const [editedDOB, setEditedDOB] = useState(userProfile?.dateOfBirth || '');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleAddSimulatedMemory = () => {
        const text = prompt("Enter a new memory for Nexora:");
        if (text) {
            onAddMemory(text, 'Manual');
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await updateUserProfile(currentUser.uid, {
                displayName: editedName,
                dateOfBirth: editedDOB
            });
            setIsEditing(false);
            window.location.reload(); // Reload to update auth context
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const sections = [
        { id: 'Profile', icon: User },
        { id: 'Appearance', icon: Palette },
        { id: 'Memory', icon: Brain },
        { id: 'Security', icon: Shield },
        { id: 'Billing', icon: CreditCard },
    ];

    return (
        <div style={{ padding: '40px', width: '100%', maxWidth: '900px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
            <header style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>Settings</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                    Manage your NEXORA workspace preferences and account.
                </p>
            </header>

            <div style={{ display: 'flex', gap: '60px' }}>
                <aside style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as SettingsSection)}
                            style={{
                                textAlign: 'left',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                backgroundColor: activeSection === section.id ? 'var(--hover)' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <section.icon size={18} strokeWidth={activeSection === section.id ? 2.5 : 2} />
                            {section.id}
                        </button>
                    ))}
                </aside>

                <main style={{ flex: 1, minHeight: '500px' }}>
                    {activeSection === 'Profile' && (
                        <section>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Profile</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '24px',
                                        fontWeight: 700
                                    }}>
                                        {getInitials(userProfile?.displayName || null)}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{userProfile?.displayName || 'User'}</h4>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{userProfile?.email}</p>
                                    </div>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                marginLeft: 'auto',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Edit
                                        </button>
                                    ) : (
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedName(userProfile?.displayName || '');
                                                    setEditedDOB(userProfile?.dateOfBirth || '');
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'var(--accent)',
                                                    color: 'white',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                    opacity: saving ? 0.6 : 1
                                                }}
                                            >
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        disabled={!isEditing}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: isEditing ? 'var(--bg-secondary)' : 'var(--hover)',
                                            fontSize: '14px',
                                            cursor: isEditing ? 'text' : 'not-allowed',
                                            opacity: isEditing ? 1 : 0.7
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date of Birth</label>
                                    <input
                                        type="date"
                                        value={editedDOB}
                                        onChange={(e) => setEditedDOB(e.target.value)}
                                        disabled={!isEditing}
                                        max={new Date().toISOString().split('T')[0]}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: isEditing ? 'var(--bg-secondary)' : 'var(--hover)',
                                            fontSize: '14px',
                                            cursor: isEditing ? 'text' : 'not-allowed',
                                            opacity: isEditing ? 1 : 0.7,
                                            colorScheme: 'dark'
                                        }}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Appearance' && (
                        <section>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Appearance</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Theme</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {(['light', 'dark', 'system'] as const).map(themeName => (
                                            <button
                                                key={themeName}
                                                onClick={() => onThemeChange(themeName)}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: `2px solid ${theme === themeName ? 'var(--accent)' : 'var(--border)'}`,
                                                    backgroundColor: theme === themeName ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    color: theme === themeName ? 'var(--accent)' : 'var(--text-primary)',
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                {themeName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Memory' && (
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Memory</h3>
                                <button
                                    onClick={handleAddSimulatedMemory}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'var(--accent)'
                                    }}
                                >
                                    <Plus size={16} /> Add memory
                                </button>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                Nexora learns from your conversations to provide more relevant and personalized assistance.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {memories.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: '16px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <span style={{
                                                fontSize: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 700
                                            }}>
                                                {item.category}
                                            </span>
                                            <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>{item.text}</p>
                                        </div>
                                        <button
                                            onClick={() => onDeleteMemory(item.id)}
                                            style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {memories.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
                                        <Brain size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                        <p style={{ fontSize: '14px', fontWeight: 500 }}>Nexora has no memories yet.</p>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                marginTop: '40px',
                                padding: '24px',
                                backgroundColor: '#FFF5F5',
                                borderRadius: '16px',
                                border: '1px solid #FED7D7'
                            }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#C53030', marginBottom: '8px' }}>Danger Zone</h4>
                                <p style={{ fontSize: '13px', color: '#742A2A', marginBottom: '16px' }}>
                                    Deleting all memories will reset Nexora's understanding of your preferences. This cannot be undone.
                                </p>
                                <button
                                    onClick={onClearMemories}
                                    disabled={memories.length === 0}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#C53030',
                                        color: 'white',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        opacity: memories.length === 0 ? 0.5 : 1,
                                        cursor: memories.length === 0 ? 'default' : 'pointer'
                                    }}
                                >
                                    Clear all memory
                                </button>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Security' && (
                        <section>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Security</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Account</h4>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        Manage your authentication and account security.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to sign out?')) {
                                                const { signOut } = await import('../services/authService');
                                                await signOut();
                                            }
                                        }}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Billing' && (
                        <section style={{ textAlign: 'center', padding: '100px 0' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Billing</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                This section is coming soon to your NEXORA workspace.
                            </p>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};
