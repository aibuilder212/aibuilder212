import { Request, Response, NextFunction } from 'express';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const expectedToken = process.env.GATEWAY_TOKEN;
  
  if (!expectedToken) {
    console.error('GATEWAY_TOKEN not configured');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (token !== expectedToken) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  next();
}
