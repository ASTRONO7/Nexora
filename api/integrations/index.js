
import express from 'express';
import { GithubProvider } from './github.js';
import { NotionProvider } from './notion.js';
import { SlackProvider } from './slack.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { auth as firebaseAuth, db } from '../config/firebase-admin.js';

const router = express.Router();

// Base route for connectivity check
router.get('/', (req, res) => res.json({ status: 'Integrations API active' }));

const providers = {
    github: new GithubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI
    }),
    notion: new NotionProvider({
        clientId: process.env.NOTION_CLIENT_ID,
        clientSecret: process.env.NOTION_CLIENT_SECRET,
        redirectUri: process.env.NOTION_REDIRECT_URI
    }),
    slack: new SlackProvider({
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        redirectUri: process.env.SLACK_REDIRECT_URI
    })
};

// Middleware to verify Firebase Auth token
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        req.userId = decodedToken.uid;
        next();
    } catch (error) {
        console.error('Auth verification failed:', error);
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
};

router.get('/:provider/start', authenticate, (req, res) => {
    const { provider } = req.params;
    console.log(`[Backend] Starting OAuth flow for ${provider} (User: ${req.userId})`);
    const instance = providers[provider];
    if (!instance) {
        console.error(`[Backend] Provider ${provider} not found`);
        return res.status(404).json({ error: 'Not Found', message: `Provider ${provider} not found` });
    }

    const state = JSON.stringify({ userId: req.userId, provider });
    const stateBase64 = Buffer.from(state).toString('base64');
    const url = instance.getAuthUrl(stateBase64);
    console.log(`[Backend] Generated Auth URL for ${provider}: ${url}`);
    res.json({ url });
});

router.get('/:provider/callback', async (req, res) => {
    const { provider } = req.params;
    const { code, state } = req.query;
    console.log(`[Backend] Received callback for ${provider}. Code present: ${!!code}, State present: ${!!state}`);
    const instance = providers[provider];

    if (!instance) {
        console.error(`[Backend] Callback failed: Provider ${provider} not found`);
        return res.status(404).send('Provider not found');
    }

    try {
        if (!state) throw new Error('No state returned from provider');
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        const { userId } = decodedState;
        console.log(`[Backend] Processing callback for User: ${userId}`);

        const credentials = await instance.handleCallback(code);
        console.log(`[Backend] Successfully exchanged code for token for ${provider}`);
        const encryptedToken = encrypt(credentials.accessToken);

        // Save to Firestore
        await db.collection('users').doc(userId).collection('integrations').doc(provider).set({
            status: 'connected',
            token: encryptedToken,
            connectedAt: new Date().toISOString(),
            ...credentials
        }, { merge: true });

        console.log(`Successfully connected ${provider} for user ${userId}`);
        res.redirect(`${process.env.FRONTEND_URL}/?view=integrations&status=success&provider=${provider}`);
    } catch (error) {
        console.error(`OAuth Callback Error (${provider}):`, error);
        res.redirect(`${process.env.FRONTEND_URL}/?view=integrations&status=error&message=${encodeURIComponent(error.message)}`);
    }
});

router.post('/:provider/disconnect', authenticate, async (req, res) => {
    const { provider } = req.params;
    try {
        await db.collection('users').doc(req.userId).collection('integrations').doc(provider).delete();
        console.log(`Successfully disconnected ${provider} for user ${req.userId}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`Disconnect Error (${provider}):`, error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:provider/projects', authenticate, async (req, res) => {
    const { provider } = req.params;
    const instance = providers[provider];

    try {
        const docRef = await db.collection('users').doc(req.userId).collection('integrations').doc(provider).get();
        if (!docRef.exists) throw new Error('Not connected');

        const { token } = docRef.data();
        const accessToken = decrypt(token);

        const projects = await instance.fetchProjects(accessToken);
        res.json({ projects });
    } catch (error) {
        console.error(`Fetch Projects Error (${provider}):`, error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
