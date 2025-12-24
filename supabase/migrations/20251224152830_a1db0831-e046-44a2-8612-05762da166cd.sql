-- Create tests table for lecturers to create tests
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_questions INTEGER NOT NULL DEFAULT 10,
  max_score INTEGER NOT NULL DEFAULT 100,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_tests table to track student test submissions
CREATE TABLE public.student_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  student_usn TEXT NOT NULL,
  score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_id, student_usn)
);

-- Enable RLS on tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tests ENABLE ROW LEVEL SECURITY;

-- Tests policies
CREATE POLICY "Authenticated users can view published tests"
ON public.tests
FOR SELECT
TO authenticated
USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Lecturers can insert tests"
ON public.tests
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Lecturers can update their tests"
ON public.tests
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() AND has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Lecturers can delete their tests"
ON public.tests
FOR DELETE
TO authenticated
USING (created_by = auth.uid() AND has_role(auth.uid(), 'lecturer'::app_role));

-- Student tests policies
CREATE POLICY "Students can view their own test submissions"
ON public.student_tests
FOR SELECT
TO authenticated
USING (
  student_usn = (SELECT usn FROM profiles WHERE id = auth.uid())
  OR has_role(auth.uid(), 'lecturer'::app_role)
);

CREATE POLICY "Lecturers can insert student test records"
ON public.student_tests
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Students can update their own test submissions"
ON public.student_tests
FOR UPDATE
TO authenticated
USING (student_usn = (SELECT usn FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Lecturers can update student test records"
ON public.student_tests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'lecturer'::app_role));

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_marks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tests;

-- Add triggers for updated_at
CREATE TRIGGER update_tests_updated_at
BEFORE UPDATE ON public.tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_tests_updated_at
BEFORE UPDATE ON public.student_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();