import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/app';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', { err, url: req.url, method: req.method });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // MySQL duplicate entry
  if ((err as any).code === 'ER_DUP_ENTRY') {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: 'Duplicate entry — a record with that value already exists',
    });
    return;
  }

  // Unexpected error
  logger.error('Unhandled error', { err, url: req.url, method: req.method });

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: config.isProduction ? 'Internal server error' : err.message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
