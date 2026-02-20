// Integration service types for Nexora Workspace

export type IntegrationId = 'github' | 'notion' | 'slack' | 'linear' | 'cloud_storage' | 'internal_api';

export type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export type PermissionLevel = 'read_only' | 'suggest' | 'act';

export type SyncFrequency = 'manual' | '15m' | '1h' | 'daily';

export interface IntegrationSettings {
    permissions: PermissionLevel;
    importProjects: boolean;
    importTasks: boolean;
    importFiles: boolean;
    allowAISummary: boolean;
    allowAIActions: boolean;
    autoSync: boolean;
    syncFrequency: SyncFrequency;
}

export interface Integration {
    id: IntegrationId;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    color: string;
    gradient: string;
    status: IntegrationStatus;
    settings: IntegrationSettings;
    connectedAt?: string;
    lastSynced?: string;
    syncedItems?: number;
    comingSoon?: boolean;
}

export interface ProjectSource {
    id: string; // original ID from source (e.g., repo ID, database ID)
    integrationId: IntegrationId;
    name: string;
    url?: string;
    type: 'repo' | 'database' | 'channel' | 'folder' | 'project';
    lastActivity?: string;
}

export interface ProjectStats {
    tasks?: { total: number; completed: number; inProgress: number; pending: number };
    docs?: { total: number; recent: string[] };
    commits?: { total: number; lastCommitAgo: string; contributors: number };
    issues?: { open: number; closed: number };
    pullRequests?: { open: number; merged: number };
    messages?: { unread: number; lastDiscussion: string; decisionPending?: string };
    sprint?: { name: string; tasksInProgress: number; completed: number; bugsUnresolved: number };
    files?: { total: number; types: string[] };
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'at_risk';

export interface IntegrationProject {
    id: string; // Nexora unified ID
    name: string;
    description: string;
    sources: IntegrationId[]; // List of connected integration types
    linkedSources: ProjectSource[]; // Detailed source info
    status: ProjectStatus;
    stats: ProjectStats;
    lastActivity: string;
    progress: number; // 0–100
    color: string;
    aiInsights: AIInsight[];
    activities: ActivityItem[];
    confidenceScore?: number; // For discovery/matching (0-1)
    isDiscovered?: boolean; // If true, needs confirmation
}

export interface AIInsight {
    id: string;
    type: 'blocker' | 'suggestion' | 'progress' | 'warning' | 'achievement';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    relatedSource?: IntegrationId;
    timestamp: string;
}

export interface ActivityItem {
    id: string;
    type: 'commit' | 'task_completed' | 'doc_updated' | 'message' | 'pr_merged' | 'issue_opened' | 'sprint_update' | 'file_uploaded';
    title: string;
    description: string;
    source: IntegrationId;
    timestamp: string;
    user?: string;
}
