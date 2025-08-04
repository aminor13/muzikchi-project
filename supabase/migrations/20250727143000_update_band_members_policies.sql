-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "I_Band owners can insert members" ON band_members;
DROP POLICY IF EXISTS "I_Request membership" ON band_members;
DROP POLICY IF EXISTS "I_Request to join band" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can send invites" ON band_members;

-- Create new policies with proper conditions
-- Policy for band owners to send invites
CREATE POLICY "I_Band owners can send invites" ON "public"."band_members"
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.band_id 
    AND profiles.category = 'band'
  )
  AND status = 'pending'
  AND request_type = 'invite'
);

-- Policy for musicians to request membership
CREATE POLICY "I_Musicians can request membership" ON "public"."band_members"
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = member_id
  AND status = 'requested'
  AND request_type = 'request'
);

-- Policy for reading band members (for band owners and members)
CREATE POLICY "I_Read band members" ON "public"."band_members"
FOR SELECT TO authenticated
USING (
  auth.uid() = band_id OR auth.uid() = member_id
);

-- Policy for updating band member status (for band owners)
CREATE POLICY "I_Band owners can update members" ON "public"."band_members"
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.band_id 
    AND profiles.category = 'band'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.band_id 
    AND profiles.category = 'band'
  )
); 