import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';

const eventCreateSchema = z.object({
  name: z.string().min(2).max(200),
  date: z.string(),
  description: z.string().max(2000).optional().nullable(),
  template: z.string().default('classic'),
  serialPrefix: z.string().regex(/^[A-Za-z0-9/_-]*$/).optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  formFields: z.array(z.string()).default(['Name', 'Email']),
  coLogos: z.array(z.string()).default([]),
  signatories: z.array(z.any()).default([]),
  bgImage: z.string().optional().nullable(),
  bgColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = eventCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event configurations', details: parsed.error.format() }, { status: 400 });
    }

    const name = sanitizeText(parsed.data.name);
    const date = parsed.data.date;
    const description = parsed.data.description ? sanitizeText(parsed.data.description) : null;
    const template = parsed.data.template;
    const serialPrefix = parsed.data.serialPrefix || null;
    const expiryDate = parsed.data.expiryDate || null;
    const formFields = parsed.data.formFields;
    const coLogos = parsed.data.coLogos;
    const signatories = parsed.data.signatories;
    const bgImage = parsed.data.bgImage || null;
    const bgColor = parsed.data.bgColor || '#FFFFFF';
    const textColor = parsed.data.textColor || '#111111';
    const accentColor = parsed.data.accentColor || '#B8922A';

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        org_id: orgId,
        name,
        date,
        description,
        template,
        serial_prefix: serialPrefix,
        expiry_date: expiryDate,
        form_fields: formFields,
        co_logos: coLogos,
        signatories,
        bg_image: bgImage,
        bg_color: bgColor,
        text_color: textColor,
        accent_color: accentColor,
        cert_count: 0,
      })
      .select('*')
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Failed to create event: ' + error?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
