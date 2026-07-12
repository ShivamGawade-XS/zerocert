import DOMPurify from 'isomorphic-dompurify';

export function sanitizeText(input: string, maxLength = 2000): string {
  if (!input) return '';
  const trimmed = input.trim();
  const clean = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [], // Strip all HTML tags entirely for plain text
    ALLOWED_ATTR: [],
  });
  return clean.slice(0, maxLength);
}

export function sanitizeHtml(input: string, maxLength = 8000): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Safe HTML template composition (emails)
  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'ul', 'li', 'ol', 'span', 'div', 'table', 'tbody', 'tr', 'td', 'th', 'thead'],
    ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
  }).slice(0, maxLength);
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
