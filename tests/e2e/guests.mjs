// Guests: personal links, guest list, import/export, RSVP and wishes rules.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');

const BASE = 'http://localhost:3917';
const OLD_PW = 'E2e-Test-Passw0rd!';
const NEW_PW = 'E2e-New-Passw0rd-2026';

const db = (query) =>
  execFileSync('docker', ['exec', 'wedinv-e2e-postgres-1', 'psql', '-U', 'postgres', '-d', 'main', '-tAc', query], { encoding: 'utf8' }).trim();

const results = [];
let loginAttempts = 0;
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
const ctxA = await browser.newContext({ acceptDownloads: true });
const page = await ctxA.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('dialog', (d) => d.accept());
const pub = await (await browser.newContext()).newPage(); // a guest's browser, no admin cookie
pub.on('pageerror', (e) => pageErrors.push(e.message));

async function login(p, password) {
  await go(p, BASE + '/admin/login');
  await p.getByPlaceholder('Username').fill('admin');
  await p.getByPlaceholder('Password').fill(password);
  const r = resp(p, '/api/auth/login', 'POST');
  await p.getByRole('button', { name: 'Login' }).click();
  loginAttempts++;
  return r;
}
const tokenOf = (name) => db(`SELECT token FROM guests WHERE name = '${name}'`);

// ---------- Public page without a personal link ----------
await step('Public /: RSVP and wishes show notes, no forms; legacy wish still listed', async () => {
  await go(pub, BASE + '/');
  await pub.getByText('RSVP is available through your personal invitation link').waitFor();
  await pub.getByText('Wishes can be sent through your personal invitation link').waitFor();
  assert((await pub.getByRole('button', { name: 'Send RSVP' }).count()) === 0, 'RSVP form visible');
  assert((await pub.getByRole('button', { name: 'Send Wishes' }).count()) === 0, 'wish form visible');
  await pub.getByText('Legacy wish from before personal links').waitFor();
});

// ---------- Admin ----------
await step('Admin: wrong password rejected', async () => {
  const r = await login(page, 'wrong-password-123');
  assert(r.status() === 401, `status ${r.status()}`);
});
await step('Admin: login → dashboard', async () => {
  const r = await login(page, OLD_PW);
  assert(r.status() === 200, `status ${r.status()}`);
  await page.waitForURL('**/admin/dashboard');
});
await step('Admin RSVP: legacy RSVP still listed', async () => {
  await go(page, BASE + '/admin/rsvp');
  await page.getByRole('row').filter({ hasText: 'Legacy Guest' }).waitFor();
});

