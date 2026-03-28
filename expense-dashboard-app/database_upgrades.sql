-- ==========================================
-- SUPABASE BACKEND ARCHITECTURE UPGRADES
-- ==========================================
-- INSTRUCTIONS: Run this script sequentially in your Supabase SQL Editor.

-- 1. ENABLE ROW LEVEL SECURITY (RLS)
-- Ensuring strict user data isolation.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES: USERS CAN ONLY ACCESS THEIR OWN DATA
-- Transactions
CREATE POLICY "Users can only select their own transactions."
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own transactions."
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own transactions."
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own transactions."
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Goals
CREATE POLICY "Users can only select their own goals."
  ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own goals."
  ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own goals."
  ON goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own goals."
  ON goals FOR DELETE USING (auth.uid() = user_id);

-- Settings
CREATE POLICY "Users can only select their own settings."
  ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own settings."
  ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own settings."
  ON settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. CASCADING DELETES
-- Automatically delete app data when a user account is deleted from `auth.users`.
-- Drop existing constraints to recreate them with CASCADE
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_user_id_fkey;
ALTER TABLE settings ADD CONSTRAINT settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- Optional feature for creating admin-level users.
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'moderator')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own role."
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Secure Admin Policy: Only existing admins can insert/update roles.
CREATE POLICY "Admins can manage all roles."
  ON user_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 5. TRIGGER: AUTO-CREATE SETTINGS ROW ON SIGNUP
-- Automatically initialize the user settings table so the app doesn't have to guess.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.settings (user_id, total_budget, monthly_income, theme_color, avatar_url)
  VALUES (new.id, 29000, 45000, '#6c47ff', '');
  -- Optionally assign default role
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users (if it doesn't already exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SUCCESS --
