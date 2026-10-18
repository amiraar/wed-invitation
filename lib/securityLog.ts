// One JSON line per security event in the server logs (Vercel → project → Logs; search "security").
// Never pass passwords, tokens or usernames typed by visitors.
export function logSecurityEvent(event: string, details: Record<string, string> = {}): void {
  console.warn(JSON.stringify({ type: 'security', event, ...details }));
}
