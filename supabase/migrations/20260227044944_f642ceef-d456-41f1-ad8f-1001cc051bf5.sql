
-- Add explicit restrictive policies on user_roles to prevent any direct INSERT/UPDATE/DELETE
-- Roles are only managed through the handle_new_user trigger (SECURITY DEFINER)

-- Deny all direct inserts - only the trigger can insert roles
CREATE POLICY "No direct role inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Deny all direct updates - roles cannot be changed by users
CREATE POLICY "No direct role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Deny all direct deletes - roles cannot be deleted by users
CREATE POLICY "No direct role deletes"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);
