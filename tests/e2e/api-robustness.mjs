// API robustness: odd input on every route must never give a 5xx; admin routes refuse anonymous calls.
import { chromium } from 'playwright';

const BASE = 'http://localhost:3917';
const PW = 'E2e-Test-Passw0rd!';
const ZERO = '00000000-0000-0000-0000-000000000000';
const routes = [
  ['GET', '/api/admin/counts'], ['GET', '/api/auth/me'], ['POST', '/api/auth/password'],
  ['GET', '/api/events'], ['POST', '/api/events'], ['PUT', `/api/events/${ZERO}`], ['DELETE', `/api/events/${ZERO}`],
  ['GET', '/api/faqs'], ['POST', '/api/faqs'], ['PUT', `/api/faqs/${ZERO}`], ['DELETE', `/api/faqs/${ZERO}`],
  ['GET', '/api/gallery'], ['POST', '/api/gallery'], ['PATCH', `/api/gallery/${ZERO}`], ['DELETE', `/api/gallery/${ZERO}`],
  ['GET', '/api/guestbook'], ['POST', '/api/guestbook'], ['PATCH', `/api/guestbook/${ZERO}`], ['DELETE', `/api/guestbook/${ZERO}`],
  ['GET', '/api/guests'], ['POST', '/api/guests'], ['PUT', `/api/guests/${ZERO}`], ['DELETE', `/api/guests/${ZERO}`],
  ['POST', `/api/guests/${ZERO}/token`], ['GET', '/api/guests/export'], ['POST', '/api/guests/import'], ['PUT', '/api/guests/message'],
  ['POST', '/api/reset'], ['GET', '/api/rsvp'], ['POST', '/api/rsvp'], ['DELETE', `/api/rsvp/${ZERO}`], ['GET', '/api/rsvp/export'],
  ['GET', '/api/settings'], ['PUT', '/api/settings'], ['POST', '/api/upload'], ['GET', '/api/wedding'], ['PUT', '/api/wedding']
];
const PUBLIC_OK = new Set(['GET /api/events', 'GET /api/faqs', 'GET /api/gallery', 'GET /api/settings', 'GET /api/wedding', 'GET /api/guestbook', 'POST /api/guestbook', 'POST /api/rsvp', 'GET /api/auth/me']);
const bodies = {
  'malformed JSON': '{"a":',
  'JSON array': '[]',
  'JSON null': 'null',
  'JSON string': '"x"',
  'wrong types': JSON.stringify({ name: 123, token: {}, type: [], url: 5, theme: 9, order_index: 'x', message: null, guest_count: 'NaN' }),
  'huge string': JSON.stringify({ name: 'a'.repeat(200000), message: 'b'.repeat(200000), url: 'https://x/' + 'c'.repeat(200000) })
};
const problems = [];
const browser = await chromium.launch();

// Anonymous: write routes must say 401 (or 400/429 for the public guest routes), never 2xx or 5xx.
const anon = await browser.newContext();
for (const [m, u] of routes) {
  if (m === 'DELETE' && u.includes('/api/reset')) continue;
  const r = await anon.request.fetch(BASE + u, { method: m, headers: { 'Content-Type': 'application/json' }, data: '{}' });
  const key = `${m} ${u.replace(ZERO, ':id')}`;
  if (r.status() >= 500) problems.push(`anon ${key} -> ${r.status()}`);
  else if (!PUBLIC_OK.has(`${m} ${u}`) && r.status() < 300) problems.push(`anon ${key} -> ${r.status()} (not protected?)`);
}
await anon.close();

const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');
let count = 0;
for (const [m, u] of routes) {
  if (m === 'GET' || u === '/api/reset' || u === '/api/auth/password') continue; // reset wipes data; password has a rate limit
  for (const [label, data] of Object.entries(bodies)) {
    const r = await ctx.request.fetch(BASE + u, { method: m, headers: { 'Content-Type': 'application/json' }, data });
    count++;
    if (r.status() >= 500) problems.push(`${m} ${u.replace(ZERO, ':id')} [${label}] -> ${r.status()} ${(await r.text()).slice(0, 120)}`);
  }
}
// Bad ids and odd query strings.
for (const u of ['/api/events/not-a-uuid', '/api/faqs/1', '/api/gallery/%27', '/api/guests/abc/token', '/api/rsvp/xyz']) {
  for (const m of ['PUT', 'PATCH', 'DELETE', 'POST']) {
    const r = await ctx.request.fetch(BASE + u, { method: m, headers: { 'Content-Type': 'application/json' }, data: '{}' });
    count++;
    if (r.status() >= 500) problems.push(`${m} ${u} -> ${r.status()}`);
  }
}
for (const u of ['/to/x/y', '/to/%00/%00', '/to/' + 'a'.repeat(3000) + '/bbbbbbbbbbbb', '/invitation', '/admin/../api/guests', '/api/guests/export?format=%27']) {
  const r = await ctx.request.get(BASE + u, { maxRedirects: 0 });
  count++;
  if (r.status() >= 500) problems.push(`GET ${u.slice(0, 60)} -> ${r.status()}`);
}
await browser.close();
console.log(`${count} requests`);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(problems.length ? `\n${problems.length} problems` : 'no problems found');
process.exitCode = problems.length ? 1 : 0;
