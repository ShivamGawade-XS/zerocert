import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const apiKey = token || process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing Resend API key. Please configure it in the Admin Dashboard.' });
  }

  const resend = new Resend(apiKey);
  const { to, subject, html, fromName, fromEmail } = req.body;
  const senderEmail = fromEmail || 'onboarding@resend.dev'; // Default to Resend testing email if none provided
  const senderName = fromName || 'ZeroCert';

  try {
    const data = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: html,
    });
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
