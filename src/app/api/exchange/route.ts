import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    let query = supabaseAdmin
      .from('exchange_items')
      .select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: items, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch exchange opportunities: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, items: items || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, url, description, flags, resumeValue, timeRequired, difficulty, linkedinWorthiness, recruiterValue, createdBy } = body;

    if (!title || !category || !url) {
      return NextResponse.json({ error: 'Missing required fields: title, category, and url' }, { status: 400 });
    }

    const { data: item, error } = await supabaseAdmin
      .from('exchange_items')
      .insert({
        title: sanitizeText(title),
        category,
        url,
        description: description ? sanitizeText(description) : null,
        flags: flags || [],
        resume_value: resumeValue || 5,
        time_required: timeRequired || null,
        difficulty: difficulty || 'Beginner',
        linkedin_worthiness: linkedinWorthiness || 'Medium',
        recruiter_value: recruiterValue || 'Medium',
        created_by: createdBy ? sanitizeText(createdBy) : 'Anonymous',
      })
      .select('*')
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Failed to share opportunity: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
