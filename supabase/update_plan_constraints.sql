-- Update the draft_orders table constraint to support new plan tiers
-- Run this in your Supabase SQL Editor

-- Drop the old constraint if it exists
ALTER TABLE public.draft_orders
DROP CONSTRAINT IF EXISTS draft_orders_plan_id_check;

-- Add the new constraint with all plan tiers
ALTER TABLE public.draft_orders
ADD CONSTRAINT draft_orders_plan_id_check 
CHECK (plan_id IN ('free', 'heritage', 'legacy', 'heirloom'));
