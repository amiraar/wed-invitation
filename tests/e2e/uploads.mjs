// Uploads: token route, drag & drop uploads (Vercel Blob faked locally), gallery display options.
// Run with BLOB_READ_WRITE_TOKEN=vercel_blob_rw_teststore_<secret> and VERCEL_BLOB_API_URL=http://127.0.0.1:4555
// so the server signs tokens locally and its blob deletes go to the fake API below (nothing leaves this machine;
// the browser's uploads to vercel.com are answered by Playwright).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import http from 'node:http';

const BASE = 'http://localhost:3917';
const PW = 'E2e-Test-Passw0rd!';
const STORE = 'https://teststore.public.blob.vercel-storage.com';
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
    console.log(`FAIL  ${name} — ${e.message.split('\n').slice(0, 4).join(' / ')}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Fake Blob API for the server side (del).
const serverBlobCalls = [];
const fakeApi = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    serverBlobCalls.push({ method: req.method, url: req.url, body });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
});
await new Promise((r) => fakeApi.listen(4555, '127.0.0.1', r));

db("UPDATE events SET is_active = TRUE, event_date = '2027-06-12', venue_name = 'Masjid Agung' WHERE type = 'akad'");
db("UPDATE wedding_config SET groom_name = 'Amirul', bride_name = 'Nara', cover_image_url = '', venue_image_url = '', music_url = '' WHERE id = 'main'");

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('dialog', (d) => d.accept());

// Browser → Vercel Blob uploads are answered here, like the real API would.
const browserUploads = [];
await page.route('https://vercel.com/api/blob/**', async (route) => {
  const request = route.request();
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'PUT, OPTIONS' };
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  const pathname = new URL(request.url()).searchParams.get('pathname');
  browserUploads.push({ pathname, auth: request.headers()['authorization'] ?? '', type: request.headers()['x-content-type'] ?? '' });
  const dot = pathname.lastIndexOf('.');
  const stored = dot > 0 ? `${pathname.slice(0, dot)}-R4nd0m${pathname.slice(dot)}` : `${pathname}-R4nd0m`;
  return route.fulfill({
    status: 200,
    headers: { ...cors, 'content-type': 'application/json' },
    body: JSON.stringify({ url: `${STORE}/${stored}`, downloadUrl: `${STORE}/${stored}?download=1`, pathname: stored, contentType: request.headers()['x-content-type'], contentDisposition: 'inline', etag: '"1"' })
  });
});

const api = (method, url, body) =>
  page.evaluate(async ([m, u, b]) => {
    const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, json: await r.json().catch(() => null) };
  }, [method, url, body]);
const toast = () => page.getByRole('status');
// Toasts with the same text can still be on screen from an earlier step, so wait for the real change.
async function waitFor(check, label) {
  for (let i = 0; i < 60; i++) {
    if (await check()) return;
    await page.waitForTimeout(100);
  }
  throw new Error(label);
}
const tokenRequest = (pathname) => ({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: null, multipart: false } });
// Same decoding as getPayloadFromClientToken in @vercel/blob/client.
const tokenPayload = (clientToken) => {
  const encoded = clientToken.split('_')[4] ?? '';
  return JSON.parse(Buffer.from(Buffer.from(encoded, 'base64').toString().split('.')[1] ?? '', 'base64').toString());
};
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const png = (name) => ({ name, mimeType: 'image/png', buffer: PNG });
// Drops files on an element like a real drag & drop (DataTransfer built in the page).
async function dropFiles(target, files) {
  const dt = await page.evaluateHandle((list) => {
    const transfer = new DataTransfer();
    // A big file is made in the page (zeros) instead of sending its bytes over.
    for (const f of list) transfer.items.add(new File([f.size ? new Uint8Array(f.size) : Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0))], f.name, { type: f.type }));
    return transfer;
  }, files.map((f) => ({ name: f.name, type: f.mimeType, size: f.size, b64: f.buffer ? f.buffer.toString('base64') : '' })));
  await target.dispatchEvent('drop', { dataTransfer: dt });
}

// ---------- 1. Upload token route ----------
await step('Upload token: needs login', async () => {
  const anon = await browser.newContext();
  const r = await anon.request.post(BASE + '/api/upload', { data: tokenRequest('wedding/image/a.jpg') });
  await anon.close();
  assert(r.status() === 401, `status ${r.status()}`);
});

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');

await step('Upload token: only token requests, only wedding/image|audio paths', async () => {
  const completed = await api('POST', '/api/upload', { type: 'blob.upload-completed', payload: {} });
  assert(completed.status === 400, `upload-completed ${completed.status}`);
  for (const bad of ['../etc/passwd', 'wedding/video/a.mp4', 'other/image/a.jpg', 'wedding/image/', 'wedding/image/../x.jpg', 'wedding/image/A.JPG']) {
    const r = await api('POST', '/api/upload', tokenRequest(bad));
    assert(r.status === 400 && !r.json?.clientToken, `${bad} → ${r.status}`);
  }
});
await step('Upload token: image and audio tokens carry the type and size limits', async () => {
  const image = await api('POST', '/api/upload', tokenRequest('wedding/image/my-photo.jpg'));
  assert(image.status === 200 && image.json.type === 'blob.generate-client-token' && image.json.clientToken.startsWith('vercel_blob_client_teststore_'), JSON.stringify(image.json).slice(0, 120));
  const ip = tokenPayload(image.json.clientToken);
  assert(ip.pathname === 'wedding/image/my-photo.jpg' && ip.maximumSizeInBytes === 10485760 && ip.addRandomSuffix === true, JSON.stringify(ip));
  assert(JSON.stringify(ip.allowedContentTypes) === JSON.stringify(['image/jpeg', 'image/png', 'image/webp', 'image/gif']), JSON.stringify(ip.allowedContentTypes));
  const audio = tokenPayload((await api('POST', '/api/upload', tokenRequest('wedding/audio/song.mp3'))).json.clientToken);
  assert(audio.maximumSizeInBytes === 15728640 && audio.allowedContentTypes.includes('audio/mpeg') && !audio.allowedContentTypes.includes('image/png'), JSON.stringify(audio));
});

// ---------- 2. Couple & Story media ----------
await step('Couple & Story: choose a cover photo → uploaded, link filled, preview shown', async () => {
  await page.goto(BASE + '/admin/wedding');
  await page.locator('fieldset:not([disabled])').waitFor();
  await page.getByTestId('drop-image').first().locator('input[type=file]').setInputFiles(png('Our Cover (1).PNG'));
  await toast().getByText('Photo uploaded. Press Save to keep it.').waitFor();
  const link = await page.getByLabel('Cover photo link').inputValue();
  assert(link === `${STORE}/wedding/image/our-cover-1--R4nd0m.png`, link);
  const last = browserUploads.at(-1);
  assert(last.pathname === 'wedding/image/our-cover-1-.png' && last.auth.startsWith('Bearer vercel_blob_client_teststore_') && last.type === 'image/png', JSON.stringify(last));
  assert((await page.getByAltText('Cover photo preview').count()) === 1, 'no preview');
});
await step('Couple & Story: drop a venue photo and an mp3', async () => {
  await dropFiles(page.getByTestId('drop-image').nth(1), [png('venue.png')]);
  await waitFor(async () => (await page.getByLabel('Venue photo link').inputValue()) !== '', 'venue link never filled');
  assert((await page.getByLabel('Venue photo link').inputValue()).endsWith('/wedding/image/venue-R4nd0m.png'), 'venue link');
  await dropFiles(page.getByTestId('drop-audio'), [{ name: 'Our Song.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('ID3fake-mp3-bytes') }]);
  await toast().getByText('Music uploaded. Press Save to keep it.').waitFor();
  await waitFor(async () => (await page.getByLabel('Music link').inputValue()) !== '', 'music link never filled');
  assert((await page.getByLabel('Music link').inputValue()).endsWith('/wedding/audio/our-song-R4nd0m.mp3'), 'music link');
  assert((await page.getByLabel('Music preview').count()) === 1, 'no audio preview');
  // Late (throttled) progress events must not leave the zones stuck on "Uploading… 100%".
  await page.waitForTimeout(400);
  for (const zone of [page.getByTestId('drop-audio'), page.getByTestId('drop-image').nth(1)]) {
    assert(!(await zone.textContent()).includes('Uploading'), `stuck: ${await zone.textContent()}`);
  }
});
await step('Couple & Story: wrong or too large files are refused before uploading', async () => {
  const before = browserUploads.length;
  await page.getByTestId('drop-image').first().locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await toast().getByText(`"notes.txt" isn't a supported file. JPG, PNG, WebP or GIF, up to 10 MB.`).waitFor();
  await dropFiles(page.getByTestId('drop-audio'), [{ name: 'huge.mp3', mimeType: 'audio/mpeg', size: 15 * 1024 * 1024 + 1 }]);
  await toast().getByText('"huge.mp3" is too large. MP3 or M4A, up to 15 MB.').waitFor();
  assert(browserUploads.length === before, 'a refused file was uploaded');
});
await step('Couple & Story: Save stores the uploaded links; pasting a link still works', async () => {
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/wedding') && r.request().method() === 'PUT'),
    page.getByRole('button', { name: 'Save', exact: true }).click()
  ]);
  await toast().getByText('Invitation content saved.').waitFor();
  const row = db("SELECT cover_image_url || '|' || venue_image_url || '|' || music_url FROM wedding_config WHERE id = 'main'").split('|');
  assert(row[0].startsWith(STORE) && row[1].endsWith('venue-R4nd0m.png') && row[2].endsWith('our-song-R4nd0m.mp3'), row.join(' | '));
  await page.getByLabel('Cover photo link').fill('https://images.unsplash.com/photo-1519741497674-611481863552');
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/wedding') && r.request().method() === 'PUT'),
    page.getByRole('button', { name: 'Save', exact: true }).click()
  ]);
  assert(db("SELECT cover_image_url FROM wedding_config WHERE id = 'main'") === 'https://images.unsplash.com/photo-1519741497674-611481863552', 'pasted link not saved');
});

