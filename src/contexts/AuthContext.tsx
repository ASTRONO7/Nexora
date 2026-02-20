import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile, type UserProfile } from '../services/userService';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfileLocally: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userProfile: null,
    loading: true,
    error: null,
    logout: async () => { },
    refreshProfile: async () => { },
    updateProfileLocally: () => { }
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (mounted) {
                console.warn("Auth check timed out, forcing loading to false");
                setLoading(false);
            }
        }, 4000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!mounted) return;

            setCurrentUser(user);
            setError(null);

            if (user) {
                try {
                    // Create or update user profile in Firestore
                    await createUserProfile(user);
                    // Fetch user profile data
                    const profile = await getUserProfile(user.uid);
                    if (mounted) setUserProfile(profile);
                } catch (err) {
                    console.error('Error loading user profile:', err);
                    if (mounted) setError('Failed to load user profile');
                }
            } else {
                if (mounted) setUserProfile(null);
            }

            if (mounted) {
                setLoading(false);
                clearTimeout(timeoutId);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    const logout = async () => {
        try {
            await auth.signOut();
            // Clear all local storage
            localStorage.clear();
            // Reset state
            setCurrentUser(null);
            setUserProfile(null);
            // Append logout=true to URL to show success message
            window.history.pushState({}, '', '?logout=true');
        } catch (err) {
            console.error('Logout error:', err);
            throw err;
        }
    };

    const refreshProfile = async () => {
        if (currentUser) {
            try {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
            } catch (err) {
                console.error('Error refreshing profile:', err);
            }
        }
    };

    const updateProfileLocally = (updates: Partial<UserProfile>) => {
        setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    };

    const value: AuthContextType = {
        currentUser,
        userProfile,
        loading,
        error,
        logout,
        refreshProfile,
        updateProfileLocally
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
