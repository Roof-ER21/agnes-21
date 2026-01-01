import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import sessionsRoutes from './routes/sessions';
import progressRoutes from './routes/progress';
import leaderboardRoutes from './routes/leaderboard';
import analyticsRoutes from './routes/analytics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from dist folder in production
const distPath = path.join(__dirname, '..', 'dist');

// Explicitly serve demo audio files with proper MIME type
app.use('/demos', express.static(path.join(distPath, 'demos'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.wav')) {
      res.set('Content-Type', 'audio/wav');
    }
  }
}));

app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Agnes-21 server running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
});

export default app;
