import { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';
import { prisma } from './db';

const SESSION_COOKIE_NAME = 'aa_sess';
const SESSION_DURATION_DAYS = 14;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return secret;
}

function signSessionId(sessionId: string): string {
  const secret = getSessionSecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(sessionId);
  const signature = hmac.digest('hex');
  return `${sessionId}.${signature}`;
}

function verifySignedSessionId(signedSessionId: string): string | null {
  try {
    const [sessionId, signature] = signedSessionId.split('.');
    if (!sessionId || !signature) {
      return null;
    }

    const secret = getSessionSecret();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(sessionId);
    const expectedSignature = hmac.digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return sessionId;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      revoked: false,
    },
  });

  return session.id;
}

export async function getSession(req: VercelRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const signedSessionId = cookies[SESSION_COOKIE_NAME];

    if (!signedSessionId) {
      return null;
    }

    const sessionId = verifySignedSessionId(signedSessionId);
    if (!sessionId) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return null;
    }

    return { userId: user.id, email: user.email };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function revokeSession(req: VercelRequest): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const signedSessionId = cookies[SESSION_COOKIE_NAME];

    if (!signedSessionId) {
      return;
    }

    const sessionId = verifySignedSessionId(signedSessionId);
    if (!sessionId) {
      return;
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { revoked: true },
    });
  } catch (error) {
    console.error('Error revoking session:', error);
  }
}

export function setSessionCookie(res: VercelResponse, sessionId: string): void {
  const signedSessionId = signSessionId(sessionId);
  const maxAge = SESSION_DURATION_DAYS * 24 * 60 * 60;

  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${signedSessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
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
