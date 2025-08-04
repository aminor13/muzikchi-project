-- Simplify event-posters storage policies
-- Drop existing policies
DROP POLICY IF EXISTS "Public access to event-posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to event-posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads in event-posters" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in event-posters" ON storage.objects;

-- Create simple policies
CREATE POLICY "Public access to event-posters" ON storage.objects
FOR SELECT USING (bucket_id = 'event-posters');

-- Allow all authenticated users to upload, update, and delete
CREATE POLICY "Authenticated users can manage event-posters" ON storage.objects
FOR ALL USING (
  bucket_id = 'event-posters' 
  AND auth.role() = 'authenticated'
); 