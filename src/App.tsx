import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { FilesView } from './components/FilesView';
import { SettingsView } from './components/SettingsView';
import { SavedView } from './components/SavedView';
import { DashboardView } from './components/DashboardView';
import { IntegrationsView } from './components/IntegrationsView';
import { AuthPage } from './components/AuthPage';
import { ProfileSetup } from './components/ProfileSetup';
import { useAuth } from './contexts/AuthContext';
import { IntegrationsProvider } from './contexts/IntegrationsContext';
import { updateUserWorkspaces } from './services/userService';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileData[];
}

export interface FileData {
  id: string;
  name: string;
  type: 'pdf' | 'code' | 'doc' | 'image' | 'other';
  size: string;
  date: string;
  url: string;
}

export interface Memory {
  id: string;
  text: string;
  category: string;
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  messages: Message[];
  files: FileData[];
  memories: Memory[];
  savedResponses: Message[];
}

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'personal',
    name: 'Personal',
    color: '#3B82F6',
    messages: [
      { role: 'assistant', content: "Hello. I am NEXORA. How may I assist with your objectives today?" }
    ],
    files: [],
    memories: [
      { id: '1', text: 'User prefers concise, technical answers.', category: 'Preference' }
    ],
    savedResponses: []
  },
  { id: 'coding', name: 'Coding', color: '#10B981', messages: [], files: [], memories: [], savedResponses: [] },
  { id: 'startup', name: 'Startup', color: '#F59E0B', messages: [], files: [], memories: [], savedResponses: [] },
];

