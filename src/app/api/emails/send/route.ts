import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { emailLimit } from '@/lib/ratelimit';
import { Resend } from 'resend';
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize';

const sendEmailSchema = z.object({
  certIds: z.array(z.string()),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
});

function injectVars(
  text: string,
  row: Record<string, string>,
  certId: string,
  issuedAt: string,
  eventName: string,
  orgName: string
): string {
  const d = new Date(issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return text
    .replace(/\{\{Name\}\}/g, row.Name || 'Recipient')
    .replace(/\{\{Email\}\}/g, row.Email || 'email@example.com')
    .replace(/\{\{EventName\}\}/g, eventName || 'Event')
    .replace(/\{\{OrgName\}\}/g, orgName || 'Organization')
    .replace(/\{\{CertID\}\}/g, certId)
    .replace(/\{\{IssueDate\}\}/g, d)
    .replace(/\{\{VerifyURL\}\}/g, `${appUrl}/verify/${certId}`)
    .replace(/\{\{(\w[\w\s]*)\}\}/g, (_, k) => row[k] || `{{${k}}}`);
}

export async function POST(req: NextRequest) {
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiter check per organization
  const { success: isRateLimitOk } = await emailLimit.limit(orgId);
  if (!isRateLimitOk) {
    return NextResponse.json({ error: 'Email quota exceeded. Rate limit is 100 emails per hour.' }, { status: 429 });
  }

  try {
    const bodyJson = await req.json();
    const parsed = sendEmailSchema.safeParse(bodyJson);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid send email arguments', details: parsed.error.format() }, { status: 400 });
    }

    const { certIds, subject: rawSubject, body: rawBody } = parsed.data;
    const cleanSubject = sanitizeText(rawSubject);
    const cleanBody = sanitizeHtml(rawBody);

    // Fetch certs and check ownership
    const { data: certs, error: fetchError } = await supabaseAdmin
      .from('certs')
      .select(`
        *,
        events:event_id (
          name
        ),
        orgs:org_id (
          name
        )
      `)
      .in('cert_id', certIds)
      .eq('org_id', orgId);

    if (fetchError || !certs || certs.length === 0) {
      return NextResponse.json({ error: 'No valid certificates found or unauthorized' }, { status: 404 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Resend API key is not configured on the server.' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const results = [];

    // Send emails sequentially to manage API rates and logging
    for (const cert of certs) {
      const email = cert.fields?.Email || cert.fields?.email;
      if (!email) {
        results.push({ certId: cert.cert_id, status: 'failed', error: 'No email field on certificate' });
        continue;
      }

      const personalSubject = injectVars(cleanSubject, cert.fields, cert.cert_id, cert.issued_at, cert.events.name, cert.orgs.name);
      // Use Custom Message if present on row, else default body
      const rowBody = cert.fields['Custom Message'] || cleanBody;
      const personalBody = injectVars(rowBody, cert.fields, cert.cert_id, cert.issued_at, cert.events.name, cert.orgs.name);

      try {
        const emailRes = await resend.emails.send({
          from: `${cert.orgs.name} <onboarding@resend.dev>`,
          to: [email],
          subject: personalSubject,
          html: personalBody.replace(/\n/g, '<br>'), // Simple plain-text to html mapping
        });

        if (emailRes.error) {
          await supabaseAdmin.from('email_logs').insert({
            cert_id: cert.id,
            org_id: orgId,
            to_email: email,
            subject: personalSubject,
            status: 'failed',
            sent_at: new Date().toISOString(),
          });
          results.push({ certId: cert.cert_id, status: 'failed', error: emailRes.error.message });
        } else {
          await supabaseAdmin.from('email_logs').insert({
            cert_id: cert.id,
            org_id: orgId,
            to_email: email,
            subject: personalSubject,
            status: 'sent',
            resend_id: emailRes.data?.id || null,
            sent_at: new Date().toISOString(),
          });
          results.push({ certId: cert.cert_id, status: 'sent' });
        }
      } catch (err: any) {
        await supabaseAdmin.from('email_logs').insert({
          cert_id: cert.id,
          org_id: orgId,
          to_email: email,
          subject: personalSubject,
          status: 'failed',
          sent_at: new Date().toISOString(),
        });
        results.push({ certId: cert.cert_id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
