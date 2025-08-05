import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Service role key を使用してRLSをバイパス
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id") || "221017"

    console.log("Testing with admin/service role for student:", studentId)

    // 1. Admin access to test_scores
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)

    // 2. Get all test_scores (limited)
    const { data: allData, error: allError } = await supabaseAdmin
      .from("test_scores")
      .select("*")
      .limit(10)

    // 3. Check RLS policies
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from("pg_policies")
      .select("*")
      .eq("tablename", "test_scores")

    // 4. Check table structure
    let columns = null
    let columnsError = null
    try {
      const result = await supabaseAdmin.rpc('get_table_columns', { table_name: 'test_scores' })
      columns = result.data
      columnsError = result.error
    } catch (e) {
      columnsError = "RPC not available"
    }

    return NextResponse.json({
      success: true,
      studentId,
      adminAccess: {
        specificStudent: {
          data: adminData,
          error: adminError,
          count: adminData?.length || 0
        },
        allRecords: {
          data: allData,
          error: allError,
          count: allData?.length || 0
        }
      },
      rlsPolicies: {
        data: policies,
        error: policiesError
      },
      tableStructure: {
        data: columns,
        error: columnsError
      }
    })

  } catch (error) {
    console.error("Admin access test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
