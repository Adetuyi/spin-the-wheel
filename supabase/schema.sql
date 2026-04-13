-- ════════════════════════════════════════════════════════════════
-- Chekkit Spin & Win — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT NOT NULL,
  company_name      TEXT,
  role              TEXT,
  referral_code     TEXT NOT NULL UNIQUE,
  referred_by_code  TEXT,
  spins_remaining   INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_referral_code_idx ON leads (referral_code);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);

-- Spins table
CREATE TABLE IF NOT EXISTS spins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  prize_slug  TEXT NOT NULL,
  prize_name  TEXT NOT NULL,
  claimed     BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spins_lead_id_idx ON spins (lead_id);
CREATE INDEX IF NOT EXISTS spins_prize_slug_idx ON spins (prize_slug);

-- ── Helper function: atomically increment spins_remaining ────────
CREATE OR REPLACE FUNCTION increment_spins(lead_id UUID)
RETURNS VOID AS $$
  UPDATE leads
  SET spins_remaining = spins_remaining + 1
  WHERE id = lead_id;
$$ LANGUAGE SQL;

-- ── Row Level Security ───────────────────────────────────────────
-- Disable public access — all writes go through the service role key
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

-- No public policies — API routes use supabaseAdmin (service role)
-- which bypasses RLS entirely.
