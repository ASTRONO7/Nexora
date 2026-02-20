
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// For simplicity in this environment, we'll try to initialize with default credentials
// or environment variables. In a production app, you would use a service account JSON.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.VITE_FIREBASE_PROJECT_ID
        });
        console.log('Firebase Admin initialized successfully');
    } catch (e) {
        console.warn('Firebase Admin init with applicationDefault failed, attempting project ID only.');
        try {
            admin.initializeApp({
                projectId: process.env.VITE_FIREBASE_PROJECT_ID
            });
            console.log('Firebase Admin initialized with project ID only');
        } catch (err2) {
            console.error('Firebase Admin failed to initialize entirely:', err2);
        }
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
