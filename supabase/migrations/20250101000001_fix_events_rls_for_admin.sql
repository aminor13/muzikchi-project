-- Drop existing RLS policies for events
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Create new RLS policies for events
CREATE POLICY "Users can view all events" ON events
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events" ON events
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.display_name = events.created_by
  )
);

CREATE POLICY "Users can update their own events" ON events
FOR UPDATE USING (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.display_name = events.created_by
  )
);

CREATE POLICY "Users can delete their own events" ON events
FOR DELETE USING (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.display_name = events.created_by
  )
);

-- Add admin override policy
CREATE POLICY "Admins can manage all events" ON events
FOR ALL USING (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.is_admin = true
  )
); 