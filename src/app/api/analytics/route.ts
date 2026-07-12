import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch total events and count of certs
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, name, cert_count, date')
      .eq('org_id', orgId);

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to fetch event stats' }, { status: 500 });
    }

    const totalCerts = events.reduce((sum, e) => sum + (Number(e.cert_count) || 0), 0);

    // 2. Fetch email metrics
    const { data: emailLogs, error: emailsError } = await supabaseAdmin
      .from('email_logs')
      .select('id, status, opened_at, clicked_at, created_at')
      .eq('org_id', orgId);

    if (emailsError) {
      return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
    }

    const totalEmails = emailLogs.length;
    const sentCount = emailLogs.filter((e) => e.status === 'sent' || e.status === 'pending').length; // sent or in-flight
    const openCount = emailLogs.filter((e) => e.opened_at).length;
    const clickCount = emailLogs.filter((e) => e.clicked_at).length;
    const bounceCount = emailLogs.filter((e) => e.status === 'bounced' || e.status === 'failed').length;

    const openRate = totalEmails > 0 ? Math.round((openCount / totalEmails) * 100) : 0;
    const clickRate = totalEmails > 0 ? Math.round((clickCount / totalEmails) * 100) : 0;
    const bounceRate = totalEmails > 0 ? Math.round((bounceCount / totalEmails) * 100) : 0;

    // 3. Certs by event name
    const certsByEvent = events.map((e) => ({
      eventName: e.name,
      count: Number(e.cert_count) || 0,
    }));

    // 4. Emails sent/opened over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Group logs by date
    const dateMap: Record<string, { date: string; sent: number; opened: number }> = {};
    
    // Seed last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = { date: dateStr, sent: 0, opened: 0 };
    }

    emailLogs.forEach((log) => {
      const dateStr = new Date(log.created_at).toISOString().split('T')[0];
      if (dateMap[dateStr]) {
        dateMap[dateStr].sent += 1;
        if (log.opened_at) {
          dateMap[dateStr].opened += 1;
        }
      }
    });

    const emailsOverTime = Object.values(dateMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalCerts,
        totalEmails,
        openRate,
        clickRate,
        bounceRate,
        certsByEvent,
        emailsOverTime,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
