-- Fix infinite recursion in school_teachers RLS policies
-- First disable RLS
ALTER TABLE school_teachers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Users can view school teachers" ON school_teachers;
DROP POLICY IF EXISTS "Schools can insert teacher invites" ON school_teachers;
DROP POLICY IF EXISTS "Teachers can update their own invites" ON school_teachers;
DROP POLICY IF EXISTS "Schools can update their own invites" ON school_teachers;
DROP POLICY IF EXISTS "Users can delete their own records" ON school_teachers;
DROP POLICY IF EXISTS "I_Delete school teachers" ON school_teachers;

-- Re-enable RLS with simple policies
ALTER TABLE school_teachers ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow all operations for authenticated users" ON school_teachers
    FOR ALL USING (auth.role() = 'authenticated'); 