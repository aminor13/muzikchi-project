-- Drop existing storage policies for event-posters bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create new policies for event-posters bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'event-posters');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-posters' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'event-posters' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'event-posters' AND auth.role() = 'authenticated'); 