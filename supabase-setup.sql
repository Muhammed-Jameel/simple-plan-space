-- ============================================
-- Floor Plan Studio — Supabase Database Setup
-- ============================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This creates the table, security policies, and indexes needed.

-- 1. Projects table (stores all plan data as JSON strings)
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, user_id)
);

-- 2. Row Level Security (each user can only see/edit their own data)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own rows
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own rows
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own rows
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own rows
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_key ON projects(user_id, key);

-- 4. Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Optional: Enable Google OAuth
-- ============================================
-- Go to Supabase Dashboard → Authentication → Providers → Google
-- You'll need a Google Cloud Console OAuth client ID and secret.
-- Steps:
--   1. Go to console.cloud.google.com
--   2. Create a project (or use existing)
--   3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
--   4. Add authorized redirect URI:
--      https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
--   5. Copy Client ID and Secret into Supabase Google provider settings
