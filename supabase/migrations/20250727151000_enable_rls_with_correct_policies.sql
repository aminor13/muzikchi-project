-- Enable RLS on band_members table
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "I_Band owners can insert members" ON band_members;
DROP POLICY IF EXISTS "I_Request membership" ON band_members;
DROP POLICY IF EXISTS "I_Request to join band" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can send invites" ON band_members;
DROP POLICY IF EXISTS "I_Musicians can request membership" ON band_members;
DROP POLICY IF EXISTS "I_Read band members" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can update members" ON band_members;

-- Create correct policies
-- Policy for band owners to send invites
CREATE POLICY "I_Band owners can send invites" ON "public"."band_members"
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = band_id
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

-- Policy for reading band members
CREATE POLICY "I_Read band members" ON "public"."band_members"
FOR SELECT TO authenticated
USING (
  auth.uid() = band_id OR auth.uid() = member_id
);

-- Policy for updating band member status (for band owners)
CREATE POLICY "I_Band owners can update members" ON "public"."band_members"
FOR UPDATE TO authenticated
USING (
  auth.uid() = band_id
)
WITH CHECK (
  auth.uid() = band_id
); 