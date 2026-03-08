
-- Questions table for tests
CREATE TABLE public.test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'mcq',
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  question_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Lecturers can manage questions
CREATE POLICY "Lecturers can insert questions"
  ON public.test_questions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Lecturers can update questions"
  ON public.test_questions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Lecturers can delete questions"
  ON public.test_questions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'lecturer'::app_role));

-- Students can view questions for published tests they're taking
CREATE POLICY "Authenticated can view questions of published tests"
  ON public.test_questions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tests WHERE tests.id = test_questions.test_id AND (tests.status = 'published' OR tests.created_by = auth.uid())
  ));

-- Student answers table
CREATE TABLE public.student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_usn text NOT NULL,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
  selected_answer text,
  is_correct boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_usn, question_id)
);

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Students can insert their own answers
CREATE POLICY "Students can insert answers"
  ON public.student_answers FOR INSERT TO authenticated
  WITH CHECK (student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid()));

-- Students can view their own answers, lecturers can view all
CREATE POLICY "View answers policy"
  ON public.student_answers FOR SELECT TO authenticated
  USING (
    student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
    OR has_role(auth.uid(), 'lecturer'::app_role)
    OR has_role(auth.uid(), 'counselor'::app_role)
  );
