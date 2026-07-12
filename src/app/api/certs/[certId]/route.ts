import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { certId: string } }) {
  // certId here is the serial number/certificate ID, e.g. "IITB/CSE/2025-001" or "ZC-XXXXXX"
  // Decode since it might contain URL characters
  const certId = decodeURIComponent(params.certId);

  try {
    const { data: cert, error } = await supabaseAdmin
      .from('certs')
      .select(`
        *,
        events:event_id (
          name,
          date,
          description,
          expiry_date,
          signatories
        ),
        orgs:org_id (
          name,
          slug,
          logo_url
        )
      `)
      .eq('cert_id', certId)
      .maybeSingle();

    if (error || !cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Check expiry in real-time
    let status = cert.status;
    if (status === 'active' && cert.events?.expiry_date) {
      const expiry = new Date(cert.events.expiry_date);
      const now = new Date();
      if (now > expiry) {
        status = 'expired';
      }
    }

    return NextResponse.json({
      success: true,
      cert: {
        ...cert,
        status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { certId: string } }) {
  const certId = decodeURIComponent(params.certId);
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: cert } = await supabaseAdmin
      .from('certs')
      .select('org_id')
      .eq('cert_id', certId)
      .maybeSingle();

    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (cert.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updatedCert, error: updateError } = await supabaseAdmin
      .from('certs')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('cert_id', certId)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to revoke certificate' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cert: updatedCert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
