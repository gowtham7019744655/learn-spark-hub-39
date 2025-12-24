-- Create parent_children relationship table
CREATE TABLE public.parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_usn TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('mother', 'father', 'guardian', 'other')),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_usn)
);

-- Enable RLS on parent_children
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Parents can view their own relationships
CREATE POLICY "Parents can view their children"
ON public.parent_children
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid() OR has_role(auth.uid(), 'lecturer'));

-- Parents can insert relationship requests (need approval)
CREATE POLICY "Parents can request child relationship"
ON public.parent_children
FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid() AND has_role(auth.uid(), 'parent'));

-- Only lecturers can update (approve) relationships
CREATE POLICY "Lecturers can update parent-child relationships"
ON public.parent_children
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'lecturer'));

-- Only lecturers can delete relationships
CREATE POLICY "Lecturers can delete parent-child relationships"
ON public.parent_children
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'lecturer'));

-- Create indexes for performance
CREATE INDEX idx_parent_children_parent_id ON public.parent_children(parent_user_id);
CREATE INDEX idx_parent_children_student_usn ON public.parent_children(student_usn);

-- Create helper function to check if parent can view student
CREATE OR REPLACE FUNCTION public.parent_can_view_student(
  _parent_user_id UUID,
  _student_usn TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_children
    WHERE parent_user_id = _parent_user_id
      AND student_usn = _student_usn
      AND approved = true
  )
$$;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Students can view their own marks" ON public.student_marks;

-- Create new restricted policy for student_marks
CREATE POLICY "Students can view their own marks"
ON public.student_marks
FOR SELECT
TO authenticated
USING (
  -- Students can view their own marks
  student_usn = (SELECT usn FROM public.profiles WHERE id = auth.uid())
  -- Lecturers can view all marks
  OR has_role(auth.uid(), 'lecturer')
  -- Parents can ONLY view their approved children's marks
  OR (
    has_role(auth.uid(), 'parent')
    AND parent_can_view_student(auth.uid(), student_usn)
  )
);

-- Also update student_tests policy to restrict parent access
DROP POLICY IF EXISTS "Students can view their own test submissions" ON public.student_tests;

CREATE POLICY "Students can view their own test submissions"
ON public.student_tests
FOR SELECT
TO authenticated
USING (
  -- Students can view their own tests
  student_usn = (SELECT usn FROM public.profiles WHERE id = auth.uid())
  -- Lecturers can view all
  OR has_role(auth.uid(), 'lecturer')
  -- Parents can only view approved children's tests
  OR (
    has_role(auth.uid(), 'parent')
    AND parent_can_view_student(auth.uid(), student_usn)
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_parent_children_updated_at
BEFORE UPDATE ON public.parent_children
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();