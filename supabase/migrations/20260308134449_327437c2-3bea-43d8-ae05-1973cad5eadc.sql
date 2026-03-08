
-- Allow students to update their own answers (needed for upsert)
CREATE POLICY "Students can update their own answers"
ON public.student_answers FOR UPDATE
TO authenticated
USING (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
);
