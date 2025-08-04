-- Add policy for band owners to send invites with pending status
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