-- Enable RLS for school_teachers table
ALTER TABLE school_teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view school teachers" ON school_teachers;
DROP POLICY IF EXISTS "Schools can insert teacher invites" ON school_teachers;
DROP POLICY IF EXISTS "Teachers can update their own invites" ON school_teachers;
DROP POLICY IF EXISTS "Schools can update their own invites" ON school_teachers;
DROP POLICY IF EXISTS "Users can delete their own records" ON school_teachers;
DROP POLICY IF EXISTS "I_Delete school teachers" ON school_teachers;

-- Create policies for school_teachers table
CREATE POLICY "Users can view school teachers" ON school_teachers
    FOR SELECT USING (true);

CREATE POLICY "Schools can insert teacher invites" ON school_teachers
    FOR INSERT WITH CHECK (
        auth.uid() = school_id AND 
        status IN ('pending', 'requested')
    );

CREATE POLICY "Teachers can update their own invites" ON school_teachers
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Schools can update their own invites" ON school_teachers
    FOR UPDATE USING (auth.uid() = school_id);

CREATE POLICY "Users can delete their own records" ON school_teachers
    FOR DELETE USING (
        auth.uid() = school_id OR 
        auth.uid() = teacher_id
    ); 