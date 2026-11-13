// CMS content: decoded text (no &amp;), admin contrast, rundown per event, colour names, event dress code.
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

// Events: akad + resepsi on, engagement off. A rundown item saved before items had events/times.
db("UPDATE events SET is_active = TRUE, event_date = '2027-06-12', time_start = '08:00', venue_name = 'Masjid Agung', dress_code = '' WHERE type = 'akad'");
db("UPDATE events SET is_active = TRUE, event_date = '2027-06-13', time_start = '11:00', venue_name = 'Grand Ballroom', dress_code = '' WHERE type = 'resepsi'");
db("UPDATE events SET is_active = FALSE, event_date = '2027-03-01', venue_name = 'Family Home' WHERE type = 'lamaran'");
db(`UPDATE wedding_config SET groom_name = 'Amirul', bride_name = 'Nara', schedule_items = '[{"time":"Evening","title":"Legacy item","subtitle":""}]'::jsonb WHERE id = 'main'`);

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
const toast = () => page.getByRole('status');
// Waits for this save's own response, so an older toast with the same text can't fool the check.
const saveWedding = () =>
  Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/wedding') && r.request().method() === 'PUT'),
    page.getByRole('button', { name: 'Save', exact: true }).click()
  ]);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(BASE + '/admin/login');
await page.getByPlaceholder('Username').fill('admin');
await page.getByPlaceholder('Password').fill(PW);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/admin/dashboard');

// ---------- 1. Text with & ' " is stored escaped but shown plain everywhere ----------
const wedding = (await api('GET', '/api/wedding')).json.data;
const legacy = wedding.schedule_items[0];
const payload = {
  ...wedding,
  wishlist_title: 'Home & Living',
  groom_parents: 'Mr. "Budi" & Mrs. Sari',
  opening_quote: "We're so happy",
  dress_code_swatches: [{ color: '#C9647A', label: 'Rose & Gold' }],
  schedule_items: [
    { event: 'all', time_start: '07:30', time_end: '', title: 'Guests arrive', subtitle: '' },
    { event: 'akad', time_start: '09:00', time_end: '10:00', title: 'Akad & Doa', subtitle: "Bride's family" },
    { event: 'resepsi', time_start: '12:00', time_end: '', title: 'Lunch', subtitle: '' },
    { event: 'resepsi', time_start: '11:00', time_end: '', title: 'Reception opens', subtitle: '' },
    { event: 'lamaran', time_start: '10:00', time_end: '', title: 'Engagement item', subtitle: '' },
    legacy
  ]
};
const snapshot = () =>
  db("SELECT wishlist_title || '|' || groom_parents || '|' || opening_quote || '|' || schedule_items::text || '|' || dress_code_swatches::text FROM wedding_config WHERE id = 'main'");
let afterApi = '';

