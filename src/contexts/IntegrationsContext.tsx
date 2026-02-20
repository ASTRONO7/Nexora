import { createContext, useContext, useState, useEffect, useCallback, type FC, type ReactNode } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import type { Integration, IntegrationProject, IntegrationId, IntegrationSettings } from '../types/integrations';
import { MOCK_INTEGRATIONS } from '../data/mockIntegrations';

interface IntegrationsContextType {
    integrations: Integration[];
    projects: IntegrationProject[];
    toggleIntegration: (id: IntegrationId) => Promise<void>;
    updateIntegrationSettings: (id: IntegrationId, settings: Partial<IntegrationSettings>) => Promise<void>;
    startDiscovery: (id: IntegrationId) => Promise<void>;
    confirmDiscoveredProjects: (projectsToImport: IntegrationProject[]) => Promise<void>;
    getProjectsBySource: (source: IntegrationId) => IntegrationProject[];
    connectedCount: number;
    totalProjects: number;
    totalTasks: number;
    totalInsights: number;
    isDiscovering: boolean;
    discoveredProjects: IntegrationProject[];
}

const IntegrationsContext = createContext<IntegrationsContextType | null>(null);

const BACKEND_URL = ''; // Now using local /api routes on the same domain

export const IntegrationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
    const [projects, setProjects] = useState<IntegrationProject[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveredProjects, setDiscoveredProjects] = useState<IntegrationProject[]>([]);

    // 1. Sync Integrations Status from Firestore
    useEffect(() => {
        if (!currentUser) {
            setIntegrations(MOCK_INTEGRATIONS);
            return;
        }

        const unsub = onSnapshot(collection(db, 'users', currentUser.uid, 'integrations'), (snapshot) => {
            const firestoreIntegrations = snapshot.docs.reduce((acc, doc) => ({
                ...acc,
                [doc.id]: doc.data()
            }), {} as Record<string, any>);

            setIntegrations(prev => prev.map(int => ({
                ...int,
                ...(firestoreIntegrations[int.id] || { status: 'disconnected' }),
                // Ensure status is correctly mapped if it's missing from firestore
                status: firestoreIntegrations[int.id]?.status || 'disconnected'
            } as Integration)));
        });

        return unsub;
    }, [currentUser]);

    // 2. Sync Projects from Firestore
    useEffect(() => {
        if (!currentUser) {
            setProjects([]);
            return;
        }

        const unsub = onSnapshot(collection(db, 'users', currentUser.uid, 'projects'), (snapshot) => {
            const projectList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as IntegrationProject));
            setProjects(projectList);
        });

        return unsub;
    }, [currentUser]);

    const toggleIntegration = useCallback(async (id: IntegrationId) => {
        if (!currentUser) return;

        const integration = integrations.find(i => i.id === id);
        if (!integration) return;

        const idToken = await currentUser.getIdToken();

        if (integration.status === 'connected') {
            // Disconnect via backend
            try {
                const response = await fetch(`${BACKEND_URL}/api/integrations/${id}/disconnect`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) throw new Error(`Disconnect failed with status ${response.status}`);
            } catch (error: any) {
                console.error('Disconnect failed:', error);
                throw error;
            }
        } else {
            // Connect - Get OAuth URL from backend
            try {
                const response = await fetch(`${BACKEND_URL}/api/integrations/${id}/start`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });

                if (!response.ok) {
                    const text = await response.text();
                    let errorMessage = `Failed to start OAuth (${response.status})`;
                    if (text && text.includes('<!doctype html>')) {
                        errorMessage = 'API routing issue: Server returned HTML instead of JSON. Please check backend logs.';
                    } else if (text) {
                        errorMessage = text;
                    }
                    throw new Error(errorMessage);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    const preview = text.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    throw new Error(`Server returned invalid response. Preview: ${preview}`);
                }

                const { url } = await response.json();
                if (!url) throw new Error('No redirect URL received from server');
                window.location.href = url;
            } catch (error: any) {
                console.error('Connect failed:', error);
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('Backend server is not reachable. Please ensure the API is running.');
                }
                throw error;
            }
        }
    }, [currentUser, integrations]);

    const updateIntegrationSettings = useCallback(async (id: IntegrationId, settings: Partial<IntegrationSettings>) => {
        if (!currentUser) return;

        await setDoc(doc(db, 'users', currentUser.uid, 'integrations', id), {
            settings
        }, { merge: true });
    }, [currentUser]);

    const startDiscovery = useCallback(async (id: IntegrationId) => {
        if (!currentUser) return;

        const idToken = await currentUser.getIdToken();
        setIsDiscovering(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/integrations/${id}/projects`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (!response.ok) throw new Error('Failed to fetch projects');

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                const preview = text.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                throw new Error(`Invalid response during discovery. Preview: ${preview}`);
            }

            const result = await response.json();
            const discovered: IntegrationProject[] = result.projects;

            // Filter out projects already in our list
            const newDiscovered = discovered.filter(p =>
                !projects.some(existing => existing.id === p.id)
            );

            setDiscoveredProjects(newDiscovered);
        } catch (error) {
            console.error('Discovery failed:', error);
        } finally {
            setIsDiscovering(false);
        }
    }, [currentUser, projects]);

    const confirmDiscoveredProjects = useCallback(async (projectsToImport: IntegrationProject[]) => {
        if (!currentUser) return;

        const userProjectsRef = collection(db, 'users', currentUser.uid, 'projects');

        const promises = projectsToImport.map(p => {
            return setDoc(doc(userProjectsRef, p.id), {
                ...p,
                status: 'active',
                isDiscovered: false,
                importedAt: new Date().toISOString()
            });
        });

        await Promise.all(promises);
        setDiscoveredProjects(prev => prev.filter(p => !projectsToImport.some(imported => imported.id === p.id)));
    }, [currentUser]);

    const getProjectsBySource = useCallback(
        (source: IntegrationId) => projects.filter(p => p.sources.includes(source)),
        [projects]
    );

    const connectedCount = integrations.filter(i => i.status === 'connected').length;
    const totalProjects = projects.length;
    const totalTasks = projects.reduce((acc, p) => acc + (p.stats.tasks?.total || 0), 0);
    const totalInsights = projects.reduce((acc, p) => acc + (p.aiInsights?.length || 0), 0);

    return (
        <IntegrationsContext.Provider
            value={{
                integrations,
                projects,
                toggleIntegration,
                updateIntegrationSettings,
                startDiscovery,
                confirmDiscoveredProjects,
                getProjectsBySource,
                connectedCount,
                totalProjects,
                totalTasks,
                totalInsights,
                isDiscovering,
                discoveredProjects,
            }}
        >
            {children}
        </IntegrationsContext.Provider>
    );
};

export const useIntegrations = () => {
    const ctx = useContext(IntegrationsContext);
    if (!ctx) throw new Error('useIntegrations must be used within IntegrationsProvider');
    return ctx;
};
