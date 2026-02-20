
import { IntegrationProvider } from './provider-base.js';

export class GithubProvider extends IntegrationProvider {
    constructor(config) {
        super({
            id: 'github',
            name: 'GitHub',
            ...config
        });
    }

    getAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'repo read:user',
            state: state
        });
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    async handleCallback(code) {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: this.redirectUri
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error_description || data.error);

        return {
            accessToken: data.access_token,
            tokenType: data.token_type,
            scope: data.scope
        };
    }

    async fetchProjects(accessToken) {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Nexora-App'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch GitHub repos');
        }

        const repos = await response.json();
        return repos.map(repo => ({
            id: repo.id.toString(),
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            type: 'repo',
            lastActivity: repo.updated_at,
            integrationId: 'github'
        }));
    }
}
