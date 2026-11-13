// UI audit: public invitation, a personal guest link and every admin page, at phone to desktop
// widths, in both themes. Fails on horizontal overflow, JS/console/CSP errors, failed requests,
// text below WCAG AA contrast, small tap targets and missing keyboard focus styles.
// Every finding is also written to test-results/ui-audit.json.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3917';
const PW = 'E2e-Test-Passw0rd!';
const WIDTHS = [320, 375, 390, 768, 1280];
const PHONE = 390;
const ADMIN = ['dashboard', 'wedding', 'events', 'gallery', 'guests', 'rsvp', 'guestbook', 'faqs', 'settings'];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const findings = [];
let where = '';
page.on('console', (m) => {
  if (m.type() === 'error' || /Content Security Policy/i.test(m.text())) findings.push({ where, kind: 'errors', detail: m.text().slice(0, 200) });
});
page.on('pageerror', (e) => findings.push({ where, kind: 'errors', detail: e.message.slice(0, 200) }));
page.on('response', (r) => {
  if (r.status() >= 400 && r.url().startsWith(BASE)) findings.push({ where, kind: 'errors', detail: `${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}` });
});
const api = (method, url, body) =>
  page.evaluate(async ([m, u, b]) => {
    const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, json: await r.json().catch(() => null) };
  }, [method, url, body]);

// Runs in the page: layout and readability problems in what is currently rendered.
function inspect(phone) {
  const out = { overflow: 0, tap: [], contrast: [] };
  const doc = document.documentElement;
  out.overflow = doc.scrollWidth - doc.clientWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.99) return false;
    }
    return true;
  };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=switch], summary')) {
    if (!visible(el)) continue;
    const type = (el.getAttribute('type') || '').toLowerCase();
    // Exempt: links inside running text, checkboxes/radios with a clickable label, file pickers.
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
    if ((type === 'checkbox' || type === 'radio') && el.closest('label')) continue;
    if (type === 'file') continue;
    const r = el.getBoundingClientRect();
    const min = phone && el.getAttribute('role') !== 'switch' ? 44 : 24; // switches are 48x24 (AA)
    if (r.height < min - 0.5 || r.width < 24) out.tap.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)} (min ${min})`);
  }
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1);
  const background = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null; // photo or gradient: can't judge
      const c = parse(s.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let base = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim();
    const el = n.parentElement;
    if (!text || !el || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    if (el.closest('svg, [aria-hidden="true"]')) continue; // decorative
    const s = getComputedStyle(el);
    const fg = parse(s.color);
    const bg = background(el);
    if (!fg || !bg) continue;
    const a = lum(blend(fg, bg)), b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const px = parseFloat(s.fontSize);
    const large = px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) out.contrast.push(`${ratio.toFixed(2)}:1 ${s.color} ${px}px "${text.slice(0, 30)}"`);
  }
  return out;
}

async function openCover() {
  const btn = page.getByRole('button', { name: 'Open Invitation' });
  if (await btn.count()) {
    await btn.click();
    await page.locator('[data-cover]').waitFor({ state: 'detached', timeout: 8000 });
  }
}

async function audit(name, url, { cover = false } = {}) {
  for (const width of WIDTHS) {
    where = `${name} @${width}`;
    await page.setViewportSize({ width, height: 800 });
    await page.goto(BASE + url);
    if (cover) await openCover();
    await page.waitForLoadState('networkidle').catch(() => {});
    // Scroll through so every animated section is shown before it is measured.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(700);
    const r = await page.evaluate(inspect, width <= PHONE);
    if (r.overflow > 0) findings.push({ where, kind: 'overflow', detail: `${r.overflow}px wider than the screen` });
    for (const d of new Set(r.tap)) findings.push({ where, kind: 'tap', detail: d });
    for (const d of new Set(r.contrast)) findings.push({ where, kind: 'contrast', detail: d });
  }
}

async function focusCheck(name, url, { cover = false } = {}) {
  where = `${name} keyboard`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE + url);
  if (cover) await openCover();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const missing = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const has = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      return has ? null : (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40);
    });
    if (missing) findings.push({ where, kind: 'focus', detail: `no visible focus: ${missing}` });
  }
}

where = 'login';
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');
const created = await api('POST', '/api/guests', { name: 'Audit Guest', phone: '', max_guests: 2, group_name: 'QA', invite_lamaran: true, invite_akad: true, invite_resepsi: true });
if (created.status !== 201) throw new Error(`guest ${created.status}`);
const guestPath = (await api('GET', '/api/guests')).json.data.guests.find((g) => g.name === 'Audit Guest').path;

for (const theme of ['light', 'dark']) {
  const s = (await api('GET', '/api/settings')).json.data;
  const put = await api('PUT', '/api/settings', { theme, show_gallery: s.show_gallery, show_envelope: s.show_envelope });
  if (put.status !== 200) throw new Error(`theme ${put.status}`);
  await audit(`public ${theme}`, '/', { cover: true });
  await audit(`guest ${theme}`, guestPath, { cover: true });
}
await focusCheck('guest page', guestPath, { cover: true });
for (const p of ADMIN) await audit(`admin/${p}`, `/admin/${p}`);
await focusCheck('admin/wedding', '/admin/wedding');
await ctx.clearCookies();
await audit('admin/login', '/admin/login');
await browser.close();

fs.mkdirSync(new URL('../../test-results/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../../test-results/ui-audit.json', import.meta.url), JSON.stringify(findings, null, 2));
const checks = [
  ['overflow', 'No horizontal scrolling at 320-1280px'],
  ['errors', 'No JS, console or CSP errors and no failed requests'],
  ['contrast', 'All text at least 4.5:1 (3:1 for large text), both themes'],
  ['tap', 'Tap targets: 44px on phones, 24px elsewhere'],
  ['focus', 'Keyboard focus is visible']
];
let failed = 0;
for (const [kind, name] of checks) {
  const list = findings.filter((f) => f.kind === kind);
  if (!list.length) { console.log(`PASS  ${name}`); continue; }
  failed++;
  const grouped = {};
  for (const f of list) (grouped[f.detail] ||= new Set()).add(f.where);
  console.log(`FAIL  ${name} — ${list.length} findings`);
  for (const [d, w] of Object.entries(grouped).slice(0, 15)) console.log(`        ${d}  [${[...w].slice(0, 4).join('; ')}${w.size > 4 ? ` +${w.size - 4}` : ''}]`);
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exitCode = failed ? 1 : 0;
