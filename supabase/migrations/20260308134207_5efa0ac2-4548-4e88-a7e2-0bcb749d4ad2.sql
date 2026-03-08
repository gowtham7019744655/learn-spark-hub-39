
-- Add unique constraint on student_tests for upsert support
ALTER TABLE public.student_tests ADD CONSTRAINT student_tests_student_usn_test_id_unique UNIQUE (student_usn, test_id);

-- Add unique constraint on student_answers for upsert support
ALTER TABLE public.student_answers ADD CONSTRAINT student_answers_student_usn_question_id_unique UNIQUE (student_usn, question_id);

-- Allow students to INSERT their own test records
CREATE POLICY "Students can insert their own test submissions"
ON public.student_tests FOR INSERT
TO authenticated
WITH CHECK (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
);
