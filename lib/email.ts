// /lib/email.ts
import nodemailer from 'nodemailer';

interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Creates (and reuses) a Nodemailer SMTP transporter configured for Zoho.
 * - Set env:
 *   SMTP_HOST=smtp.zoho.com (or smtp.zoho.eu / smtp.zoho.in)
 *   SMTP_PORT=587 (STARTTLS) or 465 (TLS)
 *   SMTP_USER=you@argentailabs.com
 *   SMTP_PASSWORD=<zoho-app-password>
 *   SMTP_FROM="Argent AI Labs <you@argentailabs.com>"
 */
let _transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || 'smtp.zoho.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = port === 465; // 465 = TLS, 587 = STARTTLS

  if (!user || !pass) {
    // Throw here so callers get a consistent error path in sendLoginCode()
    throw new Error(
      'SMTP credentials missing. Please set SMTP_USER and SMTP_PASSWORD environment variables.'
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return _transporter;
}

export async function sendLoginCode(email: string, code: string): Promise<EmailResult> {
  // Build email content (same style as before)
  const subject = 'Your Login Code - Argent AI Labs';
  const text = `Your login code is: ${code}

This code will expire in 10 minutes.
Do not share this code with anyone.

If you didn't request this code, please ignore this email.`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#e2e8f0;margin-bottom:24px;">Argent AI Labs</h2>
      <p style="font-size:16px;color:#cbd5e1;margin-bottom:16px;">Your login code is:</p>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;text-align:center;margin-bottom:16px;">
        <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#e2e8f0;">${code}</span>
      </div>
      <p style="font-size:14px;color:#94a3b8;margin:8px 0;">This code will expire in 10 minutes.</p>
      <p style="font-size:14px;color:#94a3b8;margin:8px 0;">Do not share this code with anyone.</p>
      <p style="font-size:12px;color:#64748b;margin-top:20px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER!; // fallback to the SMTP user

    const info = await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });

    // If Nodemailer didn't throw, we consider it sent
    // (info.accepted may still be checked if you wish)
    return { success: true };
  } catch (err: any) {
    console.error('SMTP send error:', err?.message || err);
    return { success: false, error: 'Failed to send email via SMTP (Zoho)' };
  }
}
