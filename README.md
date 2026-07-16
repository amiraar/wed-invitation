# Wedding Invitation Web App

## Setup

1. Install dependencies:
	- `npm install`

2. Create `.env` from `.env.example` and fill values:
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `NEXT_PUBLIC_APP_URL`
	- `NODE_ENV`

3. Run database setup:
	- `npx ts-node scripts/setup.ts`

4. Start development server:
	- `npm run dev`

## Login

- Open `http://localhost:3000/admin/login`
- Default credentials: `admin` / `admin123`
- Change the password after first login.

## Notes

- Public invitation is at `http://localhost:3000/` (old `/invitation` links redirect here)
- Personalize the cover per guest with a query param: `http://localhost:3000/?to=Nama+Tamu`
- Music starts when the guest taps "Buka Undangan" (enable autoplay in Admin → Settings, set the music URL in Admin → Wedding)
- Bank accounts for the digital envelope are managed in Admin → Wedding
- All admin routes are protected by middleware
- RSVP and Guestbook endpoints have rate limiting