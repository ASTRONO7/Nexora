
export class IntegrationProvider {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.redirectUri = config.redirectUri;
    }

    /**
     * Get the OAuth authorization URL for the provider.
     */
    getAuthUrl(state) {
        throw new Error('getAuthUrl not implemented');
    }

    /**
     * Exchange a code for an access token.
     */
    async handleCallback(code) {
        throw new Error('handleCallback not implemented');
    }

    /**
     * Fetch projects/workspaces from the provider.
     */
    async fetchProjects(accessToken) {
        throw new Error('fetchProjects not implemented');
    }

    /**
     * Revoke or disconnect the integration.
     */
    async disconnect(accessToken) {
        // Optional: override in subclasses
        return { success: true };
    }
}
