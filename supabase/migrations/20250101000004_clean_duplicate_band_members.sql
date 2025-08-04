-- Clean up duplicate band_members records
-- Keep only the most recent record for each band_id and member_id combination

DELETE FROM band_members 
WHERE id NOT IN (
  SELECT DISTINCT ON (band_id, member_id) id
  FROM band_members
  ORDER BY band_id, member_id, created_at DESC
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE band_members 
ADD CONSTRAINT unique_band_member 
UNIQUE (band_id, member_id); 