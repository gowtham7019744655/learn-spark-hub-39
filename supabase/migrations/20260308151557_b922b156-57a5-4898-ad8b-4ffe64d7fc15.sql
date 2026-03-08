
-- Drop restrictive INSERT policies and recreate as permissive
DROP POLICY IF EXISTS "Lecturers can insert student test records" ON public.student_tests;
DROP POLICY IF EXISTS "Students can insert their own test submissions" ON public.student_tests;

-- Recreate as PERMISSIVE (default) so either one passing is sufficient
CREATE POLICY "Lecturers can insert student test records"
ON public.student_tests FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Students can insert their own test submissions"
ON public.student_tests FOR INSERT
TO authenticated
WITH CHECK (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
);

-- Also fix UPDATE policies on student_tests (same issue)
DROP POLICY IF EXISTS "Lecturers can update student test records" ON public.student_tests;
DROP POLICY IF EXISTS "Students can update their own test submissions" ON public.student_tests;

CREATE POLICY "Lecturers can update student test records"
ON public.student_tests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'lecturer'::app_role));

CREATE POLICY "Students can update their own test submissions"
ON public.student_tests FOR UPDATE
TO authenticated
USING (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
);

-- Fix SELECT policy too
DROP POLICY IF EXISTS "Students can view their own test submissions" ON public.student_tests;

CREATE POLICY "Students can view their own test submissions"
ON public.student_tests FOR SELECT
TO authenticated
USING (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
  OR has_role(auth.uid(), 'lecturer'::app_role)
  OR (has_role(auth.uid(), 'parent'::app_role) AND parent_can_view_student(auth.uid(), student_usn))
);

-- Also fix student_answers policies (same restrictive issue)
DROP POLICY IF EXISTS "Students can insert answers" ON public.student_answers;
DROP POLICY IF EXISTS "Students can update their own answers" ON public.student_answers;
DROP POLICY IF EXISTS "View answers policy" ON public.student_answers;

CREATE POLICY "Students can insert answers"
ON public.student_answers FOR INSERT
TO authenticated
WITH CHECK (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Students can update their own answers"
ON public.student_answers FOR UPDATE
TO authenticated
USING (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "View answers policy"
ON public.student_answers FOR SELECT
TO authenticated
USING (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
  OR has_role(auth.uid(), 'lecturer'::app_role)
  OR has_role(auth.uid(), 'counselor'::app_role)
);
