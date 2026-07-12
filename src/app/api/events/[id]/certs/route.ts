import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: eventId } = params;
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Verify event belongs to the authenticated org
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('org_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch all certificates for this event
    const { data: certs, error: certsError } = await supabaseAdmin
      .from('certs')
      .select('*')
      .eq('event_id', eventId)
      .order('issued_at', { ascending: false });

    if (certsError) {
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }

    return NextResponse.json({ success: true, certs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
