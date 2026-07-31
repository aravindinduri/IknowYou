import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';
import { closeDb, getDb } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Core Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(requestLogger);

// API Router
app.use('/api', apiRouter);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production if built
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('AI Knowledge Inbox Server Running. (Client build not present)');
    }
  });
});

// Global Error Handler
app.use(errorHandler);

// Initialize DB & Start Server
async function startServer(port = config.port) {
  try {
    await getDb();
    const server = app.listen(port, () => {
      logger.info(` Server running on http://localhost:${port} (${config.nodeEnv})`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is in use. Trying fallback port ${port + 1}...`);
        startServer(port + 1);
      } else {
        logger.error({ error: err.message }, 'Server listen error');
      }
    });

    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        closeDb();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
