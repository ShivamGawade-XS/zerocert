import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtsecretkeysupersecretjwtsecretkey';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'zc_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(orgId: string, response: NextResponse): Promise<void> {
  const token = await new jose.SignJWT({ orgId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function validateSession(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY);
    return (payload.orgId as string) || null;
  } catch (error) {
    return null;
  }
}

export async function getOrgFromSession(request: NextRequest) {
  const orgId = await validateSession(request);
  if (!orgId) return null;

  const { data: org, error } = await supabaseAdmin
    .from('orgs')
    .select('id, name, slug, email, logo_url, created_at')
    .eq('id', orgId)
    .single();

  if (error || !org) return null;
  return org;
}

export function clearSession(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}
