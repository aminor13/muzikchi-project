-- Fix events RLS policy UUID comparison
-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Create new policies with correct UUID comparison
CREATE POLICY "Users can update their own events" ON events
FOR UPDATE USING (
  events.created_by::uuid = auth.uid()
);

CREATE POLICY "Users can delete their own events" ON events
FOR DELETE USING (
  events.created_by::uuid = auth.uid()
); 