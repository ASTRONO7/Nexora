import { useState, type FC } from 'react';
import { motion } from 'framer-motion';
import {
    X, CheckSquare, FileText, GitCommit, Clock, Brain,
    AlertTriangle, AlertCircle, Sparkles, TrendingUp, Target,
    Activity, MessageSquare, GitPullRequest, Users
} from 'lucide-react';
import type { IntegrationProject, IntegrationId, AIInsight, ActivityItem } from '../types/integrations';

type Tab = 'overview' | 'tasks' | 'activity' | 'insights';

const SOURCE_META: Record<IntegrationId, { label: string; color: string }> = {
    github: { label: 'GitHub', color: '#24292F' },
    notion: { label: 'Notion', color: '#000000' },
    slack: { label: 'Slack', color: '#4A154B' },
    linear: { label: 'Linear', color: '#5E6AD2' },
    cloud_storage: { label: 'Cloud Storage', color: '#4285F4' },
    internal_api: { label: 'Internal API', color: '#10B981' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    paused: { label: 'Paused', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    completed: { label: 'Completed', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    at_risk: { label: 'At Risk', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const INSIGHT_COLORS: Record<AIInsight['type'], string> = {
    blocker: '#EF4444',
    warning: '#F59E0B',
    suggestion: '#8B5CF6',
    progress: '#10B981',
    achievement: '#3B82F6',
};

const INSIGHT_ICONS: Record<AIInsight['type'], typeof AlertTriangle> = {
    blocker: AlertCircle,
    warning: AlertTriangle,
    suggestion: Sparkles,
    progress: TrendingUp,
    achievement: Target,
};

const ACTIVITY_ICONS: Record<ActivityItem['type'], typeof GitCommit> = {
    commit: GitCommit,
    task_completed: CheckSquare,
    doc_updated: FileText,
    message: MessageSquare,
    pr_merged: GitPullRequest,
    issue_opened: AlertCircle,
    sprint_update: Activity,
    file_uploaded: FileText,
};

interface ProjectDetailPanelProps {
    project: IntegrationProject;
    onClose: () => void;
}

export const ProjectDetailPanel: FC<ProjectDetailPanelProps> = ({ project, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'tasks', label: 'Tasks & Docs', icon: CheckSquare },
        { id: 'activity', label: 'Activity', icon: Clock },
        { id: 'insights', label: 'AI Insights', icon: Brain },
    ];

    return (
        <>
            {/* Backdrop */}
            <motion.div
                className="detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                className="detail-panel"
                initial={{ opacity: 0, x: 40, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
                {/* Header */}
                <div className="detail-header">
                    <div className="detail-header-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="detail-color-dot" style={{ backgroundColor: project.color }} />
                            <div>
                                <h2 className="detail-title">{project.name}</h2>
                                <p className="detail-desc">{project.description}</p>
                            </div>
                        </div>
                        <motion.button
                            className="detail-close-btn"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    {/* Source badges & status */}
                    <div className="detail-meta">
                        <div className="detail-sources">
                            {project.sources.map(s => (
                                <span
                                    key={s}
                                    className="detail-source-badge"
                                    style={{ backgroundColor: `${SOURCE_META[s].color}14`, color: SOURCE_META[s].color }}
                                >
                                    {SOURCE_META[s].label}
                                </span>
                            ))}
                        </div>
                        <span
                            className="detail-status-badge"
                            style={{ backgroundColor: STATUS_CONFIG[project.status].bg, color: STATUS_CONFIG[project.status].color }}
                        >
                            {STATUS_CONFIG[project.status].label}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="detail-progress-section">
                        <div className="detail-progress-bar-bg">
                            <motion.div
                                className="detail-progress-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress}%` }}
                                transition={{ duration: 0.8 }}
                                style={{ backgroundColor: project.color }}
                            />
                        </div>
                        <span className="detail-progress-label">{project.progress}% complete</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="detail-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="detail-content">
                    {activeTab === 'overview' && <OverviewTab project={project} />}
                    {activeTab === 'tasks' && <TasksTab project={project} />}
                    {activeTab === 'activity' && <ActivityTab project={project} />}
                    {activeTab === 'insights' && <InsightsTab project={project} />}
                </div>
            </motion.div>
        </>
    );
};

/* ──────── Overview Tab ──────── */
const OverviewTab: FC<{ project: IntegrationProject }> = ({ project }) => {
    const { stats } = project;
    const gridItems = [
        stats.tasks && { icon: CheckSquare, label: 'Tasks', value: `${stats.tasks.completed}/${stats.tasks.total}`, sub: `${stats.tasks.inProgress} in progress`, color: '#10B981' },
        stats.commits && { icon: GitCommit, label: 'Commits', value: stats.commits.total, sub: `Last: ${stats.commits.lastCommitAgo}`, color: '#3B82F6' },
        stats.issues && { icon: AlertCircle, label: 'Issues', value: `${stats.issues.open} open`, sub: `${stats.issues.closed} closed`, color: '#F59E0B' },
        stats.pullRequests && { icon: GitPullRequest, label: 'Pull Requests', value: `${stats.pullRequests.open} open`, sub: `${stats.pullRequests.merged} merged`, color: '#8B5CF6' },
        stats.docs && { icon: FileText, label: 'Documents', value: stats.docs.total, sub: stats.docs.recent.slice(0, 2).join(', '), color: '#EC4899' },
        stats.commits && { icon: Users, label: 'Contributors', value: stats.commits.contributors, sub: 'Active team members', color: '#6366F1' },
    ].filter(Boolean);

    return (
        <div className="overview-grid">
            {gridItems.map((item, i) => {
                if (!item) return null;
                return (
                    <motion.div
                        key={item.label}
                        className="overview-stat-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                    >
                        <div className="overview-stat-icon" style={{ color: item.color, backgroundColor: `${item.color}14` }}>
                            <item.icon size={18} />
                        </div>
                        <div className="overview-stat-info">
                            <span className="overview-stat-label">{item.label}</span>
                            <span className="overview-stat-value">{item.value}</span>
                            <span className="overview-stat-sub">{item.sub}</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

/* ──────── Tasks & Docs Tab ──────── */
const TasksTab: FC<{ project: IntegrationProject }> = ({ project }) => {
    const { stats } = project;
    return (
        <div className="tasks-tab">
            {stats.tasks && (
                <div className="tasks-section-group">
                    <h4 className="tab-section-title">Task Breakdown</h4>
                    <div className="tasks-breakdown">
                        <div className="task-row">
                            <span className="task-dot" style={{ backgroundColor: '#10B981' }} />
                            <span>Completed</span>
                            <span className="task-count">{stats.tasks.completed}</span>
                        </div>
                        <div className="task-row">
                            <span className="task-dot" style={{ backgroundColor: '#3B82F6' }} />
                            <span>In Progress</span>
                            <span className="task-count">{stats.tasks.inProgress}</span>
                        </div>
                        <div className="task-row">
                            <span className="task-dot" style={{ backgroundColor: '#A1A1A1' }} />
                            <span>Pending</span>
                            <span className="task-count">{stats.tasks.pending}</span>
                        </div>
                    </div>
                </div>
            )}

            {stats.docs && (
                <div className="tasks-section-group">
                    <h4 className="tab-section-title">Recent Documents</h4>
                    <div className="doc-list">
                        {stats.docs.recent.map((doc, i) => (
                            <motion.div
                                key={doc}
                                className="doc-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.04 * i }}
                            >
                                <FileText size={14} />
                                <span>{doc}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {stats.files && (
                <div className="tasks-section-group">
                    <h4 className="tab-section-title">Files ({stats.files.total})</h4>
                    <div className="file-type-tags">
                        {stats.files.types.map(t => (
                            <span key={t} className="file-type-tag">{t}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ──────── Activity Tab ──────── */
const ActivityTab: FC<{ project: IntegrationProject }> = ({ project }) => (
    <div className="activity-tab">
        {project.activities.map((act, i) => {
            const Icon = ACTIVITY_ICONS[act.type] || Activity;
            return (
                <motion.div
                    key={act.id}
                    className="activity-timeline-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                >
                    <div className="timeline-line" />
                    <div className="timeline-dot" style={{ borderColor: SOURCE_META[act.source]?.color }} />
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <Icon size={14} style={{ color: SOURCE_META[act.source]?.color }} />
                            <span className="timeline-title">{act.title}</span>
                        </div>
                        <p className="timeline-desc">{act.description}</p>
                        <div className="timeline-meta">
                            {act.user && <span className="timeline-user">{act.user}</span>}
                            <span className="timeline-time">{act.timestamp}</span>
                            <span className="timeline-source" style={{ color: SOURCE_META[act.source]?.color }}>
                                {SOURCE_META[act.source]?.label}
                            </span>
                        </div>
                    </div>
                </motion.div>
            );
        })}
    </div>
);

/* ──────── AI Insights Tab ──────── */
const InsightsTab: FC<{ project: IntegrationProject }> = ({ project }) => (
    <div className="insights-tab">
        {project.aiInsights.map((insight, i) => {
            const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
            const color = INSIGHT_COLORS[insight.type];
            return (
                <motion.div
                    key={insight.id}
                    className="insight-detail-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    style={{ borderLeftColor: color }}
                >
                    <div className="insight-detail-header">
                        <div className="insight-detail-icon" style={{ color, backgroundColor: `${color}14` }}>
                            <Icon size={16} />
                        </div>
                        <div>
                            <h4 className="insight-detail-title">{insight.title}</h4>
                            <span className={`insight-priority-badge priority-bg-${insight.priority}`}>
                                {insight.priority}
                            </span>
                        </div>
                    </div>
                    <p className="insight-detail-desc">{insight.description}</p>
                    <div className="insight-detail-footer">
                        <span>{insight.timestamp}</span>
                        {insight.relatedSource && (
                            <span style={{ color: SOURCE_META[insight.relatedSource]?.color }}>
                                via {SOURCE_META[insight.relatedSource]?.label}
                            </span>
                        )}
                    </div>
                </motion.div>
            );
        })}
    </div>
);
