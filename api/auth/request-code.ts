import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/db';
import { sendLoginCode } from '../../lib/email';
import { checkRateLimit, getRateLimitKey, getClientIp } from '../../lib/rate-limit';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const clientIp = getClientIp(req);
    const rateLimitKey = getRateLimitKey(clientIp, normalizedEmail);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const resetInMinutes = Math.ceil((rateLimit.resetAt! - Date.now()) / 60000);
      return res.status(429).json({
        error: `Too many requests. Please try again in ${resetInMinutes} minutes.`
      });
    }

    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
        consumed: false,
        attempts: 0,
      },
    });

    const emailResult = await sendLoginCode(normalizedEmail, code);

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send login code. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in request-code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
