// Invitation: opening cover, event cards, layout checks, screenshots (test-results/invitation).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:3917';
const PW = 'E2e-Test-Passw0rd!';
// Screenshots for a visual check; test-results/ is git-ignored and uploaded by CI on failure.
const SHOTS = fileURLToPath(new URL('../../test-results/invitation', import.meta.url));
fs.mkdirSync(SHOTS, { recursive: true });
const db = (query) =>
  execFileSync('docker', ['exec', 'wedinv-e2e-postgres-1', 'psql', '-U', 'postgres', '-d', 'main', '-tAc', query], { encoding: 'utf8' }).trim();

const results = [];
async function step(name, fn) {
  try {
    const note = await fn();
    results.push(['PASS', name]);
    console.log(`PASS  ${name}${note ? ` — ${note}` : ''}`);
  } catch (e) {
    results.push(['FAIL', name]);
    console.log(`FAIL  ${name} — ${e.message.split('\n')[0]}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Test content: names, a future date, three events with venues; the guest is invited to akad + resepsi.
db("UPDATE wedding_config SET groom_name = 'Amirul', bride_name = 'Nara', music_url = 'https://example.com/song.mp3', music_autoplay = TRUE WHERE id = 'main'");
db("UPDATE events SET is_active = TRUE, event_date = '2027-06-12', time_start = '08:00', venue_name = 'Masjid Agung', address = 'Jl. Merdeka 1, Bandung', maps_url = 'https://maps.google.com/?q=masjid', dress_code = 'White' WHERE type = 'akad'");
db("UPDATE events SET is_active = TRUE, event_date = '2027-06-12', time_start = '11:00', time_end = '14:00', venue_name = 'Grand Ballroom', address = 'Jl. Asia Afrika 8, Bandung', dress_code = 'Sage green' WHERE type = 'resepsi'");
db("UPDATE events SET is_active = TRUE, event_date = '2027-03-01', venue_name = 'Family Home', address = 'Jl. Dago 5, Bandung' WHERE type = 'lamaran'");

const browser = await chromium.launch();
const ctx = await browser.newContext();
// Record play() calls: headless browsers can't load example.com audio, but we can see the attempt.
await ctx.addInitScript(() => {
  window.__playCalls = 0;
  const original = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__playCalls += 1;
    return original.call(this).catch(() => undefined);
  };
});
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

// Admin login + a guest invited to akad and resepsi only.
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');
await page.evaluate(() =>
  fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ibu Ratna Sari', phone: '', max_guests: 2, group_name: 'Keluarga', invite_lamaran: false, invite_akad: true, invite_resepsi: true })
  })
);
const guest = (await page.evaluate(() => fetch('/api/guests').then((r) => r.json()))).data.guests.find((g) => g.name === 'Ibu Ratna Sari');
const personal = guest.path;

const cover = () => page.locator('[data-cover]');
const bodyOverflow = () => page.evaluate(() => document.body.style.overflow);

await step('Public /: cover with generic greeting, page scroll locked, button focused', async () => {
  await page.goto(BASE + '/');
  await cover().getByText('Kepada Yth.').waitFor();
  await cover().getByText('Bapak/Ibu/Saudara/i').waitFor();
  await cover().getByText('Amirul').waitFor();
  assert((await bodyOverflow()) === 'hidden', 'scroll not locked');
  await page.waitForTimeout(300);
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  assert(focused === 'Open Invitation', `focused: ${focused}`);
});
await step('Cover opens with the keyboard (Enter), scroll restored, music attempted', async () => {
  await page.keyboard.press('Enter');
  await cover().waitFor({ state: 'detached', timeout: 8000 });
  assert((await bodyOverflow()) === '', 'scroll still locked');
  const calls = await page.evaluate(() => window.__playCalls);
  assert(calls >= 1, `play() calls: ${calls}`);
});
await step('Music not started on open when autoplay is off', async () => {
  db("UPDATE wedding_config SET music_autoplay = FALSE WHERE id = 'main'");
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Open Invitation' }).click();
  await cover().waitFor({ state: 'detached', timeout: 8000 });
  assert((await page.evaluate(() => window.__playCalls)) === 0, 'music started');
  db("UPDATE wedding_config SET music_autoplay = TRUE WHERE id = 'main'");
});
await step('Personal link: cover greets the guest by name', async () => {
  await page.goto(BASE + personal);
  await cover().getByText('Ibu Ratna Sari').waitFor();
  assert((await cover().getByText('Bapak/Ibu/Saudara/i').count()) === 0, 'generic greeting on a personal link');
  await page.getByRole('button', { name: 'Open Invitation' }).click();
  await cover().waitFor({ state: 'detached', timeout: 8000 });
});
await step('Personal link: event cards only for invited events, with dress code', async () => {
  const cards = page.locator('#events article');
  await cards.first().waitFor();
  const text = await cards.allTextContents();
  assert(text.length === 2, `cards: ${text.length}`);
  assert(text[0].includes('Akad Nikah') && text[0].includes('Masjid Agung') && text[0].includes('White'), text[0]);
  assert(text[1].includes('Reception') && text[1].includes('Sage green') && text[1].includes('11:00 – 14:00'), text[1]);
  assert(!(await page.locator('#events').textContent()).includes('Engagement'), 'Engagement card shown to a guest not invited');
  assert((await page.locator('#events a[href="https://maps.google.com/?q=masjid"]').count()) === 1, 'map link missing');
});
await step('Public /: all three active events shown', async () => {
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Open Invitation' }).click();
  await cover().waitFor({ state: 'detached', timeout: 8000 });
  assert((await page.locator('#events article').count()) === 3, 'not 3 cards');
});
await step('Reduced motion: cover still opens', async () => {
  const rm = await browser.newContext({ reducedMotion: 'reduce' });
  const p = await rm.newPage();
  await p.goto(BASE + '/');
  await p.getByRole('button', { name: 'Open Invitation' }).click();
  await p.locator('[data-cover]').waitFor({ state: 'detached', timeout: 8000 });
  await rm.close();
});
await step('Without JavaScript the cover is hidden (noscript style in HTML)', async () => {
  const html = await (await ctx.request.get(BASE + '/')).text();
  assert(html.includes('<noscript><style>[data-cover]{display:none!important}</style></noscript>'), 'noscript fallback missing');
});
await step('No horizontal overflow at 320–1024px (cover and opened page)', async () => {
  const bad = [];
  for (const width of [320, 360, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 760 });
    for (const path of ['/', personal]) {
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
      const before = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      await page.getByRole('button', { name: 'Open Invitation' }).click();
      await cover().waitFor({ state: 'detached', timeout: 8000 });
      const after = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      if (before > 1 || after > 1) bad.push(`${width}px ${path} (+${Math.max(before, after)}px)`);
    }
  }
  assert(bad.length === 0, bad.join(', '));
});
await step('Screenshots saved for review (cover, hero, events, RSVP, wishes × 3 widths)', async () => {
  for (const [label, width, height] of [['mobile', 390, 844], ['tablet', 768, 1024], ['desktop', 1280, 800]]) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + personal);
    await page.waitForTimeout(2200); // let the cover's entrance animation finish
    await page.screenshot({ path: `${SHOTS}/${label}-1-cover.png` });
    await page.getByRole('button', { name: 'Open Invitation' }).click();
    await cover().waitFor({ state: 'detached', timeout: 8000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/${label}-2-hero.png` });
    for (const [n, id] of [['3-events', 'events'], ['4-rsvp', 'rsvp'], ['5-wishes', 'guestbook']]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await page.locator(`#${id}`).screenshot({ path: `${SHOTS}/${label}-${n}.png` });
    }
  }
  return `${fs.readdirSync(SHOTS).length} files in test-results/invitation`;
});
await step('No uncaught browser errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

// Cleanup for later runs
await page.evaluate((id) => fetch(`/api/guests/${id}`, { method: 'DELETE' }), guest.id);
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
