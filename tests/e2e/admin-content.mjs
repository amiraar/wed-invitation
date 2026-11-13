// Admin content: Couple & Story / Events / Settings save flows, validation messages, mobile layout.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const BASE = 'http://localhost:3917';
const PW = 'E2e-Test-Passw0rd!';
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
// Public pages open behind the invitation cover (PR3): navigate, then open it.
async function openCover(p) {
  const btn = p.getByRole('button', { name: 'Open Invitation' });
  if (await btn.count()) {
    await btn.click();
    await p.locator('[data-cover]').waitFor({ state: 'detached', timeout: 8000 });
  }
}
async function go(p, url) {
  const res = await p.goto(url);
  const path = new URL(url).pathname;
  if (!path.startsWith('/admin') && !path.startsWith('/api') && res && res.status() === 200) await openCover(p);
  return res;
}
const resp = (page, pathname, method) =>
  page.waitForResponse((r) => new URL(r.url()).pathname === pathname && r.request().method() === method, { timeout: 15000 });
const respPrefix = (page, prefix, method) =>
  page.waitForResponse((r) => new URL(r.url()).pathname.startsWith(prefix) && r.request().method() === method, { timeout: 15000 });

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
const toastText = () => page.getByRole('status').filter({ hasText: /\S/ }).last();

// ---------- Login + test data ----------
await page.setViewportSize({ width: 1280, height: 900 });
await go(page, BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');
await api('POST', '/api/guests', { name: 'Mobile Tester', phone: '', max_guests: 2, group_name: 'QA', invite_lamaran: true, invite_akad: true, invite_resepsi: true });
const guestList = (await api('GET', '/api/guests')).json.data.guests;
const tester = guestList.find((g) => g.name === 'Mobile Tester');
const personal = tester.path;

await step('Migration: hidden Engagement moved onto the event; old switch retired', async () => {
  const ev = db("SELECT is_active FROM events WHERE type = 'lamaran'");
  const sw = db("SELECT show_lamaran||'|'||show_akad||'|'||show_resepsi FROM app_settings WHERE id = 'main'");
  assert(ev === 'f' || ev === 'false', `lamaran is_active=${ev}`);
  assert(sw === 'true|true|true', sw);
});

// ---------- No horizontal overflow ----------
const adminPages = ['dashboard', 'guests', 'rsvp', 'guestbook', 'wedding', 'events', 'gallery', 'faqs', 'settings'].map((p) => `/admin/${p}`);
for (const width of [320, 360, 390, 768, 1024]) {
  await step(`No horizontal overflow at ${width}px (public, personal link, 9 admin pages)`, async () => {
    await page.setViewportSize({ width, height: 800 });
    const bad = [];
    for (const path of ['/', personal, ...adminPages]) {
      await go(page, BASE + path);
      await page.waitForLoadState('networkidle');
      const { sw, iw } = await page.evaluate(() => ({
        sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        iw: window.innerWidth
      }));
      if (sw > iw + 1) bad.push(`${path} (${sw}px)`);
    }
    assert(bad.length === 0, bad.join(', '));
  });
}

// ---------- Public mobile ----------
await step('Countdown: four boxes in one row at 320/360/390px', async () => {
  // The seeded date is already past (the page then shows "We Are Married"); use a future one.
  db("UPDATE events SET event_date = '2027-06-12' WHERE type = 'akad'");
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await go(page, BASE + '/');
    await page.locator('#countdown .grid > div').first().waitFor();
    const tops = await page.locator('#countdown .grid > div').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    assert(tops.length === 4 && new Set(tops).size === 1, `${width}px tops ${tops.join(',')}`);
  }
});

await step('Music URL + autoplay saved from one place (Couple & Story → Media)', async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await go(page, BASE + '/admin/wedding');
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await page.getByLabel('Music link').fill('https://example.com/song.mp3');
  const sw = page.getByRole('switch', { name: 'Start music automatically' });
  if ((await sw.getAttribute('aria-checked')) !== 'true') await sw.click();
  const r = resp(page, '/api/wedding', 'PUT');
  await save.click();
  assert((await r).status() === 200, 'PUT failed');
  await toastText().filter({ hasText: 'Invitation content saved.' }).waitFor();
  assert(db("SELECT music_autoplay||'|'||music_url FROM wedding_config WHERE id = 'main'") === 'true|https://example.com/song.mp3', 'not stored');
  await go(page, BASE + '/');
  assert((await page.locator('audio').getAttribute('src')) === 'https://example.com/song.mp3', 'no audio on invitation');
});

await step('Tap targets: public hamburger, music button, admin menu ≥ 44px', async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  await go(page, BASE + '/');
  const ham = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
  const music = await page.getByRole('button', { name: /music/i }).boundingBox();
  await go(page, BASE + '/admin/dashboard');
  const adm = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
  for (const [n, b] of [['hamburger', ham], ['music', music], ['admin menu', adm]]) assert(b && b.width >= 44 && b.height >= 44, `${n} ${b?.width}x${b?.height}`);
});

