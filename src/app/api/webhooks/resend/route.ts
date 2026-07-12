import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  // In production, verify Resend signature header (Svix signature)
  // For this implementation, we will parse and match logs by email_id
  try {
    const payload = await req.json();
    const eventType = payload.type;
    const resendId = payload.data?.email_id;

    if (!resendId) {
      return NextResponse.json({ error: 'Missing email_id in webhook payload' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    if (eventType === 'email.opened') {
      await supabaseAdmin
        .from('email_logs')
        .update({ opened_at: timestamp })
        .eq('resend_id', resendId);
    } else if (eventType === 'email.clicked') {
      await supabaseAdmin
        .from('email_logs')
        .update({ clicked_at: timestamp })
        .eq('resend_id', resendId);
    } else if (eventType === 'email.bounced') {
      await supabaseAdmin
        .from('email_logs')
        .update({ status: 'bounced' })
        .eq('resend_id', resendId);
    } else if (eventType === 'email.sent') {
      await supabaseAdmin
        .from('email_logs')
        .update({ status: 'sent' })
        .eq('resend_id', resendId);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
