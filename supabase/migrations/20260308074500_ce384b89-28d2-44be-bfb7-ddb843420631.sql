-- Add 'counselor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'counselor';

-- Add unique constraint on user_roles if not exists (needed for handle_new_user ON CONFLICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;