await step('Music button does not cover the FAQ +/− toggles', async () => {
  await go(page, BASE + '/');
  const music = await page.getByRole('button', { name: /music/i }).boundingBox();
  // The whole row is clickable; what must stay uncovered is the +/− icon at its right end.
  const toggles = await page.locator('#faq button[aria-expanded] > span:last-child').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
  assert(toggles.length > 0, 'no FAQ toggles');
  assert(toggles.every((left) => left > music.x + music.width), `music ${music.x}+${music.width} vs toggles ${toggles.join(',')}`);
});

const bg = (locator) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);
const transparent = (c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
await step('Navbar: scrolled header has a background (was transparent before)', async () => {
  await go(page, BASE + '/');
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(700);
  const c = await bg(page.locator('header').first());
  assert(!transparent(c), c);
  return c;
});
await step('Navbar: mobile menu solid, aria-expanded, closes on outside tap and Escape', async () => {
  await go(page, BASE + '/');
  const btn = page.getByRole('button', { name: 'Open menu' });
  await btn.click();
  const closeBtn = page.getByRole('button', { name: 'Close menu' });
  assert((await closeBtn.getAttribute('aria-expanded')) === 'true', 'aria-expanded not true');
  await page.waitForTimeout(400);
  const panel = await bg(page.locator('#mobile-menu > div'));
  assert(!transparent(panel), `panel ${panel}`);
  await page.mouse.click(200, 700);
  await page.getByRole('button', { name: 'Open menu' }).waitFor();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open menu' }).waitFor();
});

await step('Dark theme is in the server HTML (no light flash)', async () => {
  const r = await api('PUT', '/api/settings', { theme: 'dark', show_gallery: true, show_envelope: true });
  assert(r.status === 200, `settings ${r.status}`);
  const html = await (await ctx.request.get(BASE + '/')).text();
  assert(/class="theme-dark min-h-dvh/.test(html), 'theme-dark class not server-rendered');
  await api('PUT', '/api/settings', { theme: 'light', show_gallery: true, show_envelope: true });
});

// ---------- Admin ----------
await step('Admin drawer (390px): opens, navigates, closes on route change and Escape', async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  await go(page, BASE + '/admin/dashboard');
  const nav = page.locator('#admin-nav');
  const visible = () => nav.isVisible();
  assert(!(await visible()), 'drawer visible before opening');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(300);
  assert(await visible(), 'drawer did not open');
  await nav.getByRole('link', { name: 'Gallery' }).click();
  await page.waitForURL('**/admin/gallery');
  await page.waitForTimeout(300);
  assert(!(await visible()), 'drawer stayed open after navigating');
  assert((await page.locator('header h1').textContent()) === 'Gallery', 'header title not updated');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  assert(!(await visible()), 'Escape did not close the drawer');
});
await step('Admin desktop (1280px): sidebar grouped and visible, no menu button', async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await go(page, BASE + '/admin/dashboard');
  assert((await page.locator('#admin-nav').boundingBox()).x >= 0, 'sidebar hidden');
  assert(!(await page.getByRole('button', { name: 'Open menu' }).isVisible()), 'menu button visible on desktop');
  for (const label of ['Overview', 'Guests', 'Invitation', 'Site', 'Couple & Story', 'Events & Venues', 'Wishes']) await page.locator('#admin-nav').getByText(label, { exact: true }).waitFor();
  assert((await page.getByRole('link', { name: 'View invitation ↗' }).getAttribute('href')) === '/', 'no view-site link');
});

