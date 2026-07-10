const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Escapes the HTML-significant characters in `input` so it is safe to
 * interpolate into an HTML document (e.g. a notification email body).
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/**
 * Strips CR/LF from `input` so it's safe to interpolate into an email
 * header (e.g. Subject) without allowing header injection.
 */
export function sanitizeHeaderValue(input: string): string {
  return input.replace(/[\r\n]+/g, ' ')
}
