import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Error in whoami:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
