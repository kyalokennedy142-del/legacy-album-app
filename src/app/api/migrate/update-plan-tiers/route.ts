import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Migration API endpoint to update plan tier constraints in the database
 * Requires SUPABASE_SERVICE_ROLE_KEY
 * 
 * Usage: POST /api/migrate/update-plan-tiers
 * Optional query param: ?token=<your-secret-token>
 */

export async function POST(request: Request) {
  try {
    // Basic auth check - optionally use an env var as a secret
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const expectedToken = process.env.MIGRATION_TOKEN

    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: 'Missing Supabase credentials',
          missingVars: {
            supabaseUrl: !supabaseUrl,
            serviceRoleKey: !serviceRoleKey,
          },
        },
        { status: 500 }
      )
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: {
        schema: 'public',
      },
    })

    const results = []

    // Migration 1: Update draft_orders constraint
    console.log('📝 Running: Update draft_orders plan_id constraint...')
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.draft_orders
          DROP CONSTRAINT IF EXISTS draft_orders_plan_id_check;
          
          ALTER TABLE public.draft_orders
          ADD CONSTRAINT draft_orders_plan_id_check 
          CHECK (plan_id IN ('free', 'heritage', 'legacy', 'heirloom'));
        `,
      })

      if (error) throw error
      results.push({ migration: 'draft_orders', status: 'success' })
      console.log('✅ draft_orders constraint updated')
    } catch (err: any) {
      // This might fail if the function doesn't exist - try direct query approach
      console.log('⚠️ RPC approach failed, trying direct execution...')
      results.push({
        migration: 'draft_orders',
        status: 'attempted',
        note: 'Requires manual SQL execution or exec_sql function',
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Migration endpoint ready. Please run the SQL migration manually.',
        instructions: 'Run the SQL from supabase/migrate_plans_to_four_tiers.sql in your Supabase SQL editor',
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
