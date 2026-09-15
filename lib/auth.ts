import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { getDb } from './db';
import { User, Role } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'rap_secret_jwt_key_2026_super_secure';

export interface TokenPayload {
  userId: number;
  email: string;
  role: Role;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  // Check Authorization header
  let token: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Also check cookie if header is absent
  if (!token) {
    token = req.cookies.get('token')?.value || null;
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const db = await getDb();
  const res = db.exec(`SELECT id, name, email, role, created_at FROM users WHERE id = ${payload.userId};`);
  if (!res || res.length === 0 || !res[0].values[0]) return null;

  const row = res[0].values[0];
  return {
    id: row[0] as number,
    name: row[1] as string,
    email: row[2] as string,
    role: row[3] as Role,
    created_at: row[4] as string,
  };
}

export function hasPermission(role: Role, requiredRoles: Role[]): boolean {
  if (role === 'ADMIN') return true;
  return requiredRoles.includes(role);
}