await step('Legacy rundown item comes back from the API as saved', async () => {
  assert(legacy && legacy.title === 'Legacy item' && legacy.time === 'Evening', JSON.stringify(legacy));
});
await step('Saving text with & \' " stores it escaped once', async () => {
  const r = await api('PUT', '/api/wedding', payload);
  assert(r.status === 200, `PUT ${r.status} ${JSON.stringify(r.json)}`);
  assert(r.json.data.wishlist_title === 'Home & Living', `PUT response not decoded: ${r.json.data.wishlist_title}`);
  afterApi = snapshot();
  assert(afterApi.startsWith('Home &amp; Living|Mr. &quot;Budi&quot; &amp; Mrs. Sari|We&#39;re so happy|'), afterApi.slice(0, 120));
  assert(afterApi.includes('Akad &amp; Doa') && afterApi.includes('Rose &amp; Gold'), 'JSON items not escaped');
});
await step('Admin APIs return plain text (wedding incl. JSON items, events, FAQs, gallery)', async () => {
  const w = (await api('GET', '/api/wedding')).json.data;
  assert(w.wishlist_title === 'Home & Living' && w.groom_parents === 'Mr. "Budi" & Mrs. Sari' && w.opening_quote === "We're so happy", JSON.stringify([w.wishlist_title, w.groom_parents, w.opening_quote]));
  assert(w.schedule_items[1].title === 'Akad & Doa' && w.schedule_items[1].subtitle === "Bride's family", JSON.stringify(w.schedule_items[1]));
  assert(w.dress_code_swatches[0].label === 'Rose & Gold', w.dress_code_swatches[0].label);
  const faq = await api('POST', '/api/faqs', { question: "What's the plan?", answer: 'Food & fun', order_index: 9 });
  assert(faq.status === 200 && faq.json.data.question === "What's the plan?", `faq POST ${JSON.stringify(faq.json)}`);
  const faqs = (await api('GET', '/api/faqs')).json.data;
  assert(faqs.some((f) => f.question === "What's the plan?" && f.answer === 'Food & fun'), 'faq GET still escaped');
  const photo = await api('POST', '/api/gallery', { url: 'https://images.unsplash.com/photo-1519741497674-611481863552', caption: "Mom's photo", order_index: 0 });
  assert(photo.status === 200 && photo.json.data.caption === "Mom's photo", `gallery POST ${JSON.stringify(photo.json)}`);
  assert((await api('GET', '/api/gallery')).json.data.some((g) => g.caption === "Mom's photo"), 'gallery GET still escaped');
  const akad = (await api('GET', '/api/events')).json.data.find((e) => e.type === 'akad');
  const put = await api('PUT', `/api/events/${akad.id}`, { ...akad, dress_code: 'Batik & Kebaya' });
  assert(put.status === 200 && put.json.data.dress_code === 'Batik & Kebaya', `event PUT ${JSON.stringify(put.json)}`);
  assert((await api('GET', '/api/events')).json.data.find((e) => e.type === 'akad').dress_code === 'Batik & Kebaya', 'events GET still escaped');
  assert(db("SELECT dress_code FROM events WHERE type = 'akad'") === 'Batik &amp; Kebaya', 'event not stored escaped');
});
await step('Admin form shows plain text; saving twice changes nothing (no double escaping)', async () => {
  await page.goto(BASE + '/admin/wedding');
  const title = page.getByLabel('Wishlist title');
  await title.waitFor();
  await page.locator('fieldset:not([disabled])').waitFor();
  assert((await title.inputValue()) === 'Home & Living', await title.inputValue());
  assert((await page.getByLabel("Groom's parents").inputValue()) === 'Mr. "Budi" & Mrs. Sari', 'parents');
  assert((await page.getByLabel('Pull quote').inputValue()) === "We're so happy", 'quote');
  for (let i = 0; i < 2; i++) {
    await saveWedding();
    await toast().getByText('Invitation content saved.').waitFor();
    await page.waitForTimeout(400);
  }
  const after = snapshot();
  assert(after === afterApi, `changed:\n${afterApi}\n${after}`);
  assert(!after.includes('&amp;amp;'), 'double escaped');
});

