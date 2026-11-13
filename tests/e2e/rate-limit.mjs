// Rate limits are shared between server instances (they live in Postgres), like on Vercel where
// requests land on different instances. A second server on another port uses the same database.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:3917';
const SECOND_PORT = 3918;
const SECOND = `http://localhost:${SECOND_PORT}`;
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
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

// A made-up client address keeps these attempts away from the address other tests log in from.
const login = (base, ip, password = 'wrong-password-123') =>
  fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ username: 'admin', password })
  }).then((r) => r.status);

const second = spawn(process.execPath, [`${ROOT}/node_modules/next/dist/bin/next`, 'start', '-p', String(SECOND_PORT)], {
  cwd: ROOT,
  env: process.env,
  stdio: 'ignore'
});
try {
  for (let i = 0; i < 60; i++) {
    const ok = await fetch(SECOND + '/admin/login').then((r) => r.ok, () => false);
    if (ok) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  await step('Login: 5 wrong passwords are answered 401, the 6th is 429', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push(await login(BASE, '203.0.113.7'));
    assert(statuses.join() === '401,401,401,401,401,429', statuses.join());
  });

  await step('The limit also holds on another server instance', async () => {
    const status = await login(SECOND, '203.0.113.7');
    assert(status === 429, `status ${status}`);
  });

  await step('Even the right password is refused while limited', async () => {
    const status = await login(SECOND, '203.0.113.7', 'E2e-Test-Passw0rd!');
    assert(status === 429, `status ${status}`);
  });

  await step('Another address is not affected', async () => {
    const status = await login(SECOND, '203.0.113.8');
    assert(status === 401, `status ${status}`);
  });

  await step('Counters are stored hashed (no IP address in the table)', async () => {
    const { execFileSync } = await import('node:child_process');
    const rows = execFileSync('docker', ['exec', 'wedinv-e2e-postgres-1', 'psql', '-U', 'postgres', '-d', 'main', '-tAc', 'SELECT key FROM rate_limits'], { encoding: 'utf8' })
      .trim()
      .split('\n');
    assert(rows.length >= 2 && rows.every((k) => /^[0-9a-f]{64}$/.test(k)), rows.join(' | '));
  });
} finally {
  second.kill();
}

const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
