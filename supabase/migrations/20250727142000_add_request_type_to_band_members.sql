-- Add request_type column to band_members table
ALTER TABLE band_members 
ADD COLUMN request_type text DEFAULT 'request';

-- Update existing records to have appropriate request_type
UPDATE band_members 
SET request_type = 'invite' 
WHERE status = 'pending' AND band_id IS NOT NULL;

UPDATE band_members 
SET request_type = 'request' 
WHERE status = 'requested' AND member_id IS NOT NULL; 