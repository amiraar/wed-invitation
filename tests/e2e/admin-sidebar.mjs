// Admin sidebar: sticky on desktop, icons, badges (incl. live refresh), mobile drawer.
import { chromium } from 'playwright';

const BASE = 'http://localhost:3917';
const PW = 'E2e-Test-Passw0rd!';
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

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('dialog', (d) => d.accept());
const api = (method, url, body) =>
  page.evaluate(async ([m, u, b]) => {
    const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, json: await r.json().catch(() => null) };
  }, [method, url, body]);
const nav = page.locator('#admin-nav');
const badge = (key) => nav.getByTestId(`badge-${key}`).locator('span[aria-hidden="true"]');

await step('Counts API requires login', async () => {
  const anon = await browser.newContext();
  const r = await anon.request.get(BASE + '/api/admin/counts');
  await anon.close();
  assert(r.status() === 401, `status ${r.status()}`);
});

await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');

await step('Every menu item has an icon', async () => {
  await nav.getByRole('link').first().waitFor();
  const links = await nav.getByRole('link').count();
  const icons = await nav.locator('a svg').count();
  assert(links === 9 && icons === 9, `links ${links}, icons ${icons}`);
});

await step('Desktop: sidebar stays in view while scrolling a long page', async () => {
  await page.goto(BASE + '/admin/wedding');
  await page.getByLabel("Groom's first name").waitFor();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  assert(pageHeight > 1600, `page too short to test (${pageHeight}px)`);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const box = await nav.boundingBox();
  assert(Math.abs(box.y) < 2 && Math.abs(box.height - 800) < 2, `sidebar box y=${box.y} h=${box.height}`);
  const settings = await nav.getByRole('link', { name: 'Settings' }).boundingBox();
  assert(settings.y >= 0 && settings.y + settings.height <= 800, `Settings link off screen (y=${settings.y})`);
});

let guests;
await step('Badges: guests without a reply and wishes waiting for approval', async () => {
  for (const name of ['Badge Tester Satu', 'Badge Tester Dua']) {
    const r = await api('POST', '/api/guests', { name, phone: '', max_guests: 1, group_name: 'QA', invite_lamaran: false, invite_akad: true, invite_resepsi: true });
    assert(r.status === 201, `guest ${r.status}`);
  }
  guests = (await api('GET', '/api/guests')).json.data.guests.filter((g) => g.name.startsWith('Badge Tester'));
  for (const text of ['Selamat menempuh hidup baru!', 'Semoga bahagia selalu.', 'Barakallah untuk kalian.']) {
    const r = await api('POST', '/api/guestbook', { token: guests[0].token, message: text, is_anonymous: false });
    assert(r.status === 200, `wish ${r.status}`);
  }
  await page.goto(BASE + '/admin/dashboard');
  await badge('guestsNoReply').filter({ hasText: /^2$/ }).waitFor();
  await badge('pendingWishes').filter({ hasText: /^3$/ }).waitFor();
  const title = await nav.getByTestId('badge-pendingWishes').getAttribute('title');
  assert(title === '3 waiting for approval', title);
});

await step('Badges update after an RSVP (on next page)', async () => {
  const r = await api('POST', '/api/rsvp', { token: guests[0].token, attending: true, guest_count: 1, attending_lamaran: false, attending_akad: true, attending_resepsi: false, message: '' });
  assert(r.status === 200, `rsvp ${r.status}`);
  await page.goto(BASE + '/admin/rsvp');
  await badge('guestsNoReply').filter({ hasText: /^1$/ }).waitFor();
});

await step('Badge updates right away when a wish is approved (no navigation)', async () => {
  await page.goto(BASE + '/admin/guestbook');
  await badge('pendingWishes').filter({ hasText: /^3$/ }).waitFor();
  await page.getByRole('row').filter({ hasText: 'Semoga bahagia selalu.' }).getByRole('button', { name: 'Approve' }).click();
  await badge('pendingWishes').filter({ hasText: /^2$/ }).waitFor({ timeout: 5000 });
});

await step('Badge disappears at zero', async () => {
  await page.getByRole('button', { name: 'Approve All Pending' }).click();
  await nav.getByTestId('badge-pendingWishes').waitFor({ state: 'detached', timeout: 5000 });
});

await step('RSVP delete brings the guest back to "no reply" (badge refresh)', async () => {
  await page.goto(BASE + '/admin/rsvp');
  // guests[0] got the RSVP above (the list is sorted by name, so it is "Badge Tester Dua").
  await page.getByRole('row').filter({ hasText: guests[0].name }).getByRole('button', { name: 'Delete' }).click();
  await badge('guestsNoReply').filter({ hasText: /^2$/ }).waitFor({ timeout: 5000 });
});

for (const width of [320, 390, 768]) {
  await step(`Mobile ${width}px: drawer hidden from keyboard when closed, opens/closes, locks page scroll`, async () => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto(BASE + '/admin/dashboard');
    await page.getByRole('button', { name: 'Open menu' }).waitFor();
    assert(!(await nav.isVisible()), 'drawer visible while closed');
    assert((await nav.evaluate((el) => getComputedStyle(el).visibility)) === 'hidden', 'closed drawer still focusable');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.waitForTimeout(300);
    assert(await nav.isVisible(), 'drawer did not open');
    assert((await page.evaluate(() => document.body.style.overflow)) === 'hidden', 'page scroll not locked');
    const box = await nav.boundingBox();
    assert(box.x === 0 && box.width <= width * 0.85 + 1, `drawer ${box.x} ${box.width}`);
    const heights = await nav.getByRole('link').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    assert(heights.every((h) => h >= 44), `link heights ${heights.join(',')}`);
    await badge('guestsNoReply').filter({ hasText: /^2$/ }).waitFor();
    const last = nav.getByRole('link', { name: 'Settings' });
    await last.scrollIntoViewIfNeeded();
    assert(await last.isVisible(), 'last item not reachable');
    const close = nav.getByRole('button', { name: 'Close menu' });
    const cb = await close.boundingBox();
    assert(cb.width >= 44 && cb.height >= 44, `close ${cb.width}x${cb.height}`);
    await close.click();
    await page.waitForTimeout(300);
    assert(!(await nav.isVisible()), 'drawer did not close');
    assert((await page.evaluate(() => document.body.style.overflow)) === '', 'page scroll still locked');
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    assert(overflow <= 1, `horizontal overflow ${overflow}px`);
  });
}

await step('Mobile: overlay tap closes the drawer; navigating closes it', async () => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto(BASE + '/admin/dashboard');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(300);
  await page.mouse.click(375, 400); // right of the 85vw drawer = overlay
  await page.waitForTimeout(300);
  assert(!(await nav.isVisible()), 'overlay tap did not close');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(300);
  await nav.getByRole('link', { name: /Wishes/ }).click();
  await page.waitForURL('**/admin/guestbook');
  await page.waitForTimeout(300);
  assert(!(await nav.isVisible()), 'drawer stayed open after navigating');
});

await step('No uncaught browser errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

for (const g of guests ?? []) await api('DELETE', `/api/guests/${g.id}`);
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
