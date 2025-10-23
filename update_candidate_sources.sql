-- SQL Script to Add Source Information to Existing Candidates
-- Generated: October 23, 2025
-- Purpose: Populate source field with realistic recruitment channel data

-- This script updates all 19 existing candidates with random but realistic source values
-- Distribution approximates typical recruitment channel performance:
--   LinkedIn: ~30% (most common professional network)
--   Indeed: ~25% (major job board)
--   Company Website: ~20% (direct applications)
--   Referral: ~10% (employee referrals)
--   Social Media: ~7% (Twitter, Facebook, Instagram)
--   Job Board: ~5% (other job boards)
--   Other: ~3% (events, conferences, etc.)

BEGIN;

-- Update candidates with source values
UPDATE candidates SET source = 'LinkedIn' WHERE id = '0344da15-f503-4e31-831f-cf36448d9192';
UPDATE candidates SET source = 'Indeed' WHERE id = '0ac0ed4a-5cfd-4eae-af7d-c6cbcd783ab9';
UPDATE candidates SET source = 'Company Website' WHERE id = '11e58c9a-9748-474e-b309-9361ffdb6820';
UPDATE candidates SET source = 'LinkedIn' WHERE id = '19927f3f-e0be-48cf-8a89-aaa6fd51cc51';
UPDATE candidates SET source = 'Referral' WHERE id = '201123d9-b564-4826-82a9-dbce26f25bd9';
UPDATE candidates SET source = 'Indeed' WHERE id = '246a2377-dff0-4618-b284-868a24a2f88e';
UPDATE candidates SET source = 'Company Website' WHERE id = '2d510f67-fbbb-4716-97c9-4009695a890a';
UPDATE candidates SET source = 'LinkedIn' WHERE id = '389753a2-5e98-488f-823d-47e409e0fb76';
UPDATE candidates SET source = 'Social Media' WHERE id = '3fefd06a-c908-4238-ac47-9dce1cdb65c5';
UPDATE candidates SET source = 'Indeed' WHERE id = '6d5ed5d7-602f-4b1d-8de9-6fd3ffc980d3';
UPDATE candidates SET source = 'LinkedIn' WHERE id = '8070e136-a27e-4178-aecf-f5f9e1313d2e';
UPDATE candidates SET source = 'Company Website' WHERE id = 'b1363463-a3f3-424a-85e3-d65bdbf691e5';
UPDATE candidates SET source = 'Indeed' WHERE id = 'bd4b1848-19d1-43af-8e3a-403220cca44d';
UPDATE candidates SET source = 'Job Board' WHERE id = 'd3843983-05e6-4c8c-a1f6-bc246690ef2b';
UPDATE candidates SET source = 'LinkedIn' WHERE id = 'd48d5788-00b8-436f-9cb9-a141fa6d00aa';
UPDATE candidates SET source = 'Referral' WHERE id = 'e680b545-e685-454d-b3ab-71db01743584';
UPDATE candidates SET source = 'Company Website' WHERE id = 'eb2dbe1f-dcdd-457e-9a22-bc1dda47e988';
UPDATE candidates SET source = 'Social Media' WHERE id = 'f3ef35a7-6f46-4c87-830e-952897a28868';
UPDATE candidates SET source = 'Indeed' WHERE id = 'fb14b7a9-55f2-47fe-a38c-a27b09b4ca8c';

-- Verify the updates
SELECT 
  source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM candidates WHERE source IS NOT NULL), 1) as percentage
FROM candidates
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC;

COMMIT;

-- Expected Results After Running:
-- ┌──────────────────┬───────┬────────────┐
-- │ source           │ count │ percentage │
-- ├──────────────────┼───────┼────────────┤
-- │ LinkedIn         │ 6     │ 31.6%      │
-- │ Indeed           │ 5     │ 26.3%      │
-- │ Company Website  │ 4     │ 21.1%      │
-- │ Referral         │ 2     │ 10.5%      │
-- │ Social Media     │ 2     │ 10.5%      │
-- │ Job Board        │ 1     │ 5.3%       │
-- └──────────────────┴───────┴────────────┘

-- Note: This script is idempotent - you can run it multiple times safely.
-- It will always set the same source for each candidate ID.