// ---------- 3. Gallery uploads ----------
await step('Gallery: drop three photos at once → all added in order', async () => {
  await page.goto(BASE + '/admin/gallery');
  await page.getByTestId('drop-image').waitFor();
  await dropFiles(page.getByTestId('drop-image'), [png('one.png'), png('two.png'), png('three.png')]);
  await toast().getByText('3 photos added.').waitFor();
  const rows = db("SELECT string_agg(url || '#' || order_index, ',' ORDER BY order_index) FROM gallery").split(',');
  assert(rows.length === 3, rows.join(' '));
  assert(rows[0].includes('/one-R4nd0m.png#0') && rows[1].includes('/two-R4nd0m.png#1') && rows[2].includes('/three-R4nd0m.png#2'), rows.join(' '));
  assert((await page.getByTestId('gallery-item').count()) === 3, 'list not updated');
  await page.waitForTimeout(400);
  assert(!(await page.getByTestId('drop-image').textContent()).includes('Uploading'), 'gallery drop zone stuck');
});
await step('Gallery: choose files button + add by link still work', async () => {
  await page.getByTestId('drop-image').locator('input[type=file]').setInputFiles([png('four.png')]);
  await toast().getByText('Photo added.').waitFor();
  await page.getByLabel('Image URL').fill('https://images.unsplash.com/photo-1519741497674-611481863552');
  await page.getByRole('button', { name: 'Add Photo' }).click();
  await page.getByTestId('gallery-item').nth(4).waitFor();
  assert(db('SELECT count(*) FROM gallery') === '5', 'not 5 photos');
  assert(db("SELECT max(order_index) FROM gallery") === '4', 'order not last');
});

