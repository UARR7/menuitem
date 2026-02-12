import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse, PaginationMeta } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = StatusCodes.OK,
  meta?: PaginationMeta
): Response => {
  const body: ApiResponse<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): Response =>
  sendSuccess(res, data, message, StatusCodes.CREATED);

export const sendNoContent = (res: Response): Response =>
  res.status(StatusCodes.NO_CONTENT).send();

export const sendError = (
  res: Response,
  message: string,
  statusCode = StatusCodes.INTERNAL_SERVER_ERROR
): Response => {
  const body: ApiResponse = { success: false, message };
  return res.status(statusCode).json(body);
};
