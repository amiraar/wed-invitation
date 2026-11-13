# Wedding Invitation Web App

## Setup

1. Install dependencies:
	- `npm install`

2. Create `.env` from `.env.example` and fill values:
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `NEXT_PUBLIC_APP_URL`
	- `NODE_ENV`

3. Run database setup (safe to re-run; also applies new schema changes):
	- `npx tsx scripts/setup.ts`

4. File uploads (optional; without this, photos and music can still be added by link):
	- Vercel dashboard → Storage → Create → Blob → connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN`; redeploy afterwards.
	- For local development, copy `BLOB_READ_WRITE_TOKEN` into `.env` (or run `vercel env pull`).

5. Start development server:
	- `npm run dev`

## Tests

End-to-end tests use Playwright against a production build and a throwaway local database in Docker (`docker-compose.test.yml`: Postgres + a Neon-compatible HTTP proxy). They never use the database from `.env`.

- Needs Docker running, then once: `npx playwright install chromium`
- All suites: `npm run test:e2e` (about 10 minutes; each suite gets a fresh database and server)
- Some suites: `bash tests/e2e/run.sh guests.mjs uploads.mjs` (add `SKIP_BUILD=1` to reuse the last build)
- Output, server logs and screenshots go to `test-results/`

CI (`.github/workflows/ci.yml`) runs on every pull request and on `main`: type check, `npm audit` (fails on high/critical), and all e2e suites. Dependabot opens weekly dependency update PRs, which go through the same checks.

## Login

- Open `http://localhost:3000/admin/login`
- Username: `admin`
- Password: the value of `ADMIN_PASSWORD` in `.env` (min. 12 characters), or, if unset, the random password printed once by `scripts/setup.ts`
- Change it any time in Admin → Settings → Change Password.

## Notes

- Public invitation is at `http://localhost:3000/` (old `/invitation` links redirect here). RSVP and wishes are only possible through a personal link.
- Each guest gets a personal link `/to/{name}/{token}` (Admin → Guests). The token keeps guests from opening each other's invitation; "New Link" replaces a link that was forwarded.
- Guest lists can be imported/exported as CSV or Excel in Admin → Guests (download the template there). Re-importing an exported file updates guests and keeps their links.
- Wishes with links or rude words are rejected; every wish still needs admin approval. Guests can hide their name (shown as "Someone").
- Music, cover and venue photo: drag & drop a file or paste a link in Admin → Couple & Story (autoplay is set there too); guests can also use the music button
- Gallery: drag & drop several photos at once in Admin → Gallery, and choose the layout (masonry, grid, slideshow), where it appears, and per photo its size and which part stays in view
- Bank accounts for the digital envelope are managed in Admin → Wedding
- All admin routes are protected by middleware
- Login, password change, RSVP and Guestbook have rate limits, stored in the database so they hold across server instances