await step('Save disabled until content loaded (Couple & Story, Settings)', async () => {
  for (const [path, apiPath, label] of [['/admin/wedding', '/api/wedding', 'Save'], ['/admin/settings', '/api/settings', 'Save Settings']]) {
    await page.route(`**${apiPath}`, async (route) => {
      if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await go(page, BASE + path);
    const btn = page.getByRole('button', { name: label, exact: true });
    assert(await btn.isDisabled(), `${path}: Save enabled before load`);
    await page.waitForTimeout(2200);
    assert(await btn.isEnabled(), `${path}: Save still disabled after load`);
    await page.unroute(`**${apiPath}`);
  }
});

await step('Readable validation error instead of field paths', async () => {
  await go(page, BASE + '/admin/wedding');
  await page.getByLabel('Cover photo link').fill('http://insecure.example/photo.jpg');
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await save.click();
  await toastText().filter({ hasText: 'Please check: Cover photo (must be an https:// URL).' }).waitFor();
  await page.getByLabel('Cover photo link').fill('');
  await save.click();
  await toastText().filter({ hasText: 'Invitation content saved.' }).waitFor();
});

await step('Settings: no event or music switches left, Gifts/Gallery only', async () => {
  await go(page, BASE + '/admin/settings');
  await page.getByRole('switch').first().waitFor();
  const switches = await page.getByRole('switch').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
  assert(JSON.stringify(switches) === JSON.stringify(['Gallery', 'Gifts (bank accounts & wishlist)']), JSON.stringify(switches));
  assert(!(await page.content()).includes('Music Autoplay'), 'music autoplay still on settings');
});

await step('Event switch alone controls visibility (personal link RSVP)', async () => {
  const engagementShown = async () => {
    await go(page, BASE + personal);
    await page.getByText('Dear Mobile Tester').waitFor();
    return (await page.getByLabel('Engagement').count()) > 0;
  };
  assert(!(await engagementShown()), 'migrated hidden Engagement is shown');
  await go(page, BASE + '/admin/events');
  await page.getByRole('switch', { name: 'Show Engagement on invitation' }).click();
  const r = respPrefix(page, '/api/events/', 'PUT');
  await page.getByRole('button', { name: 'Save Engagement' }).click();
  assert((await r).status() === 200, 'PUT failed');
  await toastText().filter({ hasText: 'Engagement saved.' }).waitFor();
  assert(await engagementShown(), 'Engagement not shown after turning it on');
  await go(page, BASE + '/admin/events');
  await page.getByRole('switch', { name: 'Show Engagement on invitation' }).click();
  await page.getByRole('button', { name: 'Save Engagement' }).click();
  await toastText().filter({ hasText: 'Engagement saved.' }).waitFor();
  assert(!(await engagementShown()), 'Engagement still shown after turning it off');
});

await step('Events use date and time pickers', async () => {
  await go(page, BASE + '/admin/events');
  await page.locator('input[type="date"]').first().waitFor();
  const types = await page.locator('.admin-card input[type="date"], .admin-card input[type="time"]').count();
  assert(types === 9, `pickers: ${types}`);
});

await step('Gallery: rejected URL stays in the field with an error', async () => {
  await go(page, BASE + '/admin/gallery');
  await page.getByLabel('Image URL').fill('http://not-https.example/a.jpg');
  const r = resp(page, '/api/gallery', 'POST');
  await page.getByRole('button', { name: 'Add Photo' }).click();
  assert((await r).status() === 400, 'not rejected');
  await toastText().filter({ hasText: 'Image URL' }).waitFor();
  assert((await page.getByLabel('Image URL').inputValue()) === 'http://not-https.example/a.jpg', 'URL cleared');
});

await step('Wishes: Pending/Approved/All tabs, Approve → Hide, Delete', async () => {
  for (const text of ['Selamat ya, bahagia selalu!', 'Semoga langgeng sampai tua.']) {
    const r = await api('POST', '/api/guestbook', { token: tester.token, message: text, is_anonymous: false });
    assert(r.status === 200, `wish ${r.status}`);
  }
  await go(page, BASE + '/admin/guestbook');
  await page.getByRole('tab', { name: /Pending \(2\)/ }).waitFor();
  const row = () => page.getByRole('row').filter({ hasText: 'Selamat ya, bahagia selalu!' });
  await row().getByRole('button', { name: 'Approve' }).click();
  await toastText().filter({ hasText: 'Wish approved' }).waitFor();
  await page.getByRole('tab', { name: /Approved/ }).click();
  await row().getByRole('button', { name: 'Hide' }).click();
  await toastText().filter({ hasText: 'Wish hidden' }).waitFor();
  await page.getByRole('tab', { name: /All \(3\)/ }).click(); // incl. the legacy approved wish
  await row().getByRole('button', { name: 'Delete' }).click();
  await toastText().filter({ hasText: 'Wish deleted.' }).waitFor();
  await page.getByRole('tab', { name: /All \(2\)/ }).waitFor();
});
await step('Wishes: bulk approve reports failures', async () => {
  await api('POST', '/api/guestbook', { token: tester.token, message: 'Barakallah untuk kalian berdua.', is_anonymous: true });
  await go(page, BASE + '/admin/guestbook');
  await page.getByRole('tab', { name: /Pending \(2\)/ }).waitFor();
  let failedOnce = false;
  await page.route('**/api/guestbook/*', async (route) => {
    if (route.request().method() === 'PATCH' && !failedOnce) {
      failedOnce = true;
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' });
    }
    return route.continue();
  });
  await page.getByRole('button', { name: 'Approve All Pending' }).click();
  await toastText().filter({ hasText: '1 approved, 1 failed' }).waitFor();
  await page.unroute('**/api/guestbook/*');
});

await step('Reset needs typed RESET', async () => {
  await go(page, BASE + '/admin/settings');
  const btn = page.getByRole('button', { name: 'Reset All Data' });
  assert(await btn.isDisabled(), 'enabled without confirmation');
  await page.getByLabel('Type RESET to confirm').fill('reset');
  assert(await btn.isDisabled(), 'enabled with lowercase');
  await page.getByLabel('Type RESET to confirm').fill('RESET');
  assert(await btn.isEnabled(), 'not enabled with RESET');
  await page.getByLabel('Type RESET to confirm').fill('');
});

await step('No uncaught browser errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

// Cleanup for the next run
await api('DELETE', `/api/guests/${tester.id}`);
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
