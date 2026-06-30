
-- 1. Remove student self-update on test scores and answers (scoring is server-side via submit_test)
DROP POLICY IF EXISTS "Students can update their own test submissions" ON public.student_tests;
DROP POLICY IF EXISTS "Students can update their own answers" ON public.student_answers;
DROP POLICY IF EXISTS "Students can insert their own test submissions" ON public.student_tests;
DROP POLICY IF EXISTS "Students can insert answers" ON public.student_answers;

-- 2. Profiles: restrict staff broad read to student profiles only
DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;
CREATE POLICY "Staff can view student profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'lecturer'::app_role) OR public.has_role(auth.uid(), 'counselor'::app_role))
  AND public.has_role(id, 'student'::app_role)
);

-- 3. Revoke EXECUTE from authenticated on internal helper SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.parent_can_view_student(uuid, text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated, anon, PUBLIC;

-- 4. Hide user_roles from the Data/GraphQL API (still readable via has_role security-definer)
REVOKE ALL ON public.user_roles FROM authenticated, anon;
GRANT ALL ON public.user_roles TO service_role;
