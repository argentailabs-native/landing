import { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
