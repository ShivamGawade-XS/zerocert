import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateSession, hashPassword, verifyPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText, sanitizeSlug } from '@/lib/sanitize';

const settingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  logoUrl: z.string().url().or(z.string().length(0)).nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function POST(req: NextRequest) {
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings inputs', details: parsed.error.format() }, { status: 400 });
    }

    const { name, slug, logoUrl, currentPassword, newPassword } = parsed.data;

    // 1. Fetch current organization details
    const { data: org, error: fetchError } = await supabaseAdmin
      .from('orgs')
      .select('*')
      .eq('id', orgId)
      .single();

    if (fetchError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updateFields: Record<string, any> = {};

    // 2. Process password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isPasswordCorrect = await verifyPassword(currentPassword, org.password_hash);
      if (!isPasswordCorrect) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      updateFields.password_hash = await hashPassword(newPassword);
    }

    // 3. Process metadata updates
    if (name) {
      updateFields.name = sanitizeText(name);
    }

    if (slug) {
      const sanitizedSlug = sanitizeSlug(slug);
      
      // Check if slug is already used by another organization
      const { data: existingOrg } = await supabaseAdmin
        .from('orgs')
        .select('id')
        .eq('slug', sanitizedSlug)
        .neq('id', orgId)
        .maybeSingle();

      if (existingOrg) {
        return NextResponse.json({ error: 'Slug is already in use by another organization' }, { status: 400 });
      }

      updateFields.slug = sanitizedSlug;
    }

    if (logoUrl !== undefined) {
      updateFields.logo_url = logoUrl || null;
    }

    // 4. Update organization in database
    if (Object.keys(updateFields).length > 0) {
      const { data: updatedOrg, error: updateError } = await supabaseAdmin
        .from('orgs')
        .update(updateFields)
        .select('id, name, slug, email, logo_url, created_at')
        .single();

      if (updateError || !updatedOrg) {
        return NextResponse.json({ error: 'Failed to update settings: ' + updateError?.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, org: updatedOrg });
    }

    // If no fields to update
    return NextResponse.json({
      success: true,
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        logo_url: org.logo_url,
        created_at: org.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
