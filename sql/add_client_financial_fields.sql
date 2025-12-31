-- SQL Migration: Add financial and tracking fields to clients table
-- Safe to run: Uses IF NOT EXISTS checks to prevent errors on re-run
-- Run this in Supabase SQL Editor

-- Add payment_terms column for tracking client payment terms (e.g., "Net 30", "Net 45")
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_terms') THEN
    ALTER TABLE clients ADD COLUMN payment_terms text;
  END IF;
END $$;

-- Add last_contact_at column for tracking last contact date with client
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'last_contact_at') THEN
    ALTER TABLE clients ADD COLUMN last_contact_at timestamp with time zone;
  END IF;
END $$;

-- Add margin_trend column for tracking profitability trend (up, down, stable)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'margin_trend') THEN
    ALTER TABLE clients ADD COLUMN margin_trend text CHECK (margin_trend IN ('up', 'down', 'stable'));
  END IF;
END $$;

-- Add phone column for client contact phone
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'contact_phone') THEN
    ALTER TABLE clients ADD COLUMN contact_phone text;
  END IF;
END $$;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
