import { createApp } from './app';

// Vercel Serverless Function Entry Point
const { app } = createApp();

// Add a root handler for /api check
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'HRM API is running', version: '1.0.0' });
});

export default app;