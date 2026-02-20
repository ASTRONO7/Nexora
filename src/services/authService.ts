import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updateProfile,
    type User,
    type ConfirmationResult,
    type AuthError
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Auth error messages mapping
const getErrorMessage = (error: AuthError): string => {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Please contact support.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed. Please try again.';
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
};

// Email/Password Authentication
export const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update display name if provided
        if (displayName && userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
        }

        return userCredential.user;
    } catch (error) {
        throw new Error(getErrorMessage(error as AuthError));
    }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw new Error(getErrorMessage(error as AuthError));
    }
};

// Google OAuth
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    } catch (error) {
        throw new Error(getErrorMessage(error as AuthError));
    }
};

// GitHub OAuth
export const signInWithGithub = async (): Promise<User> => {
    try {
        const provider = new GithubAuthProvider();
        provider.setCustomParameters({
            allow_signup: 'true'
        });
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    } catch (error) {
        throw new Error(getErrorMessage(error as AuthError));
    }
};

// Phone Authentication
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const initializeRecaptcha = (containerId: string): RecaptchaVerifier => {
    if (!recaptchaVerifier) {
        recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
            callback: () => {
                // reCAPTCHA solved
            },
            'expired-callback': () => {
                // Response expired
                recaptchaVerifier = null;
            }
        });
    }
    return recaptchaVerifier;
};

export const signInWithPhone = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return confirmationResult;
    } catch (error) {
        throw new Error(getErrorMessage(error as AuthError));
    }
};

export const verifyPhoneCode = async (
    confirmationResult: ConfirmationResult,
    code: string
): Promise<User> => {
    try {
        const userCredential = await confirmationResult.confirm(code);
        return userCredential.user;
    } catch (error) {
        throw new Error('Invalid verification code. Please try again.');
    }
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw new Error(getErrorMessage(error as AuthError));
    }
};

// Sign Out
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        throw new Error('Failed to sign out. Please try again.');
    }
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};