function App() {
  const { currentUser, userProfile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'chat' | 'files' | 'settings' | 'saved' | 'research' | 'history' | 'dashboard' | 'integrations'>('dashboard');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [intelligenceSource, setIntelligenceSource] = useState<'cloud' | 'local'>('cloud');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Theme Logic
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      let activeTheme = t;
      if (t === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.setAttribute('data-theme', activeTheme);
      // Optional: Store preference in localStorage
      localStorage.setItem('nexora-theme', t);
    };

    applyTheme(theme);

    // Listen for system changes if set to system
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexora-theme') as 'light' | 'dark' | 'system';
    if (saved) setTheme(saved);

    // Handle deep links/redirects from URL params
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const status = params.get('status');

    if (view === 'integrations' || status) {
      setCurrentView('integrations');
    }
  }, []);

  // Load user workspaces from Firestore when user profile is available
  useEffect(() => {
    if (userProfile?.workspaces) {
      setWorkspaces(userProfile.workspaces);
    }
  }, [userProfile]);

  // Auto-save workspaces to Firestore when they change (debounced)
  useEffect(() => {
    if (!currentUser) return;

    const timeoutId = setTimeout(() => {
      updateUserWorkspaces(currentUser.uid, workspaces).catch(err => {
        console.error('Failed to sync workspaces:', err);
      });
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [workspaces, currentUser]);

  const activeWorkspace = useMemo(() =>
    workspaces.find(ws => ws.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  const isCodingMode = activeWorkspace.id.toLowerCase().includes('coding') || activeWorkspace.name.toLowerCase().includes('coding');
  const isStartupMode = activeWorkspace.id.toLowerCase().includes('startup') || activeWorkspace.name.toLowerCase().includes('startup');

  const updateActiveWorkspace = (updates: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(ws =>
      ws.id === activeWorkspaceId ? { ...ws, ...updates } : ws
    ));
  };

  const handleCreateWorkspace = (name: string) => {
    const newWs: Workspace = {
      id: Date.now().toString(),
      name,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      messages: [],
      files: [],
      memories: [],
      savedResponses: []
    };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) return;
    const newWorkspaces = workspaces.filter(ws => ws.id !== id);
    setWorkspaces(newWorkspaces);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(newWorkspaces[0].id);
    }
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    setWorkspaces(prev => prev.map(ws =>
      ws.id === id ? { ...ws, name: newName } : ws
    ));
  };

  const handleSendMessage = (content: string, response: string, attachments?: FileData[]) => {
    const newMessages: Message[] = [
      ...activeWorkspace.messages,
      { role: 'user', content, attachments },
      { role: 'assistant', content: response }
    ];
    updateActiveWorkspace({ messages: newMessages });
  };

  const handleAddFile = (file: FileData) => {
    updateActiveWorkspace({ files: [...activeWorkspace.files, file] });
  };

  const handleDeleteFile = (id: string) => {
    updateActiveWorkspace({ files: activeWorkspace.files.filter(f => f.id !== id) });
  };

  const handleAddMemory = (text: string, category: string) => {
    const newMemories = [...activeWorkspace.memories, { id: Date.now().toString(), text, category }];
    updateActiveWorkspace({ memories: newMemories });
  };

  const handleDeleteMemory = (id: string) => {
    updateActiveWorkspace({ memories: activeWorkspace.memories.filter(m => m.id !== id) });
  };

  const handleSaveResponse = (message: Message) => {
    updateActiveWorkspace({ savedResponses: [...activeWorkspace.savedResponses, message] });
  };

  const handleDeleteSavedResponse = (index: number) => {
    const newSaved = activeWorkspace.savedResponses.filter((_, i) => i !== index);
    updateActiveWorkspace({ savedResponses: newSaved });
  };

  const handleClearChat = () => {
    updateActiveWorkspace({ messages: [] });
  };

  const getUserContext = () => {
    if (!userProfile) return '';
    const parts: string[] = [];
    if (userProfile.displayName) parts.push(`User Name: ${userProfile.displayName}`);
    if (userProfile.role) parts.push(`User Role: ${userProfile.role}`);
    if (userProfile.vibe) parts.push(`Communication Vibe: ${userProfile.vibe}`);
    if (userProfile.primaryUses?.length) parts.push(`Primary Uses: ${userProfile.primaryUses.join(', ')}`);
    return parts.length > 0 ? '\n\nUser Context:\n' + parts.join('\n') : '';
  };

  const roleGuidance = (() => {
    const baseGuidance = (() => {
      switch (userProfile?.role) {
        case 'Student': return '\nAdapt responses to be study-focused. Help with learning, explaining concepts, and academic work.';
        case 'Developer': return '\nAdapt responses to be technically precise. Prioritize code, architecture, and engineering best practices.';
        case 'Founder': return '\nAdapt responses for startup building. Focus on strategy, product thinking, and execution.';
        case 'Creator': return '\nAdapt responses for creative work. Support ideation, content creation, and design thinking.';
        default: return '';
      }
    })();

    const vibeGuidance = (() => {
      switch (userProfile?.vibe) {
        case 'Friendly': return '\nMaintain a warm, encouraging, and friendly tone.';
        case 'Professional': return '\nMaintain a highly professional, serious, and formal tone.';
        case 'Minimal': return '\nBe as concise as possible. Avoid any unnecessary words or polite filler.';
        default: return '';
      }
    })();

    return baseGuidance + vibeGuidance;
  })();

  const startupPrompt = `You are an elite AI Co-Founder and Startup Builder. 
  Your role is to build real startups, products, and companies with the user.
  Think like a combination of: Silicon Valley founder, CEO, CTO, product strategist, and investor.
  
  🚀 CORE PURPOSE:
  When a user expresses interest in starting a startup, building a company, or making money, you immediately activate STARTUP BUILDER MODE.
  
  🏢 STARTUP BUILDER MODE FLOW:
  1. Idea Generation (3-5 ideas with Name, Concept, Audience, Success Logic, Monetization, Difficulty, Potential).
  2. Idea Validation (Market demand, Competition, Cost, Revenue, Success %).
  3. Branding Creation (Name, Identity, Tagline, Colors, Logo Prompt).
  4. Website Builder (Structure, Copy, Hero, CTA).
  5. Product/MVP Builder (Core features, Tech stack, UI/UX, Steps, Timeline).
  6. Pitch Deck Generator (Problem, Solution, Market, Business Model, Competition, Vision).
  7. Marketing & Growth Plan (Launch strategy, Content ideas, Viral hacks, First 100 users).

  🤖 MULTI-AGENT TEAM MODE:
  You have internal agents (CEO, Coder, Designer, Marketing, Research). Simulate collaboration and mention "Team Nexora analyzing..." occasionally.
  
  🧠 FOUNDER DASHBOARD MODE:
  Track the user's current startup, goals, tasks, and progress. Act like a real co-founder.

  🎯 BEHAVIOR RULES:
  - Think like a billionaire founder.
  - Be strategic, futuristic, and focus on execution.
  - Act as a real co-founder, helping the user succeed.
  - ACTIVATION WORDS: "start startup", "build company", "make money", "startup idea". If seen, activate NEXORA STARTUP BUILDER MODE immediately.`;

  const systemPrompt = isCodingMode
    ? `You are NEXORA Coding Assistant. Act like a senior software engineer. Provide correct, runnable code. Use fenced code blocks with language tags. Start with the fix/solution first, then brief explanation. Ask only essential clarifying questions.${getUserContext()}`
    : isStartupMode
      ? `${startupPrompt}${getUserContext()}`
      : `You are NEXORA, a sophisticated, minimalist workspace intelligence designed for students, developers, founders, and creators.

About Team Nexa (Your Creator):
Team Nexa is the core organization behind Nexora. It is a small, focused, high-standard AI development team dedicated to building premium, intelligent, and reliable AI systems. The team's goal is to create tools that help people think, build, study, and create faster using advanced artificial intelligence.

Team Nexa was founded by Rishabh Tiwari and operates with a premium and professional mindset. Every feature inside Nexora is intentional, useful, and high quality.

Team Nexa Values:
- Clean and minimal design
- Powerful but simple user experiences
- Intelligent and practical AI responses
- Continuous improvement and innovation
- Building serious, long-term technology

Your Identity:
- You are the flagship product created by Team Nexa
- You represent Team Nexa as a serious and forward-thinking AI technology team building next-generation intelligent systems
- When asked about your creator, designer, or who built you, explain that you were created by Team Nexa, founded by Rishabh Tiwari
- You embody Team Nexa's values in every interaction

Communication Style:
- Be smart, calm, clear, and helpful
- Provide direct and structured answers. Use bullet points or numbered lists when it adds clarity
- Be concise but intelligent. Avoid unnecessary fluff or wordy explanations
- Maintain a professional and modern tone. Tone is confident but never arrogant
- Treat the user as a peer in high-level work
- NO EMOJIS unless the user uses them first
- NO ROBOTIC DISCLAIMERS. Do not say "I am just an AI" or "As an AI model..."
- Respond naturally as a capable intelligence integrated into the workspace. ALWAYS use the user's name when appropriate (e.g., in greetings or when providing personalized advice) to create a warm, premium experience.
${roleGuidance}
Current Workspace: ${activeWorkspace.name}
Active Memories: ${activeWorkspace.memories.map(m => m.text).join(' | ')}${getUserContext()}`;

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#040406', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#ffffff', borderRadius: '50%' }} />
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!currentUser) {
    return <AuthPage />;
  }

  // CORE RULE: Never allow user to enter dashboard without username.
  // System must always check profile first.
  if (!userProfile?.displayName) {
    return <ProfileSetup onComplete={() => { }} />;
  }

  return (
    <IntegrationsProvider>
      <div className="app-container motion-gpu" style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden'
      }}>
        <Sidebar
          onViewChange={(view: 'chat' | 'files' | 'settings' | 'saved' | 'research' | 'history' | 'dashboard' | 'integrations') => {
            setCurrentView(view);
            setIsSidebarOpen(false); // Close on selection on mobile
          }}
          currentView={currentView}
          activeWorkspaceId={activeWorkspaceId}
          workspaces={workspaces}
          onWorkspaceChange={(id) => {
            setActiveWorkspaceId(id);
            setIsSidebarOpen(false); // Close on selection on mobile
          }}
          onNewChat={() => {
            handleClearChat();
            setIsSidebarOpen(false); // Close on selection on mobile
          }}
          onCreateWorkspace={handleCreateWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userName={userProfile?.displayName || undefined}
        />
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {currentView === 'chat' && (
            <ChatArea
              workspace={activeWorkspace}
              onSendMessage={handleSendMessage}
              onSaveResponse={handleSaveResponse}
              systemPrompt={systemPrompt}
              isCodingMode={isCodingMode}
              isStartupMode={isStartupMode}
              intelligenceSource={intelligenceSource}
              onSourceChange={setIntelligenceSource}
              onAddFile={handleAddFile}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              userName={userProfile?.displayName || undefined}
            />
          )}
          {currentView === 'files' && (
            <FilesView
              files={activeWorkspace.files}
              onUpload={handleAddFile}
              onDelete={handleDeleteFile}
            />
          )}
          {currentView === 'settings' && (
            <SettingsView
              memories={activeWorkspace.memories}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onClearMemories={() => updateActiveWorkspace({ memories: [] })}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}
          {currentView === 'saved' && (
            <SavedView
              savedResponses={activeWorkspace.savedResponses}
              onDelete={handleDeleteSavedResponse}
            />
          )}
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigateToIntegrations={() => setCurrentView('integrations')}
            />
          )}
          {currentView === 'integrations' && (
            <IntegrationsView />
          )}
          {currentView === 'research' && (
            <div style={{ padding: '40px' }}>
              <h2>Research</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Advanced AI search and research tools coming soon.</p>
            </div>
          )}
          {currentView === 'history' && (
            <div style={{ padding: '40px' }}>
              <h2>History</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Comprehensive chat history and audit logs coming soon.</p>
            </div>
          )}
        </main>

        {/* Premium Watermark */}
        <div style={{
          position: 'fixed',
          bottom: '12px',
          right: '24px',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          opacity: 0.35,
          pointerEvents: 'none',
          zIndex: 100,
          textTransform: 'uppercase',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          TEAM NEXA AI
        </div>
      </div>
    </IntegrationsProvider>
  );
}

export default App;
