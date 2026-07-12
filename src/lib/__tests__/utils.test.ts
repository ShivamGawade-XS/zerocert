import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

// ─── SHA-256 Fingerprint ───────────────────────────────────────────────────────
function fingerprint(data: Record<string, unknown>): string {
  const canonical = JSON.stringify(
    Object.keys(data)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => { acc[k] = data[k]; return acc; }, {})
  );
  return createHash('sha256').update(canonical).digest('hex');
}

describe('SHA-256 Fingerprint', () => {
  it('produces a 64-char hex string', () => {
    const hash = fingerprint({ Name: 'Alice', Email: 'alice@org.com' });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('is deterministic', () => {
    const a = fingerprint({ Name: 'Bob', Event: 'Hackathon' });
    const b = fingerprint({ Event: 'Hackathon', Name: 'Bob' });
    expect(a).toBe(b);
  });

  it('changes with different data', () => {
    const a = fingerprint({ Name: 'Alice' });
    const b = fingerprint({ Name: 'Bob' });
    expect(a).not.toBe(b);
  });
});

// ─── Email Parsing ─────────────────────────────────────────────────────────────
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

describe('Email Validation', () => {
  const valid = ['alice@org.com', 'bob.smith@iitb.ac.in', 'user+tag@example.co.uk'];
  const invalid = ['not-an-email', 'missing@', '@nodomain.com', 'space @email.com', ''];

  valid.forEach((email) => {
    it(`accepts valid email: ${email}`, () => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  invalid.forEach((email) => {
    it(`rejects invalid email: "${email}"`, () => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

// ─── Slug Validation ───────────────────────────────────────────────────────────
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

describe('Slug Validation', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('iiit-blockchain')).toBe(true);
    expect(isValidSlug('org123')).toBe(true);
  });

  it('rejects invalid slugs', () => {
    expect(isValidSlug('UPPER-CASE')).toBe(false);
    expect(isValidSlug('has spaces')).toBe(false);
    expect(isValidSlug('-leading-dash')).toBe(false);
    expect(isValidSlug('')).toBe(false);
  });
});

// ─── Cert ID Format ───────────────────────────────────────────────────────────
function generateCertId(prefix: string, seq: number): string {
  const padded = String(seq).padStart(3, '0');
  return `${prefix}-${padded}`;
}

describe('Certificate ID Generation', () => {
  it('pads sequence numbers correctly', () => {
    expect(generateCertId('IITB/CSE/2026', 1)).toBe('IITB/CSE/2026-001');
    expect(generateCertId('ZC', 42)).toBe('ZC-042');
    expect(generateCertId('ORG', 100)).toBe('ORG-100');
  });
});
