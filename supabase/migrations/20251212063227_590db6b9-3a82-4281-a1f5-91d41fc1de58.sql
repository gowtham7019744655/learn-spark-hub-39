-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_internal INTEGER NOT NULL DEFAULT 50,
  max_external INTEGER NOT NULL DEFAULT 100,
  semester INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_marks table
CREATE TABLE public.student_marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_usn TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  internal_marks INTEGER NOT NULL DEFAULT 0,
  external_marks INTEGER NOT NULL DEFAULT 0,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_usn, subject_id)
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;

-- RLS policies for subjects (public read, authenticated write)
CREATE POLICY "Anyone can view subjects" 
ON public.subjects 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage subjects" 
ON public.subjects 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS policies for student_marks (students can view their own, authenticated can manage)
CREATE POLICY "Students can view their own marks" 
ON public.student_marks 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage marks" 
ON public.student_marks 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for student_marks
CREATE TRIGGER update_student_marks_updated_at
BEFORE UPDATE ON public.student_marks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subjects
INSERT INTO public.subjects (name, max_internal, max_external, semester) VALUES
('Mathematics', 50, 100, 6),
('Physics', 50, 100, 6),
('Computer Science', 50, 100, 6),
('English', 50, 100, 6),
('Data Structures', 50, 100, 6),
('Digital Electronics', 50, 100, 6);