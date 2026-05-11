import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import 'dotenv/config';

const jwtSecret = process.env.SUPABASE_JWT_SECRET as string;

if (!jwtSecret) {
  throw new Error('SUPABASE_JWT_SECRET is not set in environment variables');
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.substring('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded.sub || typeof decoded.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid token: no subject' });
    }

    req.userId = decoded.sub;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}