// ---------- 2. Contrast ----------
await step('Admin muted/faint text and placeholders reach 4.5:1', async () => {
  const colors = await page.evaluate(() => {
    const shell = getComputedStyle(document.querySelector('.admin-shell'));
    const input = document.querySelector('.admin-input');
    return {
      muted: shell.getPropertyValue('--adm-text-muted'),
      faint: shell.getPropertyValue('--adm-text-faint'),
      danger: shell.getPropertyValue('--adm-danger'),
      placeholder: getComputedStyle(input, '::placeholder').color
    };
  });
  // Computed values come back as rgba(...) or, from the minified CSS, as #rrggbbaa.
  const parse = (s) => {
    const v = s.trim();
    if (v.startsWith('#')) {
      const n = [0, 2, 4, 6].map((i) => parseInt(v.slice(1 + i, 3 + i), 16));
      return [n[0], n[1], n[2], Number.isNaN(n[3]) ? 1 : n[3] / 255];
    }
    return v.match(/[\d.]+/g).map(Number);
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const mix = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const page_ = [26, 42, 26];
  const inputBg = mix([255, 255, 255], 0.06, page_);
  const out = [];
  for (const [name, value, bg] of [['muted', colors.muted, inputBg], ['faint', colors.faint, inputBg], ['danger', colors.danger, page_], ['placeholder', colors.placeholder, inputBg]]) {
    const [r, g, b, a = 1] = parse(value);
    const r_ = ratio(mix([r, g, b], a, bg), bg);
    out.push(`${name} ${r_.toFixed(2)}`);
    assert(r_ >= 4.5, `${name} ${value} → ${r_.toFixed(2)}`);
  }
  return out.join(', ');
});

// ---------- 3. Rundown ----------
await step('Admin rundown: labelled fields and the date each item will show under', async () => {
  const notes = await page.locator('[data-testid^="rundown-date-"]').allTextContents();
  assert(notes.length === 6, `items ${notes.length}`);
  assert(notes[0].startsWith('Shown to every guest'), notes[0]);
  assert(notes[1] === 'Akad Nikah · Saturday, June 12, 2027', notes[1]);
  assert(notes[2] === 'Reception · Sunday, June 13, 2027', notes[2]);
  assert(notes[4].includes('turned off in Events & Venues'), notes[4]);
  assert(notes[5].includes('Old time "Evening"'), notes[5]);
  assert((await page.getByLabel('Start time').nth(1).inputValue()) === '09:00', 'start time');
  assert((await page.getByLabel('End time (optional)').nth(1).inputValue()) === '10:00', 'end time');
});
await step('Admin rundown: add an item with the pickers and save', async () => {
  await page.getByRole('button', { name: '+ Add Item' }).click();
  await page.getByLabel('Item 7 · Event').selectOption('resepsi');
  await page.getByLabel('Start time').nth(6).fill('13:00');
  await page.getByLabel('Title', { exact: true }).nth(6).fill('Cake cutting');
  await saveWedding();
  await toast().getByText('Invitation content saved.').waitFor();
  const saved = JSON.parse(db("SELECT schedule_items::text FROM wedding_config WHERE id = 'main'"));
  const item = saved.find((i) => i.title === 'Cake cutting');
  assert(item && item.event === 'resepsi' && item.time_start === '13:00' && item.time_end === '', JSON.stringify(item));
});
await step('Rundown rejects impossible times and empty titles with readable errors', async () => {
  const w = (await api('GET', '/api/wedding')).json.data;
  const bad = await api('PUT', '/api/wedding', { ...w, schedule_items: [{ event: 'akad', time_start: '25:99', time_end: '', title: 'x', subtitle: '' }] });
  assert(bad.status === 400 && bad.json.error.includes('schedule_items.0.time_start'), JSON.stringify(bad.json));
  const empty = await api('PUT', '/api/wedding', { ...w, schedule_items: [{ event: 'akad', time_start: '', time_end: '', title: '  ', subtitle: '' }] });
  assert(empty.status === 400 && empty.json.error.includes('schedule_items.0.title'), JSON.stringify(empty.json));
  const event = await api('PUT', '/api/wedding', { ...w, schedule_items: [{ event: 'party', title: 'x' }] });
  assert(event.status === 400, `bad event ${event.status}`);
  // The UI turns the error into words.
  await page.getByLabel('Title', { exact: true }).nth(6).fill('');
  await saveWedding();
  await toast().getByText('Please check: Rundown item 7 title.').waitFor();
  await page.getByLabel('Title', { exact: true }).nth(6).fill('Cake cutting');
});

const openInvitation = async (path) => {
  await page.goto(BASE + path);
  await page.getByRole('button', { name: 'Open Invitation' }).click();
  await page.locator('[data-cover]').waitFor({ state: 'detached', timeout: 8000 });
};
await step('Public /: rundown grouped per event date, sorted by time, hidden event left out, plain text', async () => {
  await openInvitation('/');
  const general = await page.getByTestId('schedule-group-all').textContent();
  const akad = await page.getByTestId('schedule-group-akad').textContent();
  const resepsi = await page.getByTestId('schedule-group-resepsi').textContent();
  assert(general.includes('07:30') && general.includes('Guests arrive') && general.includes('Evening') && general.includes('Legacy item'), general);
  assert(akad.startsWith('Akad NikahSaturday, June 12, 2027') && akad.includes('09:00 – 10:00') && akad.includes('Akad & Doa') && akad.includes("Bride's family"), akad);
  assert(resepsi.startsWith('ReceptionSunday, June 13, 2027'), resepsi);
  const order = ['Reception opens', 'Lunch', 'Cake cutting'].map((t) => resepsi.indexOf(t));
  assert(order.every((i) => i >= 0) && order[0] < order[1] && order[1] < order[2], `order ${order}`);
  assert((await page.getByTestId('schedule-group-lamaran').count()) === 0, 'engagement group shown');
  assert(!(await page.locator('#schedule').textContent()).includes('Engagement item'), 'hidden event item shown');
  const body = await page.locator('main').textContent();
  assert(body.includes('Home & Living') && body.includes("We're so happy") && body.includes('Rose & Gold'), 'plain text missing');
  assert(!/&(amp|#39|quot);/.test(body), 'entity on public page');
});
await step('Personal link (Reception only): akad rundown items hidden', async () => {
  const created = await api('POST', '/api/guests', { name: 'Pak Rundown', phone: '', max_guests: 1, group_name: 'Test', invite_lamaran: false, invite_akad: false, invite_resepsi: true });
  assert(created.status === 201, `guest ${created.status}`);
  const guest = (await api('GET', '/api/guests')).json.data.guests.find((g) => g.name === 'Pak Rundown');
  await openInvitation(guest.path);
  assert((await page.getByTestId('schedule-group-akad').count()) === 0, 'akad group shown');
  assert((await page.getByTestId('schedule-group-resepsi').count()) === 1, 'resepsi group missing');
  assert((await page.getByTestId('schedule-group-all').count()) === 1, 'general group missing');
});

// ---------- 4. Color names ----------
await step('Dress code: picking a color fills its name; a typed name is kept', async () => {
  await page.goto(BASE + '/admin/wedding');
  await page.locator('fieldset:not([disabled])').waitFor();
  await page.getByRole('button', { name: '+ Add Color' }).click();
  const name2 = page.getByLabel('Color 2 name');
  assert((await name2.inputValue()) === 'Sage', `new color name ${await name2.inputValue()}`);
  await page.getByLabel('Color 2', { exact: true }).fill('#000080');
  assert((await name2.inputValue()) === 'Navy', `navy → ${await name2.inputValue()}`);
  await page.getByLabel('Color 2', { exact: true }).fill('#c62828');
  assert((await name2.inputValue()) === 'Red', `red → ${await name2.inputValue()}`);
  await name2.fill('Our Blue');
  await page.getByLabel('Color 2', { exact: true }).fill('#2f6db5');
  assert((await name2.inputValue()) === 'Our Blue', `custom name replaced: ${await name2.inputValue()}`);
  // "Rose & Gold" was typed by the admin, so it stays too.
  await page.getByLabel('Color 1', { exact: true }).fill('#000000');
  assert((await page.getByLabel('Color 1 name').inputValue()) === 'Rose & Gold', 'typed name 1 replaced');
  await saveWedding();
  await toast().getByText('Invitation content saved.').waitFor();
  const swatches = JSON.parse(db("SELECT dress_code_swatches::text FROM wedding_config WHERE id = 'main'"));
  assert(swatches.length === 2 && swatches[1].label === 'Our Blue' && swatches[1].color === '#2f6db5', JSON.stringify(swatches));
});

// ---------- 5. Event dress code ----------
await step('Events & Venues: "What to wear" field with quick picks and a hint', async () => {
  await page.goto(BASE + '/admin/events');
  const card = page.locator('.admin-card').filter({ has: page.getByRole('heading', { name: 'Reception' }) });
  await card.getByLabel('What to wear (dress code)').waitFor();
  assert((await card.getByLabel('What to wear (dress code)').getAttribute('maxlength')) === '100', 'maxlength');
  await card.getByRole('button', { name: 'Batik', exact: true }).click();
  assert((await card.getByLabel('What to wear (dress code)').inputValue()) === 'Batik', 'chip did not fill');
  assert((await card.getByRole('button', { name: 'Batik', exact: true }).getAttribute('aria-pressed')) === 'true', 'aria-pressed');
  assert((await card.textContent()).includes('Colors are set once for all events'), 'hint missing');
  const box = await card.getByRole('button', { name: 'Batik', exact: true }).boundingBox();
  assert(box.height >= 44, `chip height ${box.height}`);
  await page.getByRole('button', { name: 'Save Reception' }).click();
  await toast().getByText('Reception saved.').waitFor();
  assert(db("SELECT dress_code FROM events WHERE type = 'resepsi'") === 'Batik', 'not saved');
});
await step('Public event card: "What to wear" + link to suggested colors', async () => {
  await openInvitation('/');
  const card = page.locator('#events article').filter({ hasText: 'Reception' });
  const box = card.getByTestId('event-dress-code');
  const text = await box.textContent();
  assert(text.includes('What to wear') && text.includes('Batik') && text.includes('See suggested colors'), text);
  assert((await box.getByRole('link', { name: 'See suggested colors' }).getAttribute('href')) === '#dresscode', 'href');
  assert((await page.locator('#events article').filter({ hasText: 'Akad Nikah' }).getByTestId('event-dress-code').textContent()).includes('Batik & Kebaya'), 'akad dress code');
  assert((await page.locator('#dresscode').textContent()).includes('Suggested colors'), 'swatch caption missing');
});

// ---------- 6. Mobile ----------
await step('No horizontal overflow at 320/390/768 (admin Couple & Story, Events, public /)', async () => {
  const bad = [];
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/admin/wedding', '/admin/events']) {
      await page.goto(BASE + path);
      await page.waitForTimeout(500);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) bad.push(`${path}@${width}: +${over}px`);
    }
    await openInvitation('/');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) bad.push(`/@${width}: +${over}px`);
  }
  assert(bad.length === 0, bad.join(', '));
});

await step('No page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '));
});

await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
