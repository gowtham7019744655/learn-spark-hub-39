-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'parent');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  usn TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- User roles RLS policies (only user can see their own roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, usn)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'usn'
  );
  
  -- Insert user role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::app_role
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update profiles trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop overly permissive policies and create proper ones
DROP POLICY IF EXISTS "Authenticated users can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Authenticated users can manage marks" ON public.student_marks;
DROP POLICY IF EXISTS "Authenticated users can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Anyone can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Students can view their own marks" ON public.student_marks;

-- Subjects: Public read, only lecturers can manage
CREATE POLICY "Anyone can view subjects"
ON public.subjects
FOR SELECT
USING (true);

CREATE POLICY "Lecturers can insert subjects"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can update subjects"
ON public.subjects
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can delete subjects"
ON public.subjects
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'lecturer'));

-- Student marks: Students see own, lecturers can manage all
CREATE POLICY "Students can view their own marks"
ON public.student_marks
FOR SELECT
TO authenticated
USING (
  student_usn = (SELECT usn FROM public.profiles WHERE id = auth.uid())
  OR public.has_role(auth.uid(), 'lecturer')
  OR public.has_role(auth.uid(), 'parent')
);

CREATE POLICY "Lecturers can insert marks"
ON public.student_marks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can update marks"
ON public.student_marks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can delete marks"
ON public.student_marks
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'lecturer'));

-- Assignments: Public read, lecturers manage
CREATE POLICY "Anyone can view assignments"
ON public.assignments
FOR SELECT
USING (true);

CREATE POLICY "Lecturers can insert assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can update their assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can delete their assignments"
ON public.assignments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'lecturer'));