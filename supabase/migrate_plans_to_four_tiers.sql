-- Comprehensive migration to update plan tier constraints
-- Run this in your Supabase SQL Editor
-- This script updates all constraints to support the new 4-tier plan structure

-- 1. Update draft_orders table
ALTER TABLE public.draft_orders
DROP CONSTRAINT IF EXISTS draft_orders_plan_id_check;

ALTER TABLE public.draft_orders
ADD CONSTRAINT draft_orders_plan_id_check 
CHECK (plan_id IN ('free', 'heritage', 'legacy', 'heirloom'));

-- 2. Update orders table if it has a similar constraint
DO $$
BEGIN
  ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_plan_id_check;
  
  ALTER TABLE public.orders
  ADD CONSTRAINT orders_plan_id_check 
  CHECK (plan_id IN ('free', 'heritage', 'legacy', 'heirloom'));
EXCEPTION WHEN undefined_table THEN
  NULL; -- Table doesn't exist, skip
END $$;

-- 3. Ensure plan_tier columns accept the new values
DO $$
BEGIN
  ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;
  
  ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_tier_check 
  CHECK (plan_tier IN ('free', 'heritage', 'legacy', 'heirloom'));
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL; -- Table or column doesn't exist, skip
END $$;

-- Verify the constraints were updated
SELECT table_name, constraint_name 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND constraint_type = 'CHECK'
AND constraint_name LIKE '%plan%';
