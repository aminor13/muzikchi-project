-- Create event-posters storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-posters',
  'event-posters',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for event-posters bucket
CREATE POLICY "Public access to event-posters" ON storage.objects
FOR SELECT USING (bucket_id = 'event-posters');

-- Allow authenticated users to upload to event-posters
CREATE POLICY "Authenticated users can upload to event-posters" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-posters' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own uploads in event-posters" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-posters' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads in event-posters" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-posters' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 