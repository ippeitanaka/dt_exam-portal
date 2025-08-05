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

    // 1. studentsテーブルのデータ確認
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5)

    if (studentsError) {
      return NextResponse.json({ 
        success: false, 
        error: `学生データ確認エラー: ${studentsError.message}`
      }, { status: 500 })
    }

    // 2. 学生データが不足している場合は作成
    if (!students || students.length === 0) {
      const studentData = [
        {
          student_id: 'ST001',
          name: '田中太郎',
          email: 'tanaka@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          student_id: 'ST002',
          name: '佐藤花子',
          email: 'sato@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const { data: insertedStudents, error: insertStudentsError } = await supabase
        .from('students')
        .insert(studentData)
        .select()

      if (insertStudentsError) {
        return NextResponse.json({ 
          success: false, 
          error: `学生データ挿入エラー: ${insertStudentsError.message}`
        }, { status: 500 })
      }
    }

    // 3. test_scoresに希望の構造でサンプルデータを挿入
    const testScoresData = [
      {
        student_id: 'ST001',
        name: '田中太郎',
        test_name: '分野別構造テスト',
        test_date: '2025-08-05',
        total_score: 350,
        section_kanri: 45,    // 管理
        section_kaibou: 42,   // 解剖
        section_gakkou: 38,   // 顎口
        section_rikou: 40,    // 理工
        section_yushou: 47,   // 有床
        section_shikan: 44,   // 歯冠
        section_kyousei: 46,  // 矯正
        section_shouni: 48,   // 小児
        max_score: 400
      },
      {
        student_id: 'ST002',
        name: '佐藤花子',
        test_name: '分野別構造テスト',
        test_date: '2025-08-05',
        total_score: 320,
        section_kanri: 40,    // 管理
        section_kaibou: 38,   // 解剖
        section_gakkou: 35,   // 顎口
        section_rikou: 42,    // 理工
        section_yushou: 43,   // 有床
        section_shikan: 41,   // 歯冠
        section_kyousei: 40,  // 矯正
        section_shouni: 41,   // 小児
        max_score: 400
      }
    ]

    const { data: insertedScores, error: insertScoresError } = await supabase
      .from('test_scores')
      .insert(testScoresData)
      .select()

    if (insertScoresError) {
      return NextResponse.json({ 
        success: false, 
        error: `成績データ挿入エラー: ${insertScoresError.message}`,
        students_count: students?.length || 0,
        existing_students: students
      }, { status: 500 })
    }

    // 4. 希望の順序で結果を確認
    const { data: orderedResults, error: orderedError } = await supabase
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
      .order('test_date', { ascending: false })

    return NextResponse.json({ 
      success: true,
      message: '学生データと成績データを正常に作成しました',
      students_count: students?.length || 0,
      scores_inserted: insertedScores?.length || 0,
      ordered_results: orderedResults,
      column_order: [
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
      ]
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
