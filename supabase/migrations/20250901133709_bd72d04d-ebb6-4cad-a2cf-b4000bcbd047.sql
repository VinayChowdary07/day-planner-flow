-- Ensure profiles table has the strongest possible RLS protection
-- First, drop all existing policies to rebuild them properly
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Ensure RLS is enabled and forced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Create comprehensive policies that completely block any unauthorized access

-- 1. Completely block ALL access for anonymous users - most restrictive policy
CREATE POLICY "profiles_block_anonymous_all"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Allow authenticated users to SELECT only their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow authenticated users to INSERT only their own profile
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Allow authenticated users to UPDATE only their own profile  
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Prevent DELETE operations for safety (profiles should persist)
CREATE POLICY "profiles_no_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- Additional security: Grant minimal permissions
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;