-- Drop all existing policies
DROP POLICY IF EXISTS "I_Band owners can insert members" ON band_members;
DROP POLICY IF EXISTS "I_Request membership" ON band_members;
DROP POLICY IF EXISTS "I_Request to join band" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can send invites" ON band_members;
DROP POLICY IF EXISTS "I_Musicians can request membership" ON band_members;
DROP POLICY IF EXISTS "I_Read band members" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can update members" ON band_members;

-- Create simplified policies
-- Allow band owners to insert invites
CREATE POLICY "I_Band owners can send invites" ON "public"."band_members"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.id = band_members.band_id 
    AND profiles.category = 'band'
  )
  AND status = 'pending'
  AND request_type = 'invite'
);

-- Allow musicians to request membership
CREATE POLICY "I_Musicians can request membership" ON "public"."band_members"
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = member_id
  AND status = 'requested'
  AND request_type = 'request'
);

-- Allow reading band members
CREATE POLICY "I_Read band members" ON "public"."band_members"
FOR SELECT TO authenticated
USING (
  auth.uid() = band_id OR auth.uid() = member_id
);

-- Allow band owners to update members
CREATE POLICY "I_Band owners can update members" ON "public"."band_members"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.id = band_members.band_id 
    AND profiles.category = 'band'
  )
); 