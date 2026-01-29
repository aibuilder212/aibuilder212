import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);

  // Anthropic API errors
  if (err.status) {
    res.status(err.status).json({
      error: err.message || 'API error',
      details: err.error?.message
    });
    return;
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
