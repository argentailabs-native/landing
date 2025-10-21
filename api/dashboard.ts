import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../lib/auth';
import { buildHtmlResponse } from '../lib/html';
import { prisma } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      res.setHeader('Location', '/');
      return res.status(302).end();
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!userRecord) {
      res.setHeader('Location', '/');
      return res.status(302).end();
    }

    const lastLoginDate = userRecord.lastLoginAt
      ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Never';

    const bodyContent = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        <div class="dashboard-info">
          <p><strong>Email:</strong> ${userRecord.email}</p>
          <p><strong>Last Login:</strong> ${lastLoginDate}</p>
        </div>

        <h2 style="margin-bottom: 20px;">Quick Links</h2>
        <div class="dashboard-links">
          <a href="/apps/" class="dashboard-card">
            <h3>Apps</h3>
            <p>Browse all available applications</p>
          </a>
          <a href="/apps/bmi/" class="dashboard-card">
            <h3>BMI Calculator</h3>
            <p>Calculate your Body Mass Index</p>
          </a>
          <a href="/contact/" class="dashboard-card">
            <h3>Contact</h3>
            <p>Get in touch with us</p>
          </a>
        </div>

        <button class="logout-btn" onclick="handleLogout()">Log Out</button>
      </div>

      <script>
        async function handleLogout() {
          try {
            const response = await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              window.location.href = '/';
            } else {
              alert('Logout failed. Please try again.');
            }
          } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed. Please try again.');
          }
        }
      </script>
    `;

    const html = buildHtmlResponse('Dashboard', bodyContent);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error in dashboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
