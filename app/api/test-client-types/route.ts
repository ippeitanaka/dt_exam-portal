import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id") || "221017"

    console.log("Testing different Supabase client types for student:", studentId)

    // 1. Server-side client (Route Handler)
    const supabaseServer = createRouteHandlerClient({ cookies })
    const { data: serverData, error: serverError } = await supabaseServer
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)

    // 2. Client-side client (same as student dashboard uses)
    const supabaseClient = createClientComponentClient()
    const { data: clientData, error: clientError } = await supabaseClient
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)

    // 3. Test with different authentication states
    const testResults = {
      serverSide: {
        data: serverData,
        error: serverError,
        count: serverData?.length || 0
      },
      clientSide: {
        data: clientData,
        error: clientError,
        count: clientData?.length || 0
      }
    }

    // 4. Check current user/session
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()
    
    // 5. Test with anonymous access
    const { data: anonymousData, error: anonymousError } = await supabaseServer
      .from("test_scores")
      .select("*")
      .limit(5)

    return NextResponse.json({
      success: true,
      studentId,
      testResults,
      currentUser: {
        user: user ? { id: user.id, email: user.email } : null,
        error: userError
      },
      anonymousAccess: {
        data: anonymousData,
        error: anonymousError,
        count: anonymousData?.length || 0
      }
    })

  } catch (error) {
    console.error("Client comparison error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