// ---------- 4. Gallery display options ----------
await step('Gallery: layout + place save right away and survive a Settings save', async () => {
  await page.getByRole('radio', { name: /Grid/ }).click();
  await toast().getByText('Gallery layout saved.').waitFor();
  assert((await page.getByRole('radio', { name: /Grid/ }).getAttribute('aria-checked')) === 'true', 'radio not checked');
  await page.getByLabel('Place on the invitation').selectOption('after_story');
  await page.waitForTimeout(600);
  assert(db("SELECT gallery_layout || '|' || gallery_position FROM app_settings WHERE id = 'main'") === 'grid|after_story', 'not stored');
  const r = await api('PUT', '/api/settings', { theme: 'light', show_gallery: true, show_envelope: true });
  assert(r.status === 200, `settings ${r.status}`);
  assert(db("SELECT gallery_layout || '|' || gallery_position FROM app_settings WHERE id = 'main'") === 'grid|after_story', 'Settings save reset the gallery options');
  const bad = await api('PUT', '/api/settings', { theme: 'light', show_gallery: true, show_envelope: true, gallery_layout: 'carousel' });
  assert(bad.status === 400, `bad layout ${bad.status}`);
});
await step('Gallery: per-photo size, focus and caption', async () => {
  await page.reload();
  const first = page.getByTestId('gallery-item').first();
  await first.waitFor();
  await first.getByRole('button', { name: 'large' }).click();
  await toast().getByText('Photo updated.').waitFor();
  await page.getByLabel('Photo 2 focus').selectOption('top');
  await page.waitForTimeout(500);
  await page.getByLabel('Photo 3 caption').fill("Mom's & Dad's");
  await page.getByLabel('Photo 3 caption').blur();
  await page.waitForTimeout(500);
  const rows = db("SELECT string_agg(size || '/' || focus || '/' || caption, ',' ORDER BY order_index) FROM gallery").split(',');
  assert(rows[0].startsWith('large/center/') && rows[1].startsWith('normal/top/') && rows[2] === 'normal/center/Mom&#39;s &amp; Dad&#39;s', rows.join(' '));
  assert((await first.getByRole('button', { name: 'large' }).getAttribute('aria-pressed')) === 'true', 'aria-pressed');
  const empty = await api('PATCH', `/api/gallery/${db('SELECT id FROM gallery ORDER BY order_index LIMIT 1')}`, {});
  const wrong = await api('PATCH', `/api/gallery/${db('SELECT id FROM gallery ORDER BY order_index LIMIT 1')}`, { size: 'huge' });
  assert(empty.status === 400 && wrong.status === 400, `${empty.status} ${wrong.status}`);
});