await step('Guests: add guest via form (phone with spaces normalized)', async () => {
  await go(page, BASE + '/admin/guests');
  await page.getByRole('button', { name: '+ Add Guest' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Budi Santoso');
  await page.getByLabel('Phone (optional)').fill('0812 3456 7890');
  await page.getByLabel('Max guests').fill('2');
  await page.getByLabel('Group (optional)').fill('Keluarga');
  const r = resp(page, '/api/guests', 'POST');
  await page.getByRole('button', { name: 'Save Guest' }).click();
  assert((await r).status() === 201, `POST → ${(await r).status()}`);
  await page.getByTestId('guest-card').filter({ hasText: 'Budi Santoso' }).waitFor();
  const phone = db("SELECT phone FROM guests WHERE name = 'Budi Santoso'");
  assert(phone === '081234567890', `phone stored as ${phone}`);
});

await step('Guests: duplicate name in same group → 409 with message', async () => {
  await page.getByRole('button', { name: '+ Add Guest' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Budi Santoso');
  await page.getByLabel('Group (optional)').fill('Keluarga');
  const r = resp(page, '/api/guests', 'POST');
  await page.getByRole('button', { name: 'Save Guest' }).click();
  assert((await r).status() === 409, `status ${(await r).status()}`);
  await page.getByText('A guest with this name already exists in this group.').waitFor();
  await page.getByRole('button', { name: 'Cancel' }).click();
});

await step('Guests: WhatsApp link uses 62-number, guest name and personal link', async () => {
  const href = await page.getByTestId('guest-card').filter({ hasText: 'Budi Santoso' }).getByRole('link', { name: 'WhatsApp' }).getAttribute('href');
  assert(href.startsWith('https://wa.me/6281234567890?text='), href.slice(0, 50));
  const text = decodeURIComponent(href.split('?text=')[1]);
  assert(text.includes('Budi Santoso') && text.includes(`/to/budi-santoso/${tokenOf('Budi Santoso')}`), text);
});

await step('Guests: custom WhatsApp message saved and used', async () => {
  await page.getByLabel('WhatsApp message').fill('Halo {name}, undangan untukmu: {link}');
  const r = resp(page, '/api/guests/message', 'PUT');
  await page.getByRole('button', { name: 'Save Message' }).click();
  assert((await r).status() === 200, 'PUT failed');
  await page.reload();
  await page.getByTestId('guest-card').first().waitFor();
  const href = await page.getByTestId('guest-card').filter({ hasText: 'Budi Santoso' }).getByRole('link', { name: 'WhatsApp' }).getAttribute('href');
  assert(decodeURIComponent(href.split('?text=')[1]).startsWith('Halo Budi Santoso, undangan untukmu: http'), 'template not applied');
});

async function importFile(name, mimeType, buffer, removeMissing = false) {
  await go(page, BASE + '/admin/guests');
  await page.getByLabel('Guest list file').setInputFiles({ name, mimeType, buffer });
  if (removeMissing) await page.getByLabel('Also delete guests that are not in this file').check();
  const r = resp(page, '/api/guests/import', 'POST');
  await page.getByRole('button', { name: 'Import' }).click();
  const res = await r;
  const json = await res.json();
  assert(res.status() === 200 && json.success, `import → ${res.status()} ${JSON.stringify(json)}`);
  await page.getByTestId('import-result').waitFor();
  return json.data;
}

await step('Import CSV (";" delimiter, Indonesian headers, bad rows reported)', async () => {
  const csv = [
    'Nama;No HP;Jumlah;Grup;Lamaran;Akad;Resepsi',
    'Siti Aminah;812345678901;3;Teman Kantor;tidak;ya;ya',
    '"=HYPERLINK(""http://x"",""y"")";;1;Teman;;ya;',
    'Andi;12345;1;Teman;;ya;ya',
    'Siti Aminah;;1;Teman Kantor;;ya;',
    'Rina;;2;Teman Kuliah;ya;ya;ya'
  ].join('\n');
  const data = await importFile('tamu.csv', 'text/csv', Buffer.from(csv));
  assert(data.created === 3 && data.updated === 0, JSON.stringify(data));
  assert(data.skippedCount === 2 && data.skipped.map((s) => s.row).join() === '4,5', JSON.stringify(data.skipped));
  await page.getByText('Row 4: Invalid phone number').waitFor();
  const phone = db("SELECT phone FROM guests WHERE name = 'Siti Aminah'");
  assert(phone === '0812345678901', `leading zero lost: ${phone}`);
  return `created 3, skipped rows 4 and 5`;
});

let exportedSitiLink = '';
await step('Export CSV: BOM, personal links, formula names escaped', async () => {
  const r = await ctxA.request.get(BASE + '/api/guests/export?format=csv');
  assert(r.status() === 200 && r.headers()['content-type'].includes('text/csv'), `status ${r.status()}`);
  const csv = await r.text();
  assert(csv.charCodeAt(0) === 0xfeff, 'no BOM');
  assert(csv.includes(`"'=HYPERLINK(""http://x"",""y"")"`), 'formula name not escaped');
  const siti = csv.split('\r\n').find((l) => l.startsWith('"Siti Aminah"'));
  exportedSitiLink = siti.match(/"(http[^"]+)"/)[1];
  assert(exportedSitiLink.includes(`/to/siti-aminah/${tokenOf('Siti Aminah')}`), exportedSitiLink);
  assert(siti.includes('"pending"'), 'rsvp_status missing');
});

await step('Export XLSX: parses, formula-like name is a plain string cell', async () => {
  const r = await ctxA.request.get(BASE + '/api/guests/export?format=xlsx');
  assert(r.headers()['content-type'].includes('spreadsheetml'), r.headers()['content-type']);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await r.body());
  const ws = wb.worksheets[0];
  assert(ws.getRow(1).getCell(8).text === 'link', 'header');
  let formulaCell;
  ws.eachRow((row) => { if (String(row.getCell(1).text).startsWith('=HYPERLINK')) formulaCell = row.getCell(1); });
  assert(formulaCell && formulaCell.type === ExcelJS.ValueType.String, `cell type ${formulaCell?.type}`);
});

await step('Import XLSX: rename via link keeps token; match by name+group updates', async () => {
  const sitiToken = tokenOf('Siti Aminah');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Tamu');
  ws.addRow(['name', 'phone', 'max_guests', 'group', 'lamaran', 'akad', 'resepsi', 'link']);
  ws.addRow(['Siti Aminah Putri', '0812345678901', 4, 'Teman Kantor', 'no', 'yes', 'yes', exportedSitiLink]);
  ws.addRow(['Rina', '', 1, 'Teman Kuliah', 'yes', 'yes', 'yes', '']);
  const data = await importFile('tamu.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Buffer.from(await wb.xlsx.writeBuffer()));
  assert(data.updated === 2 && data.created === 0, JSON.stringify(data));
  assert(tokenOf('Siti Aminah Putri') === sitiToken, 'token changed on rename');
  assert(db("SELECT max_guests FROM guests WHERE name = 'Rina'") === '1', 'Rina pax not updated');
});

await step('Import without group column: unique name matches, missing columns keep values', async () => {
  const data = await importFile('pax.csv', 'text/csv', Buffer.from('name,max_guests\nRina,2\n'));
  assert(data.updated === 1 && data.created === 0, JSON.stringify(data));
  const row = db("SELECT max_guests||'|'||group_name||'|'||invite_lamaran FROM guests WHERE name = 'Rina'");
  assert(row === '2|Teman Kuliah|true', row);
});

let hyperlinkPath = '';
await step('Import with "delete guests not in this file" removes only the missing guest', async () => {
  const hyperlinkToken = db("SELECT token FROM guests WHERE name LIKE '=HYPERLINK%'");
  hyperlinkPath = `/to/x/${hyperlinkToken}`;
  const csv = 'name,group\nBudi Santoso,Keluarga\nSiti Aminah Putri,Teman Kantor\nRina,Teman Kuliah\n';
  const data = await importFile('keep.csv', 'text/csv', Buffer.from(csv), true);
  assert(data.removed === 1 && data.updated === 3 && data.created === 0, JSON.stringify(data));
  const r = await go(pub, BASE + hyperlinkPath);
  assert(r.status() === 404, `removed guest link → ${r.status()}`);
  // The file had no phone/max_guests/event columns: Budi keeps his values.
  const budi = db("SELECT phone||'|'||max_guests||'|'||invite_lamaran||'|'||invite_akad FROM guests WHERE name = 'Budi Santoso'");
  assert(budi === '081234567890|2|false|true', `Budi changed: ${budi}`);
});

// ---------- Personal link ----------
const budiPath = () => `/to/budi-santoso/${tokenOf('Budi Santoso')}`;
await step('Personal link: wrong slug redirects to canonical URL', async () => {
  await go(pub, BASE + `/to/wrong-name/${tokenOf('Budi Santoso')}`);
  assert(new URL(pub.url()).pathname === budiPath(), pub.url());
});
await step('Personal link: noindex, greeting, only invited events offered', async () => {
  const robots = await pub.locator('meta[name="robots"]').getAttribute('content');
  assert(/noindex/.test(robots) && /nofollow/.test(robots), robots);
  await pub.getByText('Dear Budi Santoso').waitFor();
  await pub.getByText('This invitation is for up to 2 people.').waitFor();
  await pub.getByLabel('Akad Nikah').waitFor();
  await pub.getByLabel('Reception').waitFor();
  assert((await pub.getByLabel('Engagement').count()) === 0, 'Engagement offered to a guest not invited');
});
await step('Personal link: malformed and unknown tokens → 404', async () => {
  const a = await pub.request.get(BASE + '/to/x/abc');
  const b = await pub.request.get(BASE + '/to/x/AAAAAAAAAAAA');
  assert(a.status() === 404 && b.status() === 404, `${a.status()} ${b.status()}`);
});

const postJson = (p, url, body) =>
  p.evaluate(async ([u, b]) => {
    const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    return { status: r.status, json: await r.json() };
  }, [url, body]);

await step('RSVP API: no token → 400', async () => {
  const r = await postJson(pub, '/api/rsvp', { attending: true, guest_count: 1, attending_lamaran: false, attending_akad: true, attending_resepsi: false, message: '' });
  assert(r.status === 400, `status ${r.status}`);
});
await step('RSVP API: guest count above invitation limit → 400', async () => {
  const r = await postJson(pub, '/api/rsvp', { token: tokenOf('Budi Santoso'), attending: true, guest_count: 3, attending_lamaran: false, attending_akad: true, attending_resepsi: true, message: '' });
  assert(r.status === 400 && /up to 2/.test(r.json.error), JSON.stringify(r));
});
await step('RSVP API: name from guest list, uninvited event forced off', async () => {
  const r = await postJson(pub, '/api/rsvp', { token: tokenOf('Budi Santoso'), name: 'Hacker', attending: true, guest_count: 1, attending_lamaran: true, attending_akad: true, attending_resepsi: false, message: '' });
  assert(r.status === 200, JSON.stringify(r));
  const row = db("SELECT name||'|'||attending_lamaran||'|'||attending_akad||'|'||guest_count FROM rsvp WHERE guest_id = (SELECT id FROM guests WHERE name = 'Budi Santoso')");
  assert(row === 'Budi Santoso|false|true|1', row);
});
await step('RSVP UI: prefilled, update guest count → still one RSVP row', async () => {
  await go(pub, BASE + budiPath());
  await pub.getByRole('button', { name: 'Update RSVP' }).waitFor();
  assert((await pub.getByLabel('Number of Guests').inputValue()) === '1', 'not prefilled');
  await pub.getByLabel('Number of Guests').fill('2');
  const r = resp(pub, '/api/rsvp', 'POST');
  await pub.getByRole('button', { name: 'Update RSVP' }).click();
  assert((await r).status() === 200, 'POST failed');
  await pub.getByText('Thank you! Your RSVP has been received.').waitFor();
  const row = db("SELECT count(*)||'|'||max(guest_count) FROM rsvp WHERE guest_id = (SELECT id FROM guests WHERE name = 'Budi Santoso')");
  assert(row === '1|2', row);
});
await step('RSVP UI: decline → stored as declined, admin shows Declined', async () => {
  await pub.getByLabel('Regretfully decline').check();
  const r = resp(pub, '/api/rsvp', 'POST');
  await pub.getByRole('button', { name: 'Update RSVP' }).click();
  assert((await r).status() === 200, 'POST failed');
  await pub.getByText('Thank you for letting us know.').waitFor();
  const row = db("SELECT attending_akad||'|'||attending_resepsi||'|'||guest_count FROM rsvp WHERE guest_id = (SELECT id FROM guests WHERE name = 'Budi Santoso')");
  assert(row === 'false|false|0', row);
  await go(page, BASE + '/admin/guests');
  await page.getByTestId('guest-card').filter({ hasText: 'Budi Santoso' }).getByText('Declined').waitFor();
});

// ---------- Wishes ----------
async function sendWish(p, text, anonymous = false) {
  await p.getByLabel('Message', { exact: true }).fill(text);
  if (anonymous) await p.getByLabel(/Hide my name/).check();
  const r = resp(p, '/api/guestbook', 'POST');
  await p.getByRole('button', { name: 'Send Wishes' }).click();
  return r;
}
await step('Wishes: name auto-filled and read-only', async () => {
  await go(pub, BASE + budiPath());
  const input = pub.getByLabel('Your name');
  assert((await input.inputValue()) === 'Budi Santoso' && (await input.getAttribute('readonly')) !== null, 'name not locked');
});
await step('Wishes: message with a link is rejected', async () => {
  const r = await sendWish(pub, 'Cek www.example.com ya, selamat!');
  assert((await r).status() === 400, 'not rejected');
  await pub.getByText("Links aren't allowed in wishes.").waitFor();
});
await step('Wishes: rude word (leetspeak) is rejected', async () => {
  const r = await sendWish(pub, 'dasar k0nt0l semua');
  assert((await r).status() === 400, 'not rejected');
  await pub.getByText('Please keep your message kind and polite.').waitFor();
});
await step('Wishes: anonymous wish accepted ("santai", "masuk" are fine)', async () => {
  const r = await sendWish(pub, 'Selamat menempuh hidup baru, semoga santai dan masuk surga bersama', true);
  assert((await r).status() === 200, 'rejected');
  assert((await pub.getByLabel('Your name').inputValue()) === 'Someone', 'name field not "Someone"');
  await pub.getByText('Thank you! Your message will appear once approved.').waitFor();
});
await step('Wishes: another guest sends a wish with their name', async () => {
  await go(pub, BASE + `/to/rina/${tokenOf('Rina')}`);
  const r = await sendWish(pub, 'Happy wedding! Love, Rina');
  assert((await r).status() === 200, 'rejected');
});
await step('Admin wishes: real name + badge; after approval public shows "Someone"', async () => {
  await go(page, BASE + '/admin/guestbook');
  const row = page.getByRole('row').filter({ hasText: 'semoga santai dan masuk surga' });
  await row.getByText('shown as Someone').waitFor();
  assert((await row.textContent()).includes('Budi Santoso'), 'admin does not see the real name');
  const r = respPrefix(page, '/api/guestbook/', 'PATCH');
  await page.getByRole('button', { name: 'Approve All Pending' }).click();
  await r;
  await page.waitForTimeout(500);
  await go(pub, BASE + '/');
  const card = pub.locator('div.rounded-2xl').filter({ hasText: 'semoga santai dan masuk surga' });
  await card.waitFor();
  assert((await card.textContent()).includes('Someone'), 'not shown as Someone');
  assert(!(await pub.content()).includes('Budi Santoso'), 'real name leaked on public page');
  await pub.getByText('Happy wedding! Love, Rina').waitFor();
});

await step('Delete guest: link 404, wish kept', async () => {
  const rinaPath = `/to/rina/${tokenOf('Rina')}`;
  await go(page, BASE + '/admin/guests');
  const r = respPrefix(page, '/api/guests/', 'DELETE');
  await page.getByTestId('guest-card').filter({ hasText: 'Rina' }).getByRole('button', { name: 'Delete' }).click();
  assert((await r).status() === 200, 'DELETE failed');
  assert((await pub.request.get(BASE + rinaPath)).status() === 404, 'link still works');
  assert(db("SELECT count(*) FROM guestbook WHERE message LIKE 'Happy wedding! Love%'") === '1', 'wish deleted');
});

await step('Guest admin APIs require login (401)', async () => {
  const anon = await browser.newContext();
  const a = await anon.request.get(BASE + '/api/guests');
  const b = await anon.request.get(BASE + '/api/guests/export?format=csv');
  const c = await anon.request.post(BASE + '/api/guests/import', { multipart: { file: { name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from('name\nX Y') } } });
  const d = await anon.request.post(BASE + `/api/guests/00000000-0000-0000-0000-000000000000/token`);
  await anon.close();
  assert([a, b, c, d].every((r) => r.status() === 401), [a, b, c, d].map((r) => r.status()).join(','));
});

await step('Dashboard: guest-based stats', async () => {
  await go(page, BASE + '/admin/dashboard');
  // Budi + Siti remain (Rina was deleted). Locator waits instead of waitForFunction (CSP blocks eval).
  await page.locator('.admin-card').filter({ hasText: 'Invited Guests' }).filter({ hasText: /Invited Guests\s*2$/ }).waitFor({ timeout: 10000 });
});

// ---------- Regression ----------
await step('Regression: RSVP export (BOM, decoded names, ISO dates)', async () => {
  await go(page, BASE + '/admin/rsvp');
  const dlP = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export CSV' }).click();
  const csv = fs.readFileSync(await (await dlP).path(), 'utf8');
  const line = csv.split('\r\n').find((l) => l.startsWith('"Budi Santoso"'));
  assert(line && /\d{4}-\d{2}-\d{2}T/.test(line), 'Budi row missing / no ISO date');
  assert(csv.includes('"Legacy Guest"'), 'legacy row missing');
});
await step('Regression: events save', async () => {
  await go(page, BASE + '/admin/events');
  const r = respPrefix(page, '/api/events/', 'PUT');
  await page.getByRole('button', { name: /Save akad/i }).click();
  assert((await r).status() === 200, 'PUT failed');
});
await step('Regression: FAQ add → save → remove', async () => {
  await go(page, BASE + '/admin/faqs');
  await page.getByRole('button', { name: 'Save', exact: true }).first().waitFor();
  const add = resp(page, '/api/faqs', 'POST');
  await page.getByRole('button', { name: '+ Add FAQ' }).click();
  const added = await add;
  assert(added.status() === 200, 'POST failed');
  const save = respPrefix(page, '/api/faqs/', 'PUT');
  await page.getByRole('button', { name: 'Save', exact: true }).first().click();
  assert((await save).status() === 200, 'PUT failed');
  const id = (await added.json()).data.id;
  const status = await page.evaluate((i) => fetch(`/api/faqs/${i}`, { method: 'DELETE' }).then((r) => r.status), id);
  assert(status === 200, 'DELETE failed');
});
await step('Regression: gallery upload → delete', async () => {
  await go(page, BASE + '/admin/gallery');
  await page.getByPlaceholder('Image URL').fill('https://images.unsplash.com/photo-1519741497674-611481863552');
  const up = resp(page, '/api/gallery', 'POST');
  await page.getByRole('button', { name: 'Add Photo' }).click();
  assert((await up).status() === 200, 'POST failed');
  const del = respPrefix(page, '/api/gallery/', 'DELETE');
  await page.getByRole('button', { name: 'Delete' }).last().click();
  assert((await del).status() === 200, 'DELETE failed');
});
await step('Regression: wedding save keeps WhatsApp message', async () => {
  await go(page, BASE + '/admin/wedding');
  await page.getByPlaceholder("Groom's first name").waitFor();
  await page.waitForTimeout(500);
  const r = resp(page, '/api/wedding', 'PUT');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert((await r).status() === 200, 'PUT failed');
  assert(db("SELECT invite_message FROM wedding_config WHERE id = 'main'").startsWith('Halo {name}'), 'invite message lost');
});
await step('Regression: settings save', async () => {
  await go(page, BASE + '/admin/settings');
  const r = resp(page, '/api/settings', 'PUT');
  await page.getByRole('button', { name: 'Save Settings' }).click();
  assert((await r).status() === 200, 'PUT failed');
});

const ctxB = await browser.newContext({ storageState: await ctxA.storageState() });
await step('Regression: password change keeps this session, signs out the other', async () => {
  await go(page, BASE + '/admin/settings');
  await page.getByPlaceholder('Current password').fill(OLD_PW);
  await page.getByPlaceholder('New password (min. 12 characters)').fill(NEW_PW);
  const r = resp(page, '/api/auth/password', 'POST');
  await page.getByRole('button', { name: 'Change Password' }).click();
  assert((await r).status() === 200, 'POST failed');
  assert((await ctxA.request.get(BASE + '/api/auth/me')).status() === 200, 'this session lost');
  assert((await ctxB.request.get(BASE + '/api/auth/me')).status() === 401, 'other session still valid');
});
await step('Regression: logout, old password rejected, new works', async () => {
  await go(page, BASE + '/admin/dashboard');
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/admin/login');
  assert((await login(page, OLD_PW)).status() === 401, 'old pw accepted');
  assert((await login(page, NEW_PW)).status() === 200, 'new pw rejected');
  await page.waitForURL('**/admin/dashboard');
});
await step('Regression: security headers, no X-Powered-By', async () => {
  const h = (await ctxA.request.get(BASE + budiPath())).headers();
  for (const k of ['content-security-policy', 'x-frame-options', 'permissions-policy', 'strict-transport-security']) assert(h[k], `missing ${k}`);
  assert(!h['x-powered-by'], 'x-powered-by present');
});
await step('Reset: also clears the guest list', async () => {
  const r = await page.evaluate(() => fetch('/api/reset', { method: 'POST' }).then((x) => x.status));
  assert(r === 200, `reset → ${r}`);
  assert(db('SELECT count(*) FROM guests') === '0' && db('SELECT count(*) FROM rsvp') === '0', 'not cleared');
});
await step('Regression: 6th login attempt → 429', async () => {
  const codes = [];
  while (loginAttempts < 6) {
    const r = await ctxB.request.post(BASE + '/api/auth/login', { data: { username: 'admin', password: 'wrong-password-123' } });
    loginAttempts++;
    codes.push(r.status());
  }
  assert(codes.at(-1) === 429, codes.join(','));
  return codes.join(', ');
});
await step('No uncaught browser errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
