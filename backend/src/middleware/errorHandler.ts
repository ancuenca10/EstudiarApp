import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  const payload: Record<string, unknown> = {
    error: statusCode >= 500 ? 'Error interno del servidor' : error.message,
  };

  if (error instanceof AppError && error.details) {
    payload.details = error.details;
  }

  return res.status(statusCode).json(payload);
};
