import { useState, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, FolderKanban, CheckSquare, Brain, TrendingUp,
    AlertTriangle, ChevronRight, Clock, GitCommit, FileText,
    MessageSquare, GitPullRequest, AlertCircle, Sparkles,
    Activity, ArrowUpRight, Target
} from 'lucide-react';
import { useIntegrations } from '../contexts/IntegrationsContext';
import type { IntegrationProject, IntegrationId, AIInsight, ActivityItem as ActivityItemType } from '../types/integrations';
import { ProjectDetailPanel } from './ProjectDetailPanel';

const SOURCE_META: Record<IntegrationId, { label: string; color: string; abbr: string }> = {
    github: { label: 'GitHub', color: '#24292F', abbr: 'GH' },
    notion: { label: 'Notion', color: '#000000', abbr: 'NT' },
    slack: { label: 'Slack', color: '#4A154B', abbr: 'SL' },
    linear: { label: 'Linear', color: '#5E6AD2', abbr: 'LN' },
    cloud_storage: { label: 'Cloud', color: '#4285F4', abbr: 'CS' },
    internal_api: { label: 'API', color: '#10B981', abbr: 'AP' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    paused: { label: 'Paused', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    completed: { label: 'Done', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    at_risk: { label: 'At Risk', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const INSIGHT_ICONS: Record<AIInsight['type'], typeof AlertTriangle> = {
    blocker: AlertCircle,
    warning: AlertTriangle,
    suggestion: Sparkles,
    progress: TrendingUp,
    achievement: Target,
};

const ACTIVITY_ICONS: Record<ActivityItemType['type'], typeof GitCommit> = {
    commit: GitCommit,
    task_completed: CheckSquare,
    doc_updated: FileText,
    message: MessageSquare,
    pr_merged: GitPullRequest,
    issue_opened: AlertCircle,
    sprint_update: Activity,
    file_uploaded: FileText,
};

interface DashboardViewProps {
    onNavigateToIntegrations: () => void;
}

export const DashboardView: FC<DashboardViewProps> = ({ onNavigateToIntegrations }) => {
    const { projects, connectedCount, totalProjects, totalTasks, totalInsights } = useIntegrations();
    const [selectedProject, setSelectedProject] = useState<IntegrationProject | null>(null);

    // Gather all insights sorted by priority
    const allInsights = projects
        .flatMap(p => p.aiInsights.map(i => ({ ...i, projectName: p.name })))
        .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.priority] - order[b.priority];
        });

    const topInsight = allInsights[0];

    // Gather all activities
    const allActivities = projects
        .flatMap(p => p.activities.map(a => ({ ...a, projectName: p.name })))
        .slice(0, 8);

    const statCards = [
        { icon: FolderKanban, label: 'Projects', value: totalProjects, color: '#3B82F6' },
        { icon: CheckSquare, label: 'Total Tasks', value: totalTasks, color: '#10B981' },
        { icon: Zap, label: 'Connected', value: connectedCount, color: '#F59E0B' },
        { icon: Brain, label: 'AI Insights', value: totalInsights, color: '#8B5CF6' },
    ];

    return (
        <div className="dashboard-view">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Workspace</h1>
                    <p className="dashboard-subtitle">Your unified project intelligence</p>
                </div>
                <motion.button
                    className="dashboard-connect-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNavigateToIntegrations}
                >
                    <Zap size={16} />
                    Manage Integrations
                </motion.button>
            </div>

            {/* AI God Mode Banner */}
            {topInsight && (
                <motion.div
                    className="ai-banner"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="ai-banner-icon">
                        <Brain size={20} />
                    </div>
                    <div className="ai-banner-content">
                        <span className="ai-banner-label">NEXORA AI INSIGHT</span>
                        <p className="ai-banner-text">
                            <strong>{topInsight.projectName}:</strong> {topInsight.description}
                        </p>
                    </div>
                    <div className={`ai-banner-priority priority-${topInsight.priority}`}>
                        {topInsight.priority}
                    </div>
                </motion.div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                    >
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}14`, color: stat.color }}>
                            <stat.icon size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content">
                {/* Projects Section */}
                <div className="dashboard-projects">
                    <div className="section-header">
                        <h2 className="section-title">Auto-Detected Projects</h2>
                        <span className="section-badge">{totalProjects} projects</span>
                    </div>

                    {projects.length === 0 ? (
                        <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Zap size={48} strokeWidth={1} />
                            <h3>No Projects Detected</h3>
                            <p>Connect your tools to auto-discover projects</p>
                            <motion.button
                                className="empty-state-btn"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onNavigateToIntegrations}
                            >
                                Connect Integration
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="projects-grid">
                            <AnimatePresence>
                                {projects.map((project, i) => (
                                    <motion.div
                                        key={project.id}
                                        className="project-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: 0.06 * i }}
                                        whileHover={{ y: -3 }}
                                        onClick={() => setSelectedProject(project)}
                                    >
                                        {/* Card Header */}
                                        <div className="project-card-header">
                                            <div className="project-card-title-row">
                                                <div className="project-color-dot" style={{ backgroundColor: project.color }} />
                                                <h3 className="project-card-name">{project.name}</h3>
                                                <ChevronRight size={16} className="project-card-arrow" />
                                            </div>
                                            <div className="project-card-meta">
                                                <div className="project-sources">
                                                    {project.sources.map(s => (
                                                        <span
                                                            key={s}
                                                            className="source-badge"
                                                            style={{ backgroundColor: `${SOURCE_META[s].color}18`, color: SOURCE_META[s].color }}
                                                        >
                                                            {SOURCE_META[s].abbr}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span
                                                    className="status-badge"
                                                    style={{ backgroundColor: STATUS_CONFIG[project.status].bg, color: STATUS_CONFIG[project.status].color }}
                                                >
                                                    {STATUS_CONFIG[project.status].label}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="project-card-desc">{project.description}</p>

                                        {/* Stats Row */}
                                        <div className="project-card-stats">
                                            {project.stats.tasks && (
                                                <div className="mini-stat">
                                                    <CheckSquare size={13} />
                                                    <span>{project.stats.tasks.total} tasks</span>
                                                </div>
                                            )}
                                            {project.stats.docs && (
                                                <div className="mini-stat">
                                                    <FileText size={13} />
                                                    <span>{project.stats.docs.total} docs</span>
                                                </div>
                                            )}
                                            {project.stats.commits && (
                                                <div className="mini-stat">
                                                    <GitCommit size={13} />
                                                    <span>{project.stats.commits.total} commits</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="progress-bar-container">
                                            <div className="progress-bar-track">
                                                <motion.div
                                                    className="progress-bar-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${project.progress}%` }}
                                                    transition={{ duration: 0.8, delay: 0.1 * i }}
                                                    style={{ backgroundColor: project.color }}
                                                />
                                            </div>
                                            <span className="progress-label">{project.progress}%</span>
                                        </div>

                                        {/* Footer */}
                                        <div className="project-card-footer">
                                            <div className="last-activity">
                                                <Clock size={12} />
                                                <span>{project.lastActivity}</span>
                                            </div>
                                            {project.aiInsights.length > 0 && (
                                                <div className="insights-count">
                                                    <Brain size={12} />
                                                    <span>{project.aiInsights.length} insights</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Alert Strip */}
                                        {project.aiInsights.some(i => i.priority === 'critical' || i.priority === 'high') && (
                                            <div className="project-alert-strip">
                                                <AlertTriangle size={12} />
                                                <span>{project.aiInsights.find(i => i.priority === 'critical' || i.priority === 'high')?.title}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Right Sidebar — Activity & Insights */}
                <div className="dashboard-sidebar-panel">
                    {/* Activity Feed */}
                    <div className="activity-section">
                        <h3 className="section-title">Recent Activity</h3>
                        <div className="activity-feed">
                            {allActivities.map((act, i) => {
                                const ActivityIcon = ACTIVITY_ICONS[act.type] || Activity;
                                return (
                                    <motion.div
                                        key={act.id}
                                        className="activity-item"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.04 * i }}
                                    >
                                        <div className="activity-icon-wrap" style={{ color: SOURCE_META[act.source]?.color }}>
                                            <ActivityIcon size={14} />
                                        </div>
                                        <div className="activity-details">
                                            <span className="activity-title">{act.title}</span>
                                            <span className="activity-meta">
                                                {(act as ActivityItemType & { projectName?: string }).projectName} · {act.timestamp}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Insights List */}
                    <div className="insights-section">
                        <h3 className="section-title">
                            <Brain size={16} /> AI Insights
                        </h3>
                        <div className="insights-list">
                            {allInsights.slice(0, 5).map((insight, i) => {
                                const InsightIcon = INSIGHT_ICONS[insight.type] || Sparkles;
                                return (
                                    <motion.div
                                        key={insight.id}
                                        className={`insight-card priority-border-${insight.priority}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                    >
                                        <div className="insight-header">
                                            <InsightIcon size={14} />
                                            <span className="insight-title">{insight.title}</span>
                                        </div>
                                        <p className="insight-desc">{insight.description}</p>
                                        <div className="insight-footer">
                                            <span className="insight-project">{(insight as AIInsight & { projectName?: string }).projectName}</span>
                                            <span className="insight-time">{insight.timestamp}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Action */}
                    <motion.button
                        className="quick-action-btn"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={onNavigateToIntegrations}
                    >
                        <ArrowUpRight size={16} />
                        Connect more tools
                    </motion.button>
                </div>
            </div>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectDetailPanel
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
