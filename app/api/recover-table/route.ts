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

    // 1. バックアップテーブルの存在確認
    let backupExists = false
    try {
      const { data: backupData, error: backupError } = await supabase
        .from('test_scores_backup')
        .select('*')
        .limit(1)
      
      if (!backupError) {
        backupExists = true
      }
    } catch (error) {
      console.log('Backup table does not exist')
    }

    // 2. メインテーブルのデータ確認
    let mainTableData = []
    let mainTableError = null
    try {
      const { data, error } = await supabase
        .from('test_scores')
        .select('*')
        .limit(5)
      
      mainTableData = data || []
      mainTableError = error?.message || null
    } catch (error) {
      mainTableError = error instanceof Error ? error.message : String(error)
    }

    // 3. メインテーブルが空の場合、サンプルデータを再挿入
    if (mainTableData.length === 0 && !mainTableError) {
      console.log('Main table is empty, inserting sample data...')
      
      const sampleData = [
        {
          student_id: 'ST001',
          name: '田中太郎',
          test_name: 'テーブル構造テスト',
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
          max_score: 400,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          student_id: 'ST002',
          name: '佐藤花子',
          test_name: 'テーブル構造テスト',
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
          max_score: 400,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const { data: insertData, error: insertError } = await supabase
        .from('test_scores')
        .insert(sampleData)
        .select()

      if (insertError) {
        return NextResponse.json({ 
          success: false, 
          error: `データ挿入エラー: ${insertError.message}`,
          backup_exists: backupExists,
          main_table_status: 'empty',
          attempted_recovery: true
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'サンプルデータを挿入しました',
        backup_exists: backupExists,
        main_table_status: 'recovered',
        inserted_count: insertData?.length || 0,
        sample_data: insertData
      })
    }

    // 4. テーブルの現在の状態を返す
    const columns = mainTableData.length > 0 ? Object.keys(mainTableData[0]) : []
    
    return NextResponse.json({ 
      success: true,
      backup_exists: backupExists,
      main_table_status: mainTableData.length > 0 ? 'has_data' : 'empty',
      main_table_error: mainTableError,
      data_count: mainTableData.length,
      columns: columns,
      sample_data: mainTableData
    })

  } catch (error) {
    console.error('Recovery check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
