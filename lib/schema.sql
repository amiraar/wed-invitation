-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wedding config (single row, id = 'main')
CREATE TABLE IF NOT EXISTS wedding_config (
  id VARCHAR(10) PRIMARY KEY DEFAULT 'main',
  groom_name VARCHAR(100) NOT NULL DEFAULT '',
  bride_name VARCHAR(100) NOT NULL DEFAULT '',
  groom_full_name VARCHAR(150) DEFAULT '',
  bride_full_name VARCHAR(150) DEFAULT '',
  groom_parents TEXT DEFAULT '',
  bride_parents TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  music_url TEXT DEFAULT '',
  music_autoplay BOOLEAN DEFAULT FALSE,
  opening_quote TEXT DEFAULT '',
  bank_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  story_body TEXT DEFAULT '',
  venue_image_url TEXT DEFAULT '',
  dress_code_title TEXT DEFAULT '',
  dress_code_note TEXT DEFAULT '',
  dress_code_avoid_note TEXT DEFAULT '',
  dress_code_swatches JSONB NOT NULL DEFAULT '[]'::jsonb,
  wishlist_title TEXT DEFAULT '',
  wishlist_note TEXT DEFAULT '',
  schedule_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config row
INSERT INTO wedding_config (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- Backfill for databases created before bank_accounts existed
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS bank_accounts JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill for databases created before the story/venue/dress-code/wishlist columns existed
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS story_body TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS venue_image_url TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS dress_code_title TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS dress_code_note TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS dress_code_avoid_note TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS dress_code_swatches JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS wishlist_title TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS wishlist_note TEXT DEFAULT '';
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS schedule_items JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Events (max 3: lamaran, akad, resepsi)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('lamaran', 'akad', 'resepsi')),
  is_active BOOLEAN DEFAULT TRUE,
  event_date DATE,
  time_start TIME,
  time_end TIME,
  venue_name VARCHAR(200) DEFAULT '',
  address TEXT DEFAULT '',
  maps_url TEXT DEFAULT '',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  dress_code VARCHAR(100) DEFAULT '',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default 3 events (idempotent: only inserts a type that doesn't exist yet,
-- since `id` is a fresh UUID every run and can never trigger ON CONFLICT DO NOTHING)
INSERT INTO events (type, order_index)
SELECT v.type, v.order_index FROM (VALUES ('lamaran', 1), ('akad', 2), ('resepsi', 3)) AS v(type, order_index)
WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.type = v.type);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  guest_count INT DEFAULT 1,
  attending_lamaran BOOLEAN DEFAULT FALSE,
  attending_akad BOOLEAN DEFAULT FALSE,
  attending_resepsi BOOLEAN DEFAULT FALSE,
  message TEXT DEFAULT '',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guestbook
CREATE TABLE IF NOT EXISTS guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(10) PRIMARY KEY DEFAULT 'main',
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('dark', 'light')),
  show_lamaran BOOLEAN DEFAULT TRUE,
  show_akad BOOLEAN DEFAULT TRUE,
  show_resepsi BOOLEAN DEFAULT TRUE,
  show_gallery BOOLEAN DEFAULT TRUE,
  show_envelope BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- The invitation no longer has a tap-to-open cover gate, so its title/subtitle are gone.
ALTER TABLE app_settings DROP COLUMN IF EXISTS cover_title;
ALTER TABLE app_settings DROP COLUMN IF EXISTS cover_subtitle;
ALTER TABLE app_settings ALTER COLUMN theme SET DEFAULT 'light';

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_rsvp_created ON rsvp(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_approved ON guestbook(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery(order_index ASC);

-- Guest list: one row per invitation. The token is the secret part of the personal link.
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  guest_key VARCHAR(260) UNIQUE NOT NULL,
  phone VARCHAR(20),
  max_guests INT NOT NULL DEFAULT 1 CHECK (max_guests BETWEEN 1 AND 20),
  group_name VARCHAR(100) NOT NULL DEFAULT '',
  invite_lamaran BOOLEAN NOT NULL DEFAULT FALSE,
  invite_akad BOOLEAN NOT NULL DEFAULT TRUE,
  invite_resepsi BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guests_group ON guests(group_name, name);

-- One RSVP per guest (rows from before personal links keep guest_id NULL).
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE CASCADE;
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvp_guest ON rsvp(guest_id);

-- Wishes belong to a guest; is_anonymous shows "Someone" publicly.
ALTER TABLE guestbook ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE guestbook ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- WhatsApp share template for personal links ({name}, {link}, {couple}).
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS invite_message TEXT DEFAULT '';

-- Event visibility now lives only on each event (is_active). Carry over events hidden through the
-- old Settings switches, then retire those switches. A no-op once they are all TRUE.
UPDATE events SET is_active = FALSE WHERE type = 'lamaran' AND EXISTS (SELECT 1 FROM app_settings WHERE id = 'main' AND show_lamaran = FALSE);
UPDATE events SET is_active = FALSE WHERE type = 'akad' AND EXISTS (SELECT 1 FROM app_settings WHERE id = 'main' AND show_akad = FALSE);
UPDATE events SET is_active = FALSE WHERE type = 'resepsi' AND EXISTS (SELECT 1 FROM app_settings WHERE id = 'main' AND show_resepsi = FALSE);
UPDATE app_settings SET show_lamaran = TRUE, show_akad = TRUE, show_resepsi = TRUE WHERE id = 'main' AND NOT (show_lamaran AND show_akad AND show_resepsi);
