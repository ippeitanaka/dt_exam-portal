import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { checkAdminApiAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  // 認証チェック
  const authCheck = await checkAdminApiAuth(request as any)
  if (!authCheck.authenticated) {
    return authCheck.response
  }

  try {
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "環境変数が未設定です" },
        { status: 500 }
      )
    }

    // 管理者用のSupabaseクライアント（RLS回避）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log("データベース構造チェックを開始します...")

    // 現在のテーブル構造をチェック
    const results: {
      studentsTable: {
        columns?: any[]
        hasEmail?: boolean
      }
      testScoresTable: {
        columns?: any[]
        hasTestType?: boolean
        hasNewSections?: boolean
        hasTotalScore?: boolean
        hasName?: boolean
        missingColumns?: string[]
      }
      errors: string[]
      warnings: string[]
    } = {
      studentsTable: {},
      testScoresTable: {},
      errors: [],
      warnings: []
    }

    // studentsテーブルの構造をチェック
    try {
      const { data: studentsColumns, error: studentsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'students')

      if (studentsError) {
        results.errors.push(`studentsテーブル構造チェックエラー: ${studentsError.message}`)
      } else {
        results.studentsTable = {
          columns: studentsColumns,
          hasEmail: studentsColumns?.some(col => col.column_name === 'email') || false
        }
        
        if (!results.studentsTable.hasEmail) {
          results.warnings.push("studentsテーブルにemailカラムがありません")
        }
      }
    } catch (error) {
      results.errors.push(`studentsテーブルチェック例外: ${error}`)
    }

    // test_scoresテーブルの構造をチェック
    try {
      const { data: testScoresColumns, error: testScoresError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'test_scores')

      if (testScoresError) {
        results.errors.push(`test_scoresテーブル構造チェックエラー: ${testScoresError.message}`)
      } else {
        const columnNames = testScoresColumns?.map(col => col.column_name) || []
        results.testScoresTable = {
          columns: testScoresColumns,
          hasTestType: columnNames.includes('test_type'),
          hasNewSections: columnNames.includes('section_kanri'),
          hasTotalScore: columnNames.includes('total_score'),
          hasName: columnNames.includes('name'),
          missingColumns: []
        }

        // 必要なカラムをチェック
        const requiredColumns = [
          'test_type', 'section_kanri', 'section_kaibou', 'section_gakkou',
          'section_rikou', 'section_yushou', 'section_shikan', 'section_kyousei',
          'section_shouni', 'name', 'total_score'
        ]

        if (!results.testScoresTable.missingColumns) {
          results.testScoresTable.missingColumns = []
        }

        for (const col of requiredColumns) {
          if (!columnNames.includes(col)) {
            results.testScoresTable.missingColumns.push(col)
            results.warnings.push(`test_scoresテーブルに${col}カラムがありません`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`test_scoresテーブルチェック例外: ${error}`)
    }

    // 修正提案を生成
    const recommendations = []
    
    if (!results.studentsTable.hasEmail) {
      recommendations.push("studentsテーブルにemailカラムを追加してください")
    }
    
    if (results.testScoresTable.missingColumns && results.testScoresTable.missingColumns.length > 0) {
      recommendations.push(`test_scoresテーブルに以下のカラムを追加してください: ${results.testScoresTable.missingColumns.join(', ')}`)
    }

    return NextResponse.json({
      success: true,
      message: "データベース構造チェック完了",
      results,
      recommendations,
      canImportStudents: results.studentsTable.hasEmail !== false,
      canImportTestResults: results.testScoresTable.missingColumns?.length === 0
    })

  } catch (error) {
    console.error("データベース構造チェックエラー:", error)
    return NextResponse.json(
      {
        error: "データベース構造のチェックに失敗しました",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
