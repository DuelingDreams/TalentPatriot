-- =====================================================
-- Subdomain-Based Organization Routing Migration
-- =====================================================
-- This script adds organization slug functionality for subdomain routing
-- Execute this in your Supabase SQL Editor

-- 1. Ensure the organizations table has the slug column (if not already added by Drizzle)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Create a function to generate URL-safe slugs from organization names
CREATE OR REPLACE FUNCTION generate_org_slug(org_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens, remove consecutive hyphens
    RETURN regexp_replace(
        regexp_replace(
            lower(trim(org_name)),
            '[^a-z0-9]+', '-', 'g'
        ),
        '-+', '-', 'g'
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Generate slugs for existing organizations (only if they don't have one)
UPDATE organizations 
SET slug = generate_org_slug(name) 
WHERE slug IS NULL;

-- 4. Create a unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS unique_org_slug ON organizations(slug);

-- 5. Create trigger to auto-generate slug for new organizations
CREATE OR REPLACE FUNCTION set_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- If slug is not provided, generate it from name
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_org_slug(NEW.name);
        
        -- Handle potential conflicts by appending a number
        DECLARE
            base_slug TEXT := NEW.slug;
            counter INT := 1;
        BEGIN
            WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = NEW.slug AND id != NEW.id) LOOP
                NEW.slug = base_slug || '-' || counter;
                counter = counter + 1;
            END LOOP;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for new organization inserts and updates
DROP TRIGGER IF EXISTS organization_slug_trigger ON organizations;
CREATE TRIGGER organization_slug_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION set_organization_slug();

-- 7. Verification query - show all organizations with their slugs
SELECT 
    name,
    slug,
    created_at,
    CASE 
        WHEN slug IS NOT NULL THEN 'https://' || slug || '.talentpatriot.app/careers'
        ELSE 'No slug generated'
    END as careers_url
FROM organizations
ORDER BY created_at;

-- =====================================================
-- Summary of what this script creates:
-- =====================================================
-- 1. Ensures slug column exists on organizations table
-- 2. Auto-generates URL-safe slugs for existing organizations
-- 3. Creates unique constraint on slug to prevent duplicates  
-- 4. Auto-generates slugs for new organizations via trigger
-- 5. Handles slug conflicts by appending numbers (company-2, company-3, etc.)
-- 6. Shows careers URLs for each organization
--
-- After running this, each organization will have:
-- - A unique slug (e.g., "techcorp-solutions")
-- - A careers page accessible at: company-name.talentpatriot.app/careers
-- - Organization-specific job listings only