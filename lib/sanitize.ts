export function sanitizeText(value: string): string {
  const trimmed = value.trim();
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Inverse of sanitizeText for rendering through React (which escapes again).
// Without this, stored content like "&#39;" shows up literally on the page,
// and music/image URLs containing query params break on the "&amp;".
export function decodeText(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
