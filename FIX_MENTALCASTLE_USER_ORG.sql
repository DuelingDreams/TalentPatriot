-- Fix MentalCastle user-organization relationship for development
-- This ensures the development user can access MentalCastle organization

-- Insert user-organization relationship if it doesn't exist
INSERT INTO user_organizations (id, user_id, org_id, role, joined_at)
VALUES (
    gen_random_uuid(),
    'b67bf044-fa88-4579-9c06-03f3026bab95', -- Development user ID
    '90531171-d56b-4732-baba-35be47b0cb08', -- MentalCastle org ID
    'owner',                                 -- Role as owner
    NOW()                                    -- Current timestamp
) ON CONFLICT (user_id, org_id) DO NOTHING; -- Don't insert if already exists

-- Verify the relationship was created
SELECT 
    uo.user_id,
    uo.role,
    o.name as organization_name,
    o.id as organization_id
FROM user_organizations uo
JOIN organizations o ON uo.org_id = o.id
WHERE uo.user_id = 'b67bf044-fa88-4579-9c06-03f3026bab95'
  AND o.name = 'MentalCastle';