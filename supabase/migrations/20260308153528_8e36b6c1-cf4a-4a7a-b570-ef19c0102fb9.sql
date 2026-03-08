-- Allow all authenticated users to view student_tests for leaderboard
-- (only score, student_usn, test_id are needed; the SELECT policy already exists for own records)
CREATE POLICY "Authenticated can view test scores for leaderboard"
ON public.student_tests FOR SELECT
TO authenticated
USING (status = 'completed');
