-- Remove email column from profiles table since it's not needed for display
-- The email is already available in auth.users if needed for authentication
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;