import { VercelRequest, VercelResponse } from '@vercel/node';
import * as jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_COOKIE_NAME = 'aa_token';
const JWT_EXPIRY = '14d';

interface JwtPayload {
  userId: string;
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export function createJwtToken(userId: string, email: string): string {
  const secret = getJwtSecret();
  const payload: JwtPayload = { userId, email };
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(req: VercelRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[JWT_COOKIE_NAME];

    if (!token) {
      return null;
    }

    const payload = verifyJwtToken(token);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return null;
    }

    return { userId: user.id, email: user.email };
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

export function setAuthCookie(res: VercelResponse, token: string): void {
  const maxAge = 14 * 24 * 60 * 60;

  res.setHeader(
    'Set-Cookie',
    `${JWT_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}

export function clearAuthCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${JWT_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });

  return cookies;
}
