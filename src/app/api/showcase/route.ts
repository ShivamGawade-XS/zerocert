import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data: showcases, error } = await supabaseAdmin
      .from('showcases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch showcases: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, showcases: showcases || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, type, url, description, creatorName } = body;

    if (!title || !type || !creatorName) {
      return NextResponse.json({ error: 'Missing required fields: title, type, and creatorName' }, { status: 400 });
    }

    const { data: showcase, error } = await supabaseAdmin
      .from('showcases')
      .insert({
        title: sanitizeText(title),
        type,
        url: url || null,
        description: description ? sanitizeText(description) : null,
        creator_name: sanitizeText(creatorName),
        upvotes: 0,
      })
      .select('*')
      .single();

    if (error || !showcase) {
      return NextResponse.json({ error: 'Failed to share showcase: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, showcase });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, upvotes } = body;

    if (!id || upvotes === undefined) {
      return NextResponse.json({ error: 'Missing showcase id and upvote value' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('showcases')
      .update({ upvotes: Number(upvotes) })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: 'Failed to update upvotes: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, showcase: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
