import { NextRequest, NextResponse } from 'next/server';
import { getOrgFromSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const org = await getOrgFromSession(req);
    if (!org) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, org });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: 'Session validation error' }, { status: 401 });
  }
}
