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

4. Start development server:
	- `npm run dev`

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
- Music: set the URL in Admin → Wedding and enable autoplay in Admin → Settings; guests can also use the music button
- Bank accounts for the digital envelope are managed in Admin → Wedding
- All admin routes are protected by middleware
- RSVP and Guestbook endpoints have rate limiting