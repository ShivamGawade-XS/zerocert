import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: showcaseId } = params;

  try {
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('showcase_id', showcaseId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch comments: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, comments: comments || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: showcaseId } = params;

  try {
    const body = await req.json();
    const { authorName, comment } = body;

    if (!authorName || !comment) {
      return NextResponse.json({ error: 'Missing comment fields: authorName and comment' }, { status: 400 });
    }

    const { data: newComment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        showcase_id: showcaseId,
        author_name: sanitizeText(authorName),
        comment: sanitizeText(comment),
      })
      .select('*')
      .single();

    if (error || !newComment) {
      return NextResponse.json({ error: 'Failed to post comment: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
