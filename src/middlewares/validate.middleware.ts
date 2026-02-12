import { Request, Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';
import { StatusCodes } from 'http-status-codes';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: Schema, target: ValidateTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));

      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Mutate request with sanitised / coerced values
    req[target] = value;
    next();
  };
