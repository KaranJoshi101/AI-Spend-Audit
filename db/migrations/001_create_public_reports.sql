-- Migration: create public_reports table for storing shared audits
-- Run this in your Supabase SQL editor or psql against the database

CREATE TABLE IF NOT EXISTS public_reports (
  slug text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Optional: add index on created_at for pruning
CREATE INDEX IF NOT EXISTS idx_public_reports_created_at ON public_reports (created_at);
