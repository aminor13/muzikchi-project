-- Fix events RLS policy
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Create new policies
CREATE POLICY "Users can create events" ON events
FOR INSERT WITH CHECK (
  auth.uid()::text IN (
    SELECT profiles.id::text
    FROM profiles
    WHERE (
      (profiles.category = 'band') OR 
      ('venue' = ANY (profiles.roles)) OR 
      ('school' = ANY (profiles.roles))
    )
  )
);

CREATE POLICY "Users can view events" ON events
FOR SELECT USING (true);

CREATE POLICY "Users can update their own events" ON events
FOR UPDATE USING (
  events.created_by::uuid = auth.uid()
);

CREATE POLICY "Users can delete their own events" ON events
FOR DELETE USING (
  events.created_by::uuid = auth.uid()
); 