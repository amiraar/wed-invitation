// Uploads without a Blob store (no BLOB_READ_WRITE_TOKEN): uploads explain why, links keep working.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const BASE = 'http://localhost:3917';
const db = (query) =>
  execFileSync('docker', ['exec', 'wedinv-e2e-postgres-1', 'psql', '-U', 'postgres', '-d', 'main', '-tAc', query], { encoding: 'utf8' }).trim();
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
    console.log(`PASS  ${name}`);
  } catch (e) {
    results.push(['FAIL', name]);
    console.log(`FAIL  ${name} — ${e.message.split('\n')[0]}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
const blobRequests = [];
page.on('request', (r) => r.url().startsWith('https://vercel.com/api/blob') && blobRequests.push(r.url()));
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill('E2e-Test-Passw0rd!');
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');
const message = "File upload isn't set up yet (connect a Vercel Blob store). You can paste a link instead.";

await step('API: token request answers 503 with a clear message', async () => {
  const r = await page.evaluate(async () => {
    const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: 'wedding/image/a.png', clientPayload: null, multipart: false } }) });
    return { status: res.status, json: await res.json() };
  });
  assert(r.status === 503 && r.json.error === message, JSON.stringify(r));
});
await step('UI: choosing a cover photo shows that message; nothing is sent to Vercel', async () => {
  await page.goto(BASE + '/admin/wedding');
  await page.locator('fieldset:not([disabled])').waitFor();
  await page.getByTestId('drop-image').first().locator('input[type=file]').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') });
  await page.getByRole('status').getByText(message).waitFor();
  assert(blobRequests.length === 0, blobRequests.join(' '));
  assert((await page.getByLabel('Cover photo link').inputValue()) === '', 'link changed');
});
await step('UI: a pasted cover link still saves', async () => {
  await page.getByLabel('Cover photo link').fill('https://images.unsplash.com/photo-1519741497674-611481863552');
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/wedding') && r.request().method() === 'PUT'),
    page.getByRole('button', { name: 'Save', exact: true }).click()
  ]);
  assert(db("SELECT cover_image_url FROM wedding_config WHERE id = 'main'") === 'https://images.unsplash.com/photo-1519741497674-611481863552', 'not saved');
});
await step('No page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
