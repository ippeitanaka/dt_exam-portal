import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // test_scoresテーブルの現在の構造を確認
    const { data: existingData, error: selectError } = await supabase
      .from('test_scores')
      .select('*')
      .limit(1)

    if (selectError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check table structure',
        details: selectError.message
      }, { status: 500 })
    }

    // 分野別列の存在確認
    const hasCorrectStructure = existingData.length === 0 || (
      'section_a' in existingData[0] &&
      'section_b' in existingData[0] &&
      'section_c' in existingData[0] &&
      'section_d' in existingData[0] &&
      'section_ad' in existingData[0] &&
      'section_bc' in existingData[0] &&
      'name' in existingData[0]
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Table structure checked',
      hasData: existingData.length > 0,
      hasCorrectStructure,
      columns: existingData.length > 0 ? Object.keys(existingData[0]) : [],
      needsUpdate: !hasCorrectStructure
    })

  } catch (error) {
    console.error('Error checking table structure:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
