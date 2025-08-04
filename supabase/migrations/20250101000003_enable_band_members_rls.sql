-- Re-enable RLS on band_members table with proper policies
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "I_Allow authenticated insert" ON band_members;
DROP POLICY IF EXISTS "I_Read band members" ON band_members;
DROP POLICY IF EXISTS "I_Update band members" ON band_members;
DROP POLICY IF EXISTS "I_Band owners can send invites" ON band_members;
DROP POLICY IF EXISTS "I_Musicians can request membership" ON band_members;
DROP POLICY IF EXISTS "I_Delete band members" ON band_members;

-- Create new policies
CREATE POLICY "I_Band owners can send invites" ON "public"."band_members"
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.band_id
    AND profiles.category = 'band'
  )
);

CREATE POLICY "I_Musicians can request membership" ON "public"."band_members"
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.member_id
    AND (profiles.roles @> ARRAY['musician'] OR profiles.roles @> ARRAY['vocalist'] OR profiles.roles @> ARRAY['singer'])
  )
);

CREATE POLICY "I_Read band members" ON "public"."band_members"
FOR SELECT USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "I_Update band members" ON "public"."band_members"
FOR UPDATE USING (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.band_id
    AND profiles.category = 'band'
  )
);

CREATE POLICY "I_Delete band members" ON "public"."band_members"
FOR DELETE USING (
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = band_members.band_id
    AND profiles.category = 'band'
  )
); 