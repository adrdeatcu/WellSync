import type { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { supabaseAuthClient } from '../db/index.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
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
    const { data, error } = await supabaseAuthClient.auth.getUser(token);

    if (error || !data.user) {
      console.error('Supabase auth.getUser error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = data.user.id;
    next();
  } catch (err) {
    console.error('Auth middleware unexpected error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}