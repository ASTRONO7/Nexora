import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Github, BookOpen, MessageSquare, Layers, Cloud, Cpu,
    Check, RefreshCw, ExternalLink, Zap, Settings, AlertTriangle, X
} from 'lucide-react';
import { useIntegrations } from '../contexts/IntegrationsContext';
import type { Integration, IntegrationId } from '../types/integrations';
import { IntegrationSettingsModal } from './modals/IntegrationSettingsModal';
import { DiscoveryReviewModal } from './modals/DiscoveryReviewModal';

const ICON_MAP: Record<string, typeof Github> = {
    Github, BookOpen, MessageSquare, Layers, Cloud, Cpu,
};

const getIcon = (iconName: string) => ICON_MAP[iconName] || Zap;

export const IntegrationsView: FC = () => {
    const {
        integrations,
        toggleIntegration,
        getProjectsBySource,
        updateIntegrationSettings,
        startDiscovery,
        confirmDiscoveredProjects,
        isDiscovering,
        discoveredProjects
    } = useIntegrations();

    const [activeIntegrationId, setActiveIntegrationId] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Handle OAuth Callback status from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const provider = params.get('provider');
        const message = params.get('message');

        if (status === 'success' && provider) {
            setStatusMessage({
                type: 'success',
                text: `Successfully connected ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`
            });
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
            // Trigger discovery immediately for the new provider
            startDiscovery(provider as any);
        } else if (status === 'error') {
            setStatusMessage({
                type: 'error',
                text: message || 'Failed to connect integration. Please try again.'
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [startDiscovery]);

    // Auto-open review when projects are discovered
    useEffect(() => {
        if (discoveredProjects.length > 0) {
            setShowReview(true);
        }
    }, [discoveredProjects.length]);

    const handleConnect = async (integration: Integration) => {
        if (integration.status === 'connected') {
            // If connected, show settings
            setActiveIntegrationId(integration.id);
        } else {
            // If disconnected, trigger OAuth start
            try {
                await toggleIntegration(integration.id);
            } catch (error: any) {
                let errorMessage = error.message || 'Failed to connect. Please try again.';

                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    errorMessage = `${integration.name} integration is not yet fully configured on the server. We're working on it!`;
                } else if (errorMessage.includes('Failed to fetch')) {
                    errorMessage = 'Backend server is not reachable. Please ensure the API is running.';
                }

                setStatusMessage({
                    type: 'error',
                    text: errorMessage
                });
            }
        }
    };

    const activeIntegration = integrations.find(i => i.id === activeIntegrationId);

    // Create color map for modals
    const colorMap = integrations.reduce((acc, i) => ({ ...acc, [i.id]: i.color }), {} as Record<IntegrationId, string>);

    return (
        <div className="integrations-view relative">
            <div className="integrations-header">
                <div>
                    <h1 className="integrations-title">Integrations</h1>
                    <p className="integrations-subtitle">
                        Connect your tools — Nexora auto-detects and merges your projects
                    </p>
                </div>
                <button
                    onClick={async () => {
                        setStatusMessage({ type: 'success', text: 'Checking connection...' });
                        try {
                            const res = await fetch('/api/ping');
                            const data = await res.json();
                            const res2 = await fetch('/api/integrations/');
                            const data2 = await res2.json();
                            setStatusMessage({
                                type: 'success',
                                text: `Backend Status: ${data.status} | Integrations: ${data2.status || 'Active'}`
                            });
                        } catch (err: any) {
                            setStatusMessage({
                                type: 'error',
                                text: `Connection Check Failed: ${err.message}`
                            });
                        }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-400 transition-colors flex items-center gap-2"
                >
                    <RefreshCw size={14} />
                    Check API Status
                </button>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mb-6 p-4 rounded-xl flex items-center justify-between ${statusMessage.type === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {statusMessage.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                            <span className="font-medium">{statusMessage.text}</span>
                        </div>
                        <button onClick={() => setStatusMessage(null)}>
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scanning Indicator */}
            <AnimatePresence>
                {isDiscovering && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3 text-blue-400"
                    >
                        <RefreshCw className="animate-spin" size={20} />
                        <span className="font-medium">Discovery in progress... Scanning connected account for projects.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="integrations-grid">
                {integrations.map((integration, i) => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        projectCount={getProjectsBySource(integration.id).length}
                        onToggle={() => handleConnect(integration)}
                        onSettings={() => setActiveIntegrationId(integration.id)}
                        delay={i * 0.06}
                        isDiscovering={isDiscovering && integration.status === 'connected'}
                    />
                ))}
            </div>

            {/* How It Works */}
            <div className="how-it-works">
                <h2 className="how-title">How Auto-Detection Works</h2>
                <div className="how-steps">
                    <div className="how-step">
                        <div className="how-step-num">1</div>
                        <div>
                            <h4>Connect Your Tools</h4>
                            <p>Authenticate with GitHub, Notion, Slack, and more via OAuth</p>
                        </div>
                    </div>
                    <div className="how-step">
                        <div className="how-step-num">2</div>
                        <div>
                            <h4>Auto-Sync</h4>
                            <p>Nexora fetches repos, tasks, docs, and conversations every few minutes</p>
                        </div>
                    </div>
                    <div className="how-step">
                        <div className="how-step-num">3</div>
                        <div>
                            <h4>Smart Merge</h4>
                            <p>Projects with matching names are merged into a unified workspace intelligence</p>
                        </div>
                    </div>
                    <div className="how-step">
                        <div className="how-step-num">4</div>
                        <div>
                            <h4>AI Awareness</h4>
                            <p>Nexora understands your progress, blockers, and deadlines — then tells you</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeIntegration && (
                <IntegrationSettingsModal
                    isOpen={!!activeIntegration}
                    onClose={() => setActiveIntegrationId(null)}
                    integration={activeIntegration}
                    onSave={(settings) => {
                        updateIntegrationSettings(activeIntegration.id, settings);
                        setActiveIntegrationId(null);
                    }}
                    onDisconnect={() => {
                        toggleIntegration(activeIntegration.id);
                        setActiveIntegrationId(null);
                    }}
                />
            )}

            <DiscoveryReviewModal
                isOpen={showReview}
                onClose={() => setShowReview(false)}
                discoveredProjects={discoveredProjects}
                onConfirm={(projects) => {
                    confirmDiscoveredProjects(projects);
                    setShowReview(false);
                }}
                integrationColors={colorMap}
            />
        </div>
    );
};

interface IntegrationCardProps {
    integration: Integration;
    projectCount: number;
    onToggle: () => void;
    onSettings: () => void;
    delay: number;
    isDiscovering: boolean;
}

const IntegrationCard: FC<IntegrationCardProps> = ({ integration, projectCount, onToggle, onSettings, delay, isDiscovering }) => {
    const Icon = getIcon(integration.icon);
    const isConnected = integration.status === 'connected';
    const isComingSoon = integration.comingSoon;

    return (
        <motion.div
            className={`integration-card ${isConnected ? 'connected' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={!isComingSoon ? { y: -4 } : undefined}
        >
            {/* Gradient top bar */}
            <div
                className="integration-card-bar"
                style={{ background: isConnected ? integration.gradient : 'var(--border)' }}
            />

            <div className="integration-card-body">
                <div className="integration-card-head">
                    <div
                        className="integration-icon-wrap"
                        style={{
                            backgroundColor: isConnected ? `${integration.color}14` : 'var(--hover)',
                            color: isConnected ? integration.color : 'var(--text-secondary)',
                        }}
                    >
                        <Icon size={24} />
                    </div>

                    {isComingSoon && (
                        <span className="coming-soon-badge">Coming Soon</span>
                    )}

                    {isConnected && !isComingSoon && (
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onSettings(); }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <Settings size={14} />
                            </motion.button>
                            <div className="connected-indicator">
                                <Check size={12} />
                                <span>Connected</span>
                            </div>
                        </div>
                    )}
                </div>

                <h3 className="integration-card-name">{integration.name}</h3>
                <p className="integration-card-desc">{integration.description}</p>

                {/* Connected Info */}
                {isConnected && (
                    <motion.div
                        className="integration-sync-info"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        <div className="sync-row">
                            <RefreshCw size={12} className={isDiscovering ? 'animate-spin' : ''} />
                            <span>{isDiscovering ? 'Scanning...' : `Last synced: ${integration.lastSynced}`}</span>
                        </div>
                        {integration.syncedItems && (
                            <div className="sync-row">
                                <ExternalLink size={12} />
                                <span>{integration.syncedItems} items synced</span>
                            </div>
                        )}
                        {projectCount > 0 && (
                            <div className="sync-row highlight">
                                <Zap size={12} />
                                <span>{projectCount} project{projectCount > 1 ? 's' : ''} detected</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Action Button */}
                {!isComingSoon && (
                    <motion.button
                        className={`integration-toggle-btn ${isConnected ? 'disconnect' : 'connect'}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggle}
                    >
                        {isConnected ? (
                            <>
                                <Settings size={14} />
                                Configure
                            </>
                        ) : (
                            <>
                                <Zap size={14} />
                                Connect
                            </>
                        )}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};
