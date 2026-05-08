
CREATE TABLE public.counseling_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  student_usn text,
  student_name text,
  student_email text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  counselor_notes text,
  handled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.counseling_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students create own requests"
ON public.counseling_requests FOR INSERT TO authenticated
WITH CHECK (student_user_id = auth.uid());

CREATE POLICY "Students view own requests"
ON public.counseling_requests FOR SELECT TO authenticated
USING (student_user_id = auth.uid() OR has_role(auth.uid(), 'counselor'::app_role));

CREATE POLICY "Counselors update requests"
ON public.counseling_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'counselor'::app_role));

CREATE TRIGGER update_counseling_requests_updated_at
BEFORE UPDATE ON public.counseling_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.counseling_requests;
ALTER TABLE public.counseling_requests REPLICA IDENTITY FULL;
