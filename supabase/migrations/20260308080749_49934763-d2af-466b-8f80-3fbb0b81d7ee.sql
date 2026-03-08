
-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_usn text NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  marked_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_usn, subject_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Lecturers can insert attendance
CREATE POLICY "Lecturers can insert attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'lecturer'::app_role));

-- Lecturers can update attendance
CREATE POLICY "Lecturers can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'lecturer'::app_role));

-- Lecturers can delete attendance
CREATE POLICY "Lecturers can delete attendance"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'lecturer'::app_role));

-- Students can view their own attendance, lecturers and counselors can view all
CREATE POLICY "View attendance policy"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    student_usn = (SELECT profiles.usn FROM profiles WHERE profiles.id = auth.uid())
    OR has_role(auth.uid(), 'lecturer'::app_role)
    OR has_role(auth.uid(), 'counselor'::app_role)
    OR (has_role(auth.uid(), 'parent'::app_role) AND parent_can_view_student(auth.uid(), student_usn))
  );

-- Add updated_at trigger
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
