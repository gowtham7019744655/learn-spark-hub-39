
-- Drop the two restrictive SELECT policies
DROP POLICY IF EXISTS "Authenticated can view test scores for leaderboard" ON public.student_tests;
DROP POLICY IF EXISTS "Students can view their own test submissions" ON public.student_tests;

-- Recreate as PERMISSIVE so ANY matching policy grants access
CREATE POLICY "Leaderboard view completed tests"
  ON public.student_tests FOR SELECT
  TO authenticated
  USING (status = 'completed');

CREATE POLICY "Own or authorized test submissions"
  ON public.student_tests FOR SELECT
  TO authenticated
  USING (
    student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
    OR has_role(auth.uid(), 'lecturer'::app_role)
    OR (has_role(auth.uid(), 'parent'::app_role) AND parent_can_view_student(auth.uid(), student_usn))
  );
