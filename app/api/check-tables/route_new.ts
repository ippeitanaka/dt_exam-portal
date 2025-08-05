import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // test_scoresテーブルの列を確認
    const { data, error } = await supabase
      .from('test_scores')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }

    // データが存在する場合は列名を確認
    const columns = data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({ 
      success: true, 
      message: 'Table schema checked',
      columns: columns,
      hasData: data.length > 0,
      sampleData: data.length > 0 ? data[0] : null
    })

  } catch (error) {
    console.error('Error checking table schema:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
