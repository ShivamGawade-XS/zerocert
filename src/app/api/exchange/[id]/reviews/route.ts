import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: itemId } = params;

  try {
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reviews: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: itemId } = params;

  try {
    const body = await req.json();
    const { reviewerName, rating, comment, verified } = body;

    if (!reviewerName || !rating) {
      return NextResponse.json({ error: 'Missing required review fields: reviewerName and rating' }, { status: 400 });
    }

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        item_id: itemId,
        reviewer_name: sanitizeText(reviewerName),
        rating: Number(rating),
        comment: comment ? sanitizeText(comment) : null,
        verified: !!verified,
      })
      .select('*')
      .single();

    if (error || !review) {
      return NextResponse.json({ error: 'Failed to add review: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
