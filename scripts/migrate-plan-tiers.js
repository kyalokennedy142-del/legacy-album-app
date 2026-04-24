#!/usr/bin/env node
/**
 * Database Migration Script - Update Plan Tier Constraints
 * Run with: node scripts/migrate-plan-tiers.js
 */

const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing environment variables');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ Set' : '✗ Missing');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const migrations = [
    {
      name: 'Update draft_orders plan_id constraint',
      sql: `
        ALTER TABLE public.draft_orders
        DROP CONSTRAINT IF EXISTS draft_orders_plan_id_check;
        
        ALTER TABLE public.draft_orders
        ADD CONSTRAINT draft_orders_plan_id_check 
        CHECK (plan_id IN ('free', 'heritage', 'legacy', 'heirloom'));
      `
    },
    {
      name: 'Update orders plan_id constraint',
      sql: `
        DO $$
        BEGIN
          ALTER TABLE public.orders
          DROP CONSTRAINT IF EXISTS orders_plan_id_check;
          
          ALTER TABLE public.orders
          ADD CONSTRAINT orders_plan_id_check 
          CHECK (plan_id IN ('free', 'heritage', 'legacy', 'heirloom'));
        EXCEPTION WHEN undefined_table THEN
          RAISE NOTICE 'Table public.orders does not exist, skipping...';
        END $$;
      `
    },
    {
      name: 'Update profiles plan_tier constraint',
      sql: `
        DO $$
        BEGIN
          ALTER TABLE public.profiles
          DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;
          
          ALTER TABLE public.profiles
          ADD CONSTRAINT profiles_plan_tier_check 
          CHECK (plan_tier IN ('free', 'heritage', 'legacy', 'heirloom'));
        EXCEPTION WHEN undefined_table OR undefined_column THEN
          RAISE NOTICE 'Table/column not found, skipping...';
        END $$;
      `
    }
  ];

  console.log('📝 Running migrations...\n');

  for (const migration of migrations) {
    console.log(`⏳ ${migration.name}...`);
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: migration.sql }).catch(() => {
        // Fallback: use raw query
        return supabase.from('_sql').insert({ sql: migration.sql }).catch(e => ({ error: e }));
      });

      if (error) {
        console.error(`   ❌ Failed:`, error.message);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
    }
  }

  console.log('\n✨ Migration complete!');
}

runMigration().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
