import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, createSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { authLimit } from '@/lib/ratelimit';
import { sanitizeText, sanitizeSlug, sanitizeEmail } from '@/lib/sanitize';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  slug: z.string().min(2).max(100),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting check
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await authLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input fields', details: parsed.error.format() }, { status: 400 });
    }

    const name = sanitizeText(parsed.data.name);
    const email = sanitizeEmail(parsed.data.email);
    const password = parsed.data.password;
    const slug = sanitizeSlug(parsed.data.slug);

    // 2. Check if email or slug is already taken
    const { data: existingEmail } = await supabaseAdmin
      .from('orgs')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    const { data: existingSlug } = await supabaseAdmin
      .from('orgs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json({ error: 'Organization slug already in use.' }, { status: 400 });
    }

    // 3. Hash password and insert
    const passwordHash = await hashPassword(password);
    const { data: org, error } = await supabaseAdmin
      .from('orgs')
      .insert({
        name,
        email,
        slug,
        password_hash: passwordHash,
      })
      .select('id, name, slug, email, logo_url, created_at')
      .single();

    if (error || !org) {
      return NextResponse.json({ error: 'Failed to create organization. ' + error?.message }, { status: 500 });
    }

    // 4. Create cookie session
    const response = NextResponse.json({ success: true, org });
    await createSession(org.id, response);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
