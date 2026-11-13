#!/usr/bin/env bash
# End-to-end tests against a LOCAL database (docker-compose.test.yml) and a production build.
# Never touches the production database: DATABASE_URL is always overridden below.
#
#   npm run test:e2e                         # all suites
#   bash tests/e2e/run.sh guests.mjs         # some suites
#   SKIP_BUILD=1 bash tests/e2e/run.sh ...   # reuse the last `next build`
#
# Each suite gets a fresh database and a fresh server. The database starts with main's schema plus
# a few rows from before personal links, then runs scripts/setup.ts twice (migrations must be
# idempotent) and the sample content seed.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
E2E="$ROOT/tests/e2e"
OUT="$ROOT/test-results"
PORT=3917
COMPOSE=(docker compose -p wedinv-e2e -f "$ROOT/docker-compose.test.yml")
PSQL=(docker exec -i -e PGOPTIONS=--client-min-messages=warning wedinv-e2e-postgres-1 psql -U postgres -d main -q -v ON_ERROR_STOP=1)

# Set here so values from a local .env (which may point at production) are never used.
export DATABASE_URL='postgres://postgres:postgres@db.localtest.me:5432/main'
export NEON_FETCH_ENDPOINT='http://db.localtest.me:4444/sql'
export ADMIN_PASSWORD='E2e-Test-Passw0rd!'
export JWT_SECRET='e2e-only-secret-never-used-outside-local-tests-0123456789'
export NEXT_PUBLIC_APP_URL="http://localhost:$PORT"
export BLOB_READ_WRITE_TOKEN=''

SUITES=("$@")
if [ ${#SUITES[@]} -eq 0 ]; then
  SUITES=(guests.mjs admin-content.mjs invitation.mjs admin-sidebar.mjs cms-content.mjs uploads.mjs uploads-not-configured.mjs rate-limit.mjs api-robustness.mjs)
fi
mkdir -p "$OUT"

stop_server() {
  if [ -n "${SERVER_PID:-}" ]; then kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; SERVER_PID=''; fi
  # Git Bash on Windows: also stop whatever still listens on the port.
  if command -v powershell >/dev/null 2>&1; then
    powershell -NoProfile -Command "\$p = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if (\$p) { Stop-Process -Id \$p -Force -Confirm:\$false }" >/dev/null 2>&1
  fi
}

fresh_database() {
  "${COMPOSE[@]}" down -v >/dev/null 2>&1
  "${COMPOSE[@]}" up -d --wait >/dev/null 2>&1 || { echo "docker compose up failed"; return 1; }
  # The Neon proxy has no healthcheck: wait until it answers HTTP.
  for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:4444/ && break; sleep 1; done
  cd "$ROOT" || return 1
  { git show origin/main:lib/schema.sql 2>/dev/null || cat lib/schema.sql; } | "${PSQL[@]}" >/dev/null || return 1
  "${PSQL[@]}" -c "INSERT INTO rsvp (name, phone, guest_count, attending_akad, message) VALUES ('Legacy Guest', '081200000000', 2, TRUE, 'old rsvp'); INSERT INTO guestbook (name, message, is_approved) VALUES ('Legacy Friend', 'Legacy wish from before personal links', TRUE);" || return 1
  # Old-style visibility: Engagement hidden through the retired Settings switch.
  "${PSQL[@]}" -c "UPDATE app_settings SET show_lamaran = FALSE WHERE id = 'main';" || return 1
  npx tsx scripts/setup.ts >/dev/null || return 1
  npx tsx scripts/setup.ts | grep -q "already exists" || { echo "second migration run failed"; return 1; }
  npx tsx scripts/seed-sample-content.ts >/dev/null || return 1
}

start_server() {
  cd "$ROOT" || return 1
  node node_modules/next/dist/bin/next start -p "$PORT" > "$OUT/server-$1.log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/")" = "200" ] && return 0
    sleep 1
  done
  echo "server did not start"; tail -20 "$OUT/server-$1.log"; return 1
}

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "Building..."
  (cd "$ROOT" && npx next build > "$OUT/build.log" 2>&1) || { tail -40 "$OUT/build.log"; exit 1; }
fi

trap stop_server EXIT
failed=0
for suite in "${SUITES[@]}"; do
  name="${suite%.mjs}"
  echo "=== $suite"
  stop_server
  fresh_database || { echo "FAIL  database setup"; failed=1; continue; }
  # Only the uploads suite gets a (fake) Blob store; its fake API listens on port 4555.
  if [ "$suite" = "uploads.mjs" ]; then
    export BLOB_READ_WRITE_TOKEN='vercel_blob_rw_teststore_e2eSecretNotReal0123456789' VERCEL_BLOB_API_URL='http://127.0.0.1:4555'
  else
    export BLOB_READ_WRITE_TOKEN=''; unset VERCEL_BLOB_API_URL
  fi
  start_server "$name" || { failed=1; continue; }
  if node "$E2E/$suite" > "$OUT/$name.log" 2>&1; then
    grep -E "^FAIL|passed|requests|no problems" "$OUT/$name.log"
  else
    failed=1
    grep -E "^FAIL|passed|problems" "$OUT/$name.log" || tail -30 "$OUT/$name.log"
    echo "--- server log (last 20 lines)"; tail -20 "$OUT/server-$name.log"
  fi
done
stop_server
"${COMPOSE[@]}" down -v >/dev/null 2>&1
[ $failed -eq 0 ] && echo "ALL SUITES PASSED" || echo "SOME SUITES FAILED"
exit $failed
