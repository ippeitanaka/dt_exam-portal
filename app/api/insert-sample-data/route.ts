import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    // 管理者権限でSupabaseに接続（RLSをバイパス）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // まず学生データを確認
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')

    if (studentError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch students',
        details: studentError.message
      }, { status: 500 })
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No students found. Please import students first.'
      }, { status: 400 })
    }

    // サンプルテストデータを作成
    const testDate = '2025-08-04'
    const testName = 'サンプルテスト（修正版）'
    
    const sampleTestData = students.slice(0, Math.min(10, students.length)).map((student, index) => ({
      student_id: student.student_id,
      name: student.name,
      test_name: testName,
      test_date: testDate,
      section_a: Math.floor(Math.random() * 50) + 50, // 50-100点
      section_b: Math.floor(Math.random() * 50) + 50, // 50-100点
      section_c: Math.floor(Math.random() * 50) + 50, // 50-100点 
      section_d: Math.floor(Math.random() * 50) + 50, // 50-100点
      section_ad: 0, // 計算で設定
      section_bc: 0, // 計算で設定
      total_score: 0 // 計算で設定
    }))

    // A+D、B+C、総得点を計算
    sampleTestData.forEach(data => {
      data.section_ad = data.section_a + data.section_d
      data.section_bc = data.section_b + data.section_c
      data.total_score = data.section_a + data.section_b + data.section_c + data.section_d
    })

    // 管理者権限でデータを挿入
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('test_scores')
      .insert(sampleTestData)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to insert test data',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully inserted ${sampleTestData.length} test scores`,
      testName,
      testDate,
      studentCount: sampleTestData.length,
      insertedData
    })

  } catch (error) {
    console.error('Error inserting sample data:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
