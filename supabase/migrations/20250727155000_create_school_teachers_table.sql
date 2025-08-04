-- Create school_teachers table
CREATE TABLE IF NOT EXISTS public.school_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'requested')),
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin')),
    rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, teacher_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_school_teachers_school_id ON public.school_teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_school_teachers_teacher_id ON public.school_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_school_teachers_status ON public.school_teachers(status);

-- Enable RLS
ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view school teachers" ON public.school_teachers
    FOR SELECT USING (true);

CREATE POLICY "Schools can insert teacher invites" ON public.school_teachers
    FOR INSERT WITH CHECK (
        auth.uid() = school_id AND 
        status IN ('pending', 'requested')
    );

CREATE POLICY "Teachers can update their own invites" ON public.school_teachers
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Schools can update their own invites" ON public.school_teachers
    FOR UPDATE USING (auth.uid() = school_id);

CREATE POLICY "Users can delete their own records" ON public.school_teachers
    FOR DELETE USING (
        auth.uid() = school_id OR 
        auth.uid() = teacher_id
    ); 