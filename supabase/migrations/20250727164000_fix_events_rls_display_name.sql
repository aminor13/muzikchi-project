-- Fix events RLS policy to work with display_name
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Create new policies using display_name
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

CREATE POLICY "Users can update their own events" ON events
FOR UPDATE USING (
  events.created_by = (
    SELECT profiles.display_name
    FROM profiles
    WHERE profiles.id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their own events" ON events
FOR DELETE USING (
  events.created_by = (
    SELECT profiles.display_name
    FROM profiles
    WHERE profiles.id::text = auth.uid()::text
  )
); 