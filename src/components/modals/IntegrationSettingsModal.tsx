import { useState, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Shield, AlertTriangle, Layers, FileText, MessageSquare, Zap } from 'lucide-react';
import type { Integration, IntegrationSettings, PermissionLevel, SyncFrequency } from '../../types/integrations';

interface IntegrationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    integration: Integration;
    onSave: (settings: IntegrationSettings) => void;
    onDisconnect: () => void;
}

export const IntegrationSettingsModal: FC<IntegrationSettingsModalProps> = ({
    isOpen,
    onClose,
    integration,
    onSave,
    onDisconnect
}) => {
    const [settings, setSettings] = useState<IntegrationSettings>(integration.settings);
    const [activeTab, setActiveTab] = useState<'general' | 'permissions' | 'danger'>('general');

    const handleSave = () => {
        onSave(settings);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-[#0A0A0C] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#121214]">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: `${integration.color}20`, color: integration.color }}
                            >
                                {/* We can't render the icon component dynamically easily here without passing it, 
                                    so we'll just use a generic settings icon or relying on parent to pass icon element if needed.
                                    For now, let's use the integration color/name. */}
                                <div className="font-bold text-lg">{integration.name.substring(0, 2)}</div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">{integration.name} Settings</h2>
                                <p className="text-sm text-gray-400">Configure how Nexora interacts with {integration.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        <TabButton
                            active={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                            label="General & Sync"
                        />
                        <TabButton
                            active={activeTab === 'permissions'}
                            onClick={() => setActiveTab('permissions')}
                            label="Permissions & AI"
                        />
                        <TabButton
                            active={activeTab === 'danger'}
                            onClick={() => setActiveTab('danger')}
                            label="Danger Zone"
                            isDanger
                        />
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <Section title="Data Import" description="Choose what data Nexora imports from this source.">
                                    <Toggle
                                        label="Import Projects"
                                        description="Discover and sync repositories, databases, or folders as projects."
                                        checked={settings.importProjects}
                                        onChange={v => setSettings({ ...settings, importProjects: v })}
                                        icon={<Layers size={18} />}
                                    />
                                    <Toggle
                                        label="Import Tasks & Issues"
                                        description="Sync issues, cards, and to-do items."
                                        checked={settings.importTasks}
                                        onChange={v => setSettings({ ...settings, importTasks: v })}
                                        icon={<Check size={18} />}
                                    />
                                    <Toggle
                                        label="Import Files & Docs"
                                        description="Index READMEs, documents, and code files for search."
                                        checked={settings.importFiles}
                                        onChange={v => setSettings({ ...settings, importFiles: v })}
                                        icon={<FileText size={18} />}
                                    />
                                </Section>

                                <Section title="Sync Schedule" description="How often should Nexora check for updates?">
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['manual', '15m', '1h', 'daily'] as SyncFrequency[]).map((freq) => (
                                            <button
                                                key={freq}
                                                onClick={() => setSettings({ ...settings, syncFrequency: freq, autoSync: freq !== 'manual' })}
                                                className={`p-3 rounded-lg border text-left transition-all ${settings.syncFrequency === freq
                                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="font-medium capitalize">{freq === 'manual' ? 'Manual Only' : `Every ${freq}`}</div>
                                                <div className="text-xs opacity-70 mt-1">
                                                    {freq === 'manual' ? 'Sync only when you click button' : 'Auto-sync in background'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'permissions' && (
                            <div className="space-y-6">
                                <Section title="Access Level" description="Control what Nexora can do in {integration.name}.">
                                    <div className="space-y-3">
                                        <PermissionOption
                                            value="read_only"
                                            current={settings.permissions}
                                            onChange={v => setSettings({ ...settings, permissions: v })}
                                            title="Read-Only"
                                            description="Nexora can only view and value data. It cannot make any changes."
                                            icon={<Shield size={18} />}
                                        />
                                        <PermissionOption
                                            value="suggest"
                                            current={settings.permissions}
                                            onChange={v => setSettings({ ...settings, permissions: v })}
                                            title="Suggest"
                                            description="Nexora can draft comments, PRs, and updates, but you must approve them."
                                            icon={<MessageSquare size={18} />}
                                        />
                                        <PermissionOption
                                            value="act"
                                            current={settings.permissions}
                                            onChange={v => setSettings({ ...settings, permissions: v })}
                                            title="Act"
                                            description="Nexora can autonomously push changes, merge PRs, and update tasks."
                                            icon={<Zap size={18} />}
                                            isRisky
                                        />
                                    </div>
                                </Section>

                                <Section title="AI Capabilities" description="Manage specific AI features.">
                                    <Toggle
                                        label="AI Summarization"
                                        description="Allow AI to generate summaries of projects and tasks."
                                        checked={settings.allowAISummary}
                                        onChange={v => setSettings({ ...settings, allowAISummary: v })}
                                        icon={<FileText size={18} />}
                                    />
                                    <Toggle
                                        label="AI Autonomous Actions"
                                        description="Allow AI to perform write actions (requires 'Act' permission)."
                                        checked={settings.allowAIActions}
                                        onChange={v => setSettings({ ...settings, allowAIActions: v })}
                                        icon={<Zap size={18} />}
                                        disabled={settings.permissions === 'read_only'}
                                    />
                                </Section>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium mb-1">Disconnect Integration</h4>
                                            <p className="text-sm text-gray-400 mb-4">
                                                Disconnecting will stop all syncs. You can choose to keep imported data or delete it.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={onDisconnect}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Disconnect & Keep Data
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Disconnect & Delete Data
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-[#121214] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Check size={16} />
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Sub-components

const TabButton: FC<{ active: boolean; onClick: () => void; label: string; isDanger?: boolean }> = ({ active, onClick, label, isDanger }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${active
            ? isDanger ? 'border-red-500 text-red-500' : 'border-blue-500 text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
    >
        {label}
    </button>
);

const Section: FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div>
        <div className="mb-4">
            <h3 className="text-white font-medium">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const Toggle: FC<{ label: string; description: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; disabled?: boolean }> = ({
    label, description, checked, onChange, icon, disabled
}) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${checked ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                {icon}
            </div>
            <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
            </div>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-white/10'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`} />
        </button>
    </div>
);

const PermissionOption: FC<{
    value: PermissionLevel;
    current: PermissionLevel;
    onChange: (v: PermissionLevel) => void;
    title: string;
    description: string;
    icon: React.ReactNode;
    isRisky?: boolean;
}> = ({ value, current, onChange, title, description, icon, isRisky }) => {
    const isSelected = value === current;

    return (
        <button
            onClick={() => onChange(value)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${isSelected
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
        >
            <div className={`mt-1 p-2 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className={`flex items-center gap-2 font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                    {title}
                    {isRisky && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/30">CAUTION</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                }`}>
                {isSelected && <Check size={12} className="text-white" />}
            </div>
        </button>
    );
};
