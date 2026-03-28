-- ==========================================
-- EMERGENCY FIX FOR "DATABASE ERROR SAVING NEW USER"
-- ==========================================
-- Problem: A previous version of the trigger is crashing because it refers to columns that don't exist, which causes your entire database to reject all new signups.
-- Solution: We will drop the broken trigger entirely. The frontend is already smart enough to create settings rows automatically when users log in.

-- 1. Copy all the text in this file.
-- 2. Open your Supabase Dashboard -> SQL Editor.
-- 3. Paste this and click "Run". Your signups will instantly start working again!

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- SUCCESS: You can now sign up successfully.
