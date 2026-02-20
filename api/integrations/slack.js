
import { IntegrationProvider } from './provider-base.js';

export class SlackProvider extends IntegrationProvider {
    constructor(config) {
        super({
            id: 'slack',
            name: 'Slack',
            ...config
        });
    }

    getAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            scope: 'channels:read,groups:read,users:read',
            redirect_uri: this.redirectUri,
            state: state
        });
        return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    }

    async handleCallback(code) {
        const response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: this.redirectUri
            })
        });

        const data = await response.json();
        if (!data.ok) throw new Error(data.error);

        return {
            accessToken: data.access_token,
            teamId: data.team?.id,
            teamName: data.team?.name,
            authedUser: data.authed_user?.id
        };
    }

    async fetchProjects(accessToken) {
        const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        if (!data.ok) throw new Error(data.error || 'Failed to fetch Slack channels');

        return data.channels.map(channel => ({
            id: channel.id,
            name: `#${channel.name}`,
            description: channel.topic?.value || channel.purpose?.value || 'Slack Channel',
            type: 'channel',
            lastActivity: new Date(channel.updated * 1000).toISOString(),
            integrationId: 'slack'
        }));
    }
}
