import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/db';
import { createJwtToken, setAuthCookie } from '../../lib/auth';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidCode(code)) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        consumed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumed: true },
      });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'Incorrect code. Please try again or request a new one.' });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { consumed: true },
    });

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { lastLoginAt: new Date() },
      create: {
        email: normalizedEmail,
        lastLoginAt: new Date(),
      },
    });

    const token = createJwtToken(user.id, user.email);
    setAuthCookie(res, token);

    return res.status(200).json({ ok: true, token });
  } catch (error) {
    console.error('Error in verify-code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
