import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/app';
import { logger } from './utils/logger';
import router from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // ── Security headers
  app.use(helmet());

  // ── CORS (tighten origins in production)
  app.use(cors({
    origin: config.isProduction ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Rate limiting
  app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  }));

  // ── Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Request logging
  app.use(morgan(config.isProduction ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));

  // ── Routes
  app.use(config.apiPrefix, router);

  // ── 404 + error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
