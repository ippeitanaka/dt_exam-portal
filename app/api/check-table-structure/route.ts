import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. まずテーブル構造を確認
    const { data: sampleData, error: sampleError } = await supabase
      .from('test_scores')
      .select('*')
      .limit(1)

    if (sampleError) {
      return NextResponse.json({ 
        success: false, 
        error: sampleError.message 
      }, { status: 500 })
    }

    const columns = sampleData && sampleData.length > 0 
      ? Object.keys(sampleData[0])
      : []

    // 2. 希望の順序をチェック
    const desiredOrder = [
      'student_id',     // 学生ID
      'name',           // 氏名
      'total_score',    // 総得点
      'section_kanri',  // 管理
      'section_kaibou', // 解剖
      'section_gakkou', // 顎口
      'section_rikou',  // 理工
      'section_yushou', // 有床
      'section_shikan', // 歯冠
      'section_kyousei',// 矯正
      'section_shouni'  // 小児
    ]

    // 3. 実際のデータサンプルを取得（希望の順序で）
    const { data: orderedData, error: orderedError } = await supabase
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
      .limit(5)

    const missingColumns = desiredOrder.filter(col => !columns.includes(col))
    const hasAllDesiredColumns = missingColumns.length === 0

    return NextResponse.json({ 
      success: true,
      table_name: 'test_scores',
      all_columns: columns,
      desired_columns_present: hasAllDesiredColumns,
      missing_columns: missingColumns,
      sample_data: orderedData || [],
      sample_data_error: orderedError?.message || null,
      column_analysis: {
        total_columns: columns.length,
        has_student_id: columns.includes('student_id'),
        has_name: columns.includes('name'),
        has_total_score: columns.includes('total_score'),
        has_section_kanri: columns.includes('section_kanri'),
        has_section_kaibou: columns.includes('section_kaibou'),
        has_section_gakkou: columns.includes('section_gakkou'),
        has_section_rikou: columns.includes('section_rikou'),
        has_section_yushou: columns.includes('section_yushou'),
        has_section_shikan: columns.includes('section_shikan'),
        has_section_kyousei: columns.includes('section_kyousei'),
        has_section_shouni: columns.includes('section_shouni')
      }
    })

  } catch (error) {
    console.error('Table check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
