import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';
import type { Workspace } from '../App';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    username?: string;
    dateOfBirth?: string;
    role?: string;
    primaryUses?: string[];
    vibe?: string;
    profileComplete?: boolean;
    createdAt: any;
    lastLogin: any;
    workspaces?: Workspace[];
}

// Create user profile in Firestore
export const createUserProfile = async (user: User): Promise<void> => {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        // Only create if doesn't exist
        if (!userSnap.exists()) {
            const userProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                profileComplete: false, // New users need to complete profile
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                workspaces: [
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
                    }
                ]
            };

            await setDoc(userRef, userProfile);
        } else {
            // Update last login
            await updateDoc(userRef, {
                lastLogin: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error('Failed to create user profile');
    }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

// Update user workspaces in Firestore
export const updateUserWorkspaces = async (
    uid: string,
    workspaces: Workspace[]
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            workspaces,
            lastLogin: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating workspaces:', error);
        throw new Error('Failed to save workspaces');
    }
};

// Update user profile
export const updateUserProfile = async (
    uid: string,
    updates: Partial<UserProfile>
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, updates, { merge: true });
    } catch (error: any) {
        console.error('Firestore Error updating profile:', error);
        if (error.code === 'permission-denied') {
            throw new Error('Permission Denied: Check Firestore Security Rules');
        }
        throw new Error('Failed to update profile: ' + error.message);
    }
};
