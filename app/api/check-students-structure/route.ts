import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check students table structure
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(3)

    return NextResponse.json({
      success: true,
      students_sample: studentsData,
      students_error: studentsError?.message || null,
    })
  } catch (error) {
    console.error("Check students structure error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check students table structure",
      },
      { status: 500 }
    )
  }
}
