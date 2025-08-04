-- Recreate profiles_public_view for public access to profile information
CREATE OR REPLACE VIEW profiles_public_view AS
SELECT 
    id,
    display_name,
    name,
    email,
    phone,
    description,
    address,
    avatar_url,
    province,
    city,
    gender,
    birth_year,
    music_experience,
    equipments,
    performance_count,
    ready_for_cooperate,
    looking_for_musician,
    category,
    roles,
    website,
    social_links,
    views,
    is_complete,
    is_verified,
    updated_at,
    created_at
FROM profiles
WHERE is_complete = true;

-- Grant access to the view
GRANT SELECT ON profiles_public_view TO authenticated;
GRANT SELECT ON profiles_public_view TO anon; 