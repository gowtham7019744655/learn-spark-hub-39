-- Fix 1: Replace public access policies with authenticated-only access
DROP POLICY IF EXISTS "Anyone can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;

CREATE POLICY "Authenticated users can view assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Add approval workflow for role escalation prevention
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Update the handle_new_user function to only auto-approve students
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, usn)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'usn'
  );
  
  -- Insert user role from metadata, only auto-approve students
  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::app_role,
    (NEW.raw_user_meta_data->>'role')::text = 'student'
  );
  
  RETURN NEW;
END;
$$;

-- Update has_role function to check approved status
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND approved = true
  )
$$;