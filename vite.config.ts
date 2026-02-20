import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config'

// Custom plugin to serve the /api routes locally during development
const apiPlugin = () => {
  let expressApp: any = null;
  let loadError: string | null = null;

  return {
    name: 'api-plugin',
    configureServer(server: any) {
      // Load the API in the background
      const loadApi = async () => {
        try {
          const express = await import('express').then(m => m.default);
          const cors = await import('cors').then(m => m.default);
          const { pathToFileURL } = await import('url');
          const path = await import('path');

          const root = process.cwd();
          const integrationsRouterPath = pathToFileURL(path.join(root, 'api', 'integrations', 'index.js')).href;
          const sendEmailHandlerPath = pathToFileURL(path.join(root, 'api', 'send-email.js')).href;

          const router = await import(integrationsRouterPath).then(m => m.default);
          const emailHandler = await import(sendEmailHandlerPath).then(m => m.default);

          const app = express();
          app.use(cors());
          app.use(express.json());

          app.use('/api/integrations', router);
          app.post('/api/send-email', emailHandler);

          expressApp = app;
          console.log('[API Plugin] Backend services are online');
        } catch (err: any) {
          loadError = err.message;
          console.error('[API Plugin] Failed to initialize backend:', err);
        }
      };

      loadApi();

      server.middlewares.use((req: any, res: any, next: any) => {
        const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = urlObj.pathname;

        if (pathname.startsWith('/api')) {
          console.log(`[API Plugin] Intercepting: ${pathname}`);

          if (pathname === '/api/ping') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'alive', time: new Date().toISOString() }));
            return;
          }

          if (expressApp) {
            expressApp(req, res, (err: any) => {
              if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal Error', message: err.message }));
              } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Not Found', message: `Route ${pathname} not found in backend` }));
              }
            });
            return;
          } else {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Service Unavailable',
              message: loadError ? `Backend failed to load: ${loadError}` : 'Backend is still warming up...'
            }));
            return;
          }
        }
        next();
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 5173
  }
})
