export function sanitizeText(input: string, maxLength = 2000): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Strip all HTML tags
  const clean = trimmed.replace(/<\/?[^>]+(>|$)/g, '');
  return clean.slice(0, maxLength);
}

export function sanitizeHtml(input: string, maxLength = 8000): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Remove script tags, iframe tags, and javascript event handlers to prevent XSS
  const noScripts = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  const clean = noScripts.replace(/\bon[a-z]+\s*=\s*(['"])[^'"]*\1/gi, '');
  return clean.slice(0, maxLength);
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';
  const cleaned = email.trim().toLowerCase();
  // Simple regex validation
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(cleaned)) {
    throw new Error('Invalid email address format');
  }
  return cleaned;
}

export function sanitizeSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '') // Only alphanumeric, hyphens, underscores
    .slice(0, 100);
}
