import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { claimLimit } from '@/lib/ratelimit';
import { sanitizeEmail, sanitizeText } from '@/lib/sanitize';
import { Resend } from 'resend';
import { submitToOTS } from '@/lib/ots';

const claimSchema = z.object({
  eventId: z.string().uuid(),
  fields: z.record(z.string()),
});

const DEFAULT_SUBJECT = 'Your {{EventName}} certificate is here, {{Name}}!';
const DEFAULT_BODY = `Dear {{Name}},

Congratulations! 🎉

Your certificate for {{EventName}} has been officially issued by {{OrgName}}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Certificate ID  :  {{CertID}}
  Issued On       :  {{IssueDate}}
  Issued To       :  {{Name}}
  Event           :  {{EventName}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verify your certificate at any time:
→ {{VerifyURL}}

Add it to your LinkedIn and share it with the world.

Warm regards,
{{OrgName}} Team

──────────────────────────────────────────────
Powered by ZeroCert · Blockchain-anchored certificates
`;

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
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  try {
    const body = await req.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid claim input data' }, { status: 400 });
    }

    const { eventId, fields } = parsed.data;

    // Rate limiter: check claim limit per IP per event
    const { success: isRateLimitOk } = await claimLimit.limit(`${ip}_${eventId}`);
    if (!isRateLimitOk) {
      return NextResponse.json({ error: 'Too many claim submissions. Please try again in an hour.' }, { status: 429 });
    }

    // 1. Validate fields (must contain Name and Email)
    const emailKey = Object.keys(fields).find((k) => k.toLowerCase() === 'email');
    const nameKey = Object.keys(fields).find((k) => k.toLowerCase() === 'name');

    if (!emailKey || !nameKey) {
      return NextResponse.json({ error: "Certificate claims require both 'Name' and 'Email' fields." }, { status: 400 });
    }

    const rawEmail = fields[emailKey];
    const rawName = fields[nameKey];
    let email = '';

    try {
      email = sanitizeEmail(rawEmail);
    } catch {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    const name = sanitizeText(rawName);

    // Normalize keys to standard Name and Email
    const normalizedFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (k.toLowerCase() === 'email') {
        normalizedFields['Email'] = email;
      } else if (k.toLowerCase() === 'name') {
        normalizedFields['Name'] = name;
      } else {
        normalizedFields[k] = sanitizeText(v);
      }
    }

    // 2. Fetch event details and organization details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*, orgs:org_id(name, email, logo_url)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or has been removed.' }, { status: 404 });
    }

    // 3. Check for existing claim to prevent duplicates
    const { data: existingCert } = await supabaseAdmin
      .from('certs')
      .select('*')
      .eq('event_id', eventId)
      .eq('fields->>Email', email)
      .maybeSingle();

    if (existingCert) {
      // Just return the existing certificate details safely
      return NextResponse.json({ success: true, cert: existingCert, alreadyClaimed: true });
    }

    // 4. Atomic Serial Number Generation & Update event cert_count
    const { data: updatedEvent, error: updateError } = await supabaseAdmin
      .rpc('increment_event_cert_count', { event_id: eventId });

    let finalCount = 1;
    if (updateError) {
      // Fallback if RPC fails, do a normal transaction or select update
      const { data: currentEvent } = await supabaseAdmin
        .from('events')
        .select('cert_count')
        .eq('id', eventId)
        .single();
      
      const newCount = (Number(currentEvent?.cert_count) || 0) + 1;
      await supabaseAdmin
        .from('events')
        .update({ cert_count: newCount })
        .eq('id', eventId);
      
      finalCount = newCount;
    } else {
      finalCount = Number(updatedEvent);
    }

    // Compose certificate ID
    let certId = '';
    if (event.serial_prefix) {
      certId = `${event.serial_prefix}-${String(finalCount).padStart(3, '0')}`;
    } else {
      certId = `ZC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    const issuedAt = new Date().toISOString();

    // 5. Generate Cryptographic SHA-256 Hash
    const hashData = {
      certId,
      eventId,
      issuedAt,
      fields: normalizedFields,
    };
    const sha256Hash = crypto.createHash('sha256').update(JSON.stringify(hashData)).digest('hex');

    // 6. Submit to OpenTimestamps (asynchronous background submit)
    let btcProof = 'pending';
    try {
      const proof = await submitToOTS(sha256Hash);
      if (proof) btcProof = proof;
    } catch (e) {
      console.error('OTS submission error during claim:', e);
    }

    // 7. Save certificate to database
    const { data: cert, error: certError } = await supabaseAdmin
      .from('certs')
      .insert({
        cert_id: certId,
        event_id: eventId,
        org_id: event.org_id,
        fields: normalizedFields,
        sha256_hash: sha256Hash,
        btc_proof: btcProof,
        status: 'active',
        issued_at: issuedAt,
      })
      .select('*')
      .single();

    if (certError || !cert) {
      return NextResponse.json({ error: 'Failed to record certificate: ' + certError?.message }, { status: 500 });
    }

    // 8. Queue Email via Resend in the background
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const emailSubject = injectVars(DEFAULT_SUBJECT, normalizedFields, certId, issuedAt, event.name, event.orgs.name);
      const emailBody = injectVars(DEFAULT_BODY, normalizedFields, certId, issuedAt, event.name, event.orgs.name);

      resend.emails
        .send({
          from: `${event.orgs.name} <onboarding@resend.dev>`, // Resend verified domain in production
          to: [email],
          subject: emailSubject,
          text: emailBody,
        })
        .then(async (emailRes) => {
          // Log email status
          await supabaseAdmin.from('email_logs').insert({
            cert_id: cert.id,
            org_id: event.org_id,
            to_email: email,
            subject: emailSubject,
            status: emailRes.error ? 'failed' : 'sent',
            resend_id: emailRes.data?.id || null,
            sent_at: new Date().toISOString(),
          });
        })
        .catch(async (e) => {
          console.error('Error sending email:', e);
          await supabaseAdmin.from('email_logs').insert({
            cert_id: cert.id,
            org_id: event.org_id,
            to_email: email,
            subject: emailSubject,
            status: 'failed',
            sent_at: new Date().toISOString(),
          });
        });
    }

    return NextResponse.json({ success: true, cert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
