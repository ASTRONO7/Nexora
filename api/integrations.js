import express from 'express';
import cors from 'cors';
import integrationsRouter from './integrations/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/integrations', integrationsRouter);

export default app;
