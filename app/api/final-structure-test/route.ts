import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. 既存の学生データを取得
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('student_id, name')
      .limit(5)

    if (studentsError || !students || students.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '学生データが見つかりません'
      }, { status: 500 })
    }

    // 2. 既存の学生IDを使用してtest_scoresに希望の構造でデータを挿入
    const testScoresData = students.map((student, index) => ({
      student_id: student.student_id,
      name: student.name,
      test_name: '分野別構造確認テスト',
      test_date: '2025-08-05',
      total_score: 300 + (index * 20), // バリエーションを付けるため
      section_kanri: 35 + (index * 2),    // 管理
      section_kaibou: 40 + (index * 1),   // 解剖
      section_gakkou: 32 + (index * 3),   // 顎口
      section_rikou: 38 + (index * 2),    // 理工
      section_yushou: 45 + (index * 1),   // 有床
      section_shikan: 42 + (index * 2),   // 歯冠
      section_kyousei: 36 + (index * 3),  // 矯正
      section_shouni: 44 + (index * 1),   // 小児
      max_score: 400
    }))

    const { data: insertedScores, error: insertScoresError } = await supabase
      .from('test_scores')
      .insert(testScoresData)
      .select()

    if (insertScoresError) {
      return NextResponse.json({ 
        success: false, 
        error: `成績データ挿入エラー: ${insertScoresError.message}`,
        attempted_data: testScoresData
      }, { status: 500 })
    }

    // 3. 希望の順序で結果を確認表示
    const { data: finalResults, error: finalError } = await supabase
      .from('test_scores')
      .select(`
        student_id,
        name,
        total_score,
        section_kanri,
        section_kaibou,
        section_gakkou,
        section_rikou,
        section_yushou,
        section_shikan,
        section_kyousei,
        section_shouni,
        test_name,
        test_date
      `)
      .eq('test_name', '分野別構造確認テスト')
      .order('total_score', { ascending: false })

    if (finalError) {
      return NextResponse.json({ 
        success: false, 
        error: `結果取得エラー: ${finalError.message}`
      }, { status: 500 })
    }

    // 4. カラムの存在確認
    const columnCheck = finalResults && finalResults.length > 0 ? Object.keys(finalResults[0]) : []
    const requiredColumns = [
      'student_id', 'name', 'total_score', 'section_kanri', 'section_kaibou',
      'section_gakkou', 'section_rikou', 'section_yushou', 'section_shikan',
      'section_kyousei', 'section_shouni'
    ]
    const missingColumns = requiredColumns.filter(col => !columnCheck.includes(col))

    return NextResponse.json({ 
      success: true,
      message: '希望の構造でテストデータを作成しました',
      inserted_count: insertedScores?.length || 0,
      table_structure_correct: missingColumns.length === 0,
      missing_columns: missingColumns,
      column_order_confirmed: [
        'student_id (学生ID)',
        'name (氏名)', 
        'total_score (総得点)',
        'section_kanri (管理)',
        'section_kaibou (解剖)',
        'section_gakkou (顎口)',
        'section_rikou (理工)',
        'section_yushou (有床)',
        'section_shikan (歯冠)',
        'section_kyousei (矯正)',
        'section_shouni (小児)'
      ],
      sample_data: finalResults
    })

  } catch (error) {
    console.error('Final setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