const openInvitation = async () => {
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Open Invitation' }).click();
  await page.locator('[data-cover]').waitFor({ state: 'detached', timeout: 8000 });
};
const order = (a, b) => page.evaluate(([x, y]) => Boolean(document.querySelector(x).compareDocumentPosition(document.querySelector(y)) & Node.DOCUMENT_POSITION_FOLLOWING), [a, b]);
await step('Public: grid layout after the story, large photo full row, focus and caption applied', async () => {
  await openInvitation();
  const track = page.locator('#gallery [data-layout]');
  assert((await track.getAttribute('data-layout')) === 'grid', 'layout');
  const tiles = track.getByRole('button');
  assert((await tiles.count()) === 5, 'tiles');
  assert((await tiles.first().getAttribute('class')).includes('col-span-full'), 'large not full row');
  assert((await tiles.nth(1).locator('img').getAttribute('class')).includes('object-top'), 'focus not applied');
  assert((await tiles.nth(2).getAttribute('aria-label')) === "Mom's & Dad's", 'caption');
  assert(await order('#gallery', '#events'), 'gallery not before events');
  const menu = await page.locator('nav').first().getByRole('button').allTextContents();
  assert(menu.indexOf('Gallery') > 0 && menu.indexOf('Gallery') < menu.indexOf('Events'), `menu order ${menu}`);
});
await step('Public: slideshow just before RSVP, with buttons, no page overflow on phones', async () => {
  await api('PUT', '/api/settings', { theme: 'light', show_gallery: true, show_envelope: true, gallery_layout: 'slideshow', gallery_position: 'before_rsvp' });
  await page.setViewportSize({ width: 390, height: 800 });
  await openInvitation();
  assert((await page.locator('#gallery [data-layout]').getAttribute('data-layout')) === 'slideshow', 'layout');
  assert(await page.evaluate(() => document.querySelector('#gallery').nextElementSibling?.id === 'rsvp'), 'not right before RSVP');
  assert((await page.getByRole('button', { name: 'More photos' }).count()) === 1, 'no next button');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(over <= 0, `page overflow +${over}px`);
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'More photos' }).click();
  await page.waitForTimeout(700);
  assert((await page.locator('#gallery [data-layout]').evaluate((el) => el.scrollLeft)) > 0, 'next did not scroll');
});
await step('Public: masonry (default look) with a large photo spanning all columns', async () => {
  await api('PUT', '/api/settings', { theme: 'light', show_gallery: true, show_envelope: true, gallery_layout: 'masonry', gallery_position: 'after_events' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await openInvitation();
  const first = page.locator('#gallery [data-layout="masonry"]').getByRole('button').first();
  assert((await first.getAttribute('class')).includes('[column-span:all]'), 'large not spanning');
  assert(await order('#events', '#gallery'), 'gallery not after events');
});

// ---------- 5. Delete cleans up the uploaded file only ----------
await step('Delete: uploaded photo also removed from Blob; a linked photo is not', async () => {
  await page.goto(BASE + '/admin/gallery');
  await page.getByTestId('gallery-item').first().waitFor();
  const before = serverBlobCalls.length;
  const uploadedUrl = db('SELECT url FROM gallery ORDER BY order_index LIMIT 1');
  await page.getByTestId('gallery-item').first().getByRole('button', { name: 'Delete' }).click();
  await toast().getByText('Photo deleted.').waitFor();
  const calls = serverBlobCalls.slice(before);
  assert(calls.length === 1 && calls[0].url.startsWith('/delete') && calls[0].body.includes(uploadedUrl), JSON.stringify(calls));
  await waitFor(async () => (await page.getByTestId('gallery-item').count()) === 4, 'first delete not finished');
  await page.getByTestId('gallery-item').last().getByRole('button', { name: 'Delete' }).click();
  await waitFor(async () => (await page.getByTestId('gallery-item').count()) === 3, 'second delete not finished');
  assert(serverBlobCalls.length === before + 1, 'linked photo triggered a blob delete');
  assert(db('SELECT count(*) FROM gallery') === '3', 'count');
});

// ---------- 6. Mobile ----------
await step('No horizontal overflow at 320/390/768 (admin Gallery, Couple & Story)', async () => {
  const bad = [];
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/admin/gallery', '/admin/wedding']) {
      await page.goto(BASE + path);
      await page.waitForTimeout(600);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) bad.push(`${path}@${width}: +${over}px`);
    }
  }
  assert(bad.length === 0, bad.join(', '));
});
await step('Tap targets on phones: size buttons and focus select ≥ 44px', async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(BASE + '/admin/gallery');
  const item = page.getByTestId('gallery-item').first();
  await item.waitFor();
  for (const el of [item.getByRole('button', { name: 'large' }), item.getByRole('combobox')]) {
    const box = await el.boundingBox();
    assert(box.height >= 44, `height ${box.height}`);
  }
});

await step('No page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

await browser.close();
fakeApi.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
