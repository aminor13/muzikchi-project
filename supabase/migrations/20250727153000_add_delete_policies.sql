-- Add DELETE policies for band_members table
CREATE POLICY "I_Delete band members" ON "public"."band_members"
FOR DELETE TO authenticated
USING (
  auth.uid() = member_id OR auth.uid() = band_id
);

-- Add DELETE policies for school_teachers table
CREATE POLICY "I_Delete school teachers" ON "public"."school_teachers"
FOR DELETE TO authenticated
USING (
  auth.uid() = teacher_id OR auth.uid() = school_id
); 