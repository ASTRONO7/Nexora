
import { IntegrationProvider } from './provider-base.js';

export class NotionProvider extends IntegrationProvider {
    constructor(config) {
        super({
            id: 'notion',
            name: 'Notion',
            ...config
        });
    }

    getAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            owner: 'user',
            state: state
        });
        return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    }

    async handleCallback(code) {
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const response = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error_description || data.error);

        return {
            accessToken: data.access_token,
            workspaceId: data.workspace_id,
            workspaceName: data.workspace_name,
            workspaceIcon: data.workspace_icon,
            botId: data.bot_id
        };
    }

    async fetchProjects(accessToken) {
        const response = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: { property: 'object', value: 'database' },
                page_size: 100
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch Notion databases');
        }

        const data = await response.json();
        return data.results.map(db => ({
            id: db.id,
            name: db.title?.[0]?.plain_text || 'Untitled Database',
            description: 'Notion Database',
            url: db.url,
            type: 'database',
            lastActivity: db.last_edited_time,
            integrationId: 'notion'
        }));
    }
}
