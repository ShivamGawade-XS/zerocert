import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, createSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { authLimit } from '@/lib/ratelimit';
import { sanitizeEmail } from '@/lib/sanitize';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await authLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const email = sanitizeEmail(parsed.data.email);
    const password = parsed.data.password;

    // Fetch org
    const { data: org, error } = await supabaseAdmin
      .from('orgs')
      .select('id, name, slug, email, logo_url, password_hash, created_at')
      .eq('email', email)
      .maybeSingle();

    if (error || !org) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isPasswordCorrect = await verifyPassword(password, org.password_hash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Prepare response, omit password hash
    const { password_hash, ...orgData } = org;
    const response = NextResponse.json({ success: true, org: orgData });
    await createSession(org.id, response);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
