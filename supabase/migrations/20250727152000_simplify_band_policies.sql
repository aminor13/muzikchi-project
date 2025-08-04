-- Drop all existing policies
DROP POLICY IF EXISTS "I_Band owners can insert members" ON band_members;
DROP POLICY IF EXISTS "I_Request membership" ON band_members;
DROP POLICY IF EXISTS "I_Request to join band" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can send invites" ON band_members;
DROP POLICY IF EXISTS "I_Musicians can request membership" ON band_members;
DROP POLICY IF EXISTS "I_Read band members" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can update members" ON band_members;

-- Create very simple policies
-- Allow all authenticated users to insert (we'll handle authorization in the API)
CREATE POLICY "I_Allow authenticated insert" ON "public"."band_members"
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow reading band members
CREATE POLICY "I_Read band members" ON "public"."band_members"
FOR SELECT TO authenticated
USING (
  auth.uid() = band_id OR auth.uid() = member_id
);

-- Allow updating band members
CREATE POLICY "I_Update band members" ON "public"."band_members"
FOR UPDATE TO authenticated
USING (
  auth.uid() = band_id OR auth.uid() = member_id
)
WITH CHECK (
  auth.uid() = band_id OR auth.uid() = member_id
); 