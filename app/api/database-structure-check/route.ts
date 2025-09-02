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

    const results = {
      studentsTable: {
        exists: false,
        hasEmail: false,
        canInsert: false
      },
      testScoresTable: {
        exists: false,
        hasNewSections: false,
        hasTestType: false,
        hasName: false,
        canInsert: false
      },
      errors: [] as string[],
      warnings: [] as string[]
    }

    // studentsテーブルの構造をチェック（実際のクエリでテスト）
    try {
      // 基本構造チェック
      const { data: studentsData, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('id, student_id, name, password')
        .limit(1)

      if (studentsError) {
        results.errors.push(`studentsテーブルアクセスエラー: ${studentsError.message}`)
      } else {
        results.studentsTable.exists = true
        results.studentsTable.canInsert = true
        
        // emailカラムをチェック
        try {
          const { error: emailError } = await supabaseAdmin
            .from('students')
            .select('email')
            .limit(1)
          
          if (!emailError) {
            results.studentsTable.hasEmail = true
            console.log("✅ studentsテーブルにemailカラムが存在します")
          } else {
            results.warnings.push("studentsテーブルにemailカラムがありません")
            console.log("⚠️ studentsテーブルにemailカラムがありません")
          }
        } catch (error) {
          results.warnings.push("studentsテーブルのemailカラムチェックに失敗")
        }
      }
    } catch (error) {
      results.errors.push(`studentsテーブルチェック例外: ${error}`)
    }

    // test_scoresテーブルの構造をチェック
    try {
      // 基本構造チェック
      const { data: testScoresData, error: testScoresError } = await supabaseAdmin
        .from('test_scores')
        .select('id, student_id, test_name, test_date, total_score')
        .limit(1)

      if (testScoresError) {
        results.errors.push(`test_scoresテーブルアクセスエラー: ${testScoresError.message}`)
      } else {
        results.testScoresTable.exists = true
        results.testScoresTable.canInsert = true

        // 新しい分野カラムをチェック
        try {
          const { error: sectionsError } = await supabaseAdmin
            .from('test_scores')
            .select('section_kanri, section_kaibou, section_gakkou, section_rikou, section_yushou, section_shikan, section_kyousei, section_shouni')
            .limit(1)
          
          if (!sectionsError) {
            results.testScoresTable.hasNewSections = true
            console.log("✅ test_scoresテーブルに新分野カラムが存在します")
          } else {
            results.warnings.push("test_scoresテーブルに新分野カラムがありません")
            console.log("⚠️ test_scoresテーブルに新分野カラムがありません")
          }
        } catch (error) {
          results.warnings.push("test_scoresテーブルの新分野カラムチェックに失敗")
        }

        // test_typeカラムをチェック
        try {
          const { error: testTypeError } = await supabaseAdmin
            .from('test_scores')
            .select('test_type')
            .limit(1)
          
          if (!testTypeError) {
            results.testScoresTable.hasTestType = true
            console.log("✅ test_scoresテーブルにtest_typeカラムが存在します")
          } else {
            results.warnings.push("test_scoresテーブルにtest_typeカラムがありません")
            console.log("⚠️ test_scoresテーブルにtest_typeカラムがありません")
          }
        } catch (error) {
          results.warnings.push("test_scoresテーブルのtest_typeカラムチェックに失敗")
        }

        // nameカラムをチェック
        try {
          const { error: nameError } = await supabaseAdmin
            .from('test_scores')
            .select('name')
            .limit(1)
          
          if (!nameError) {
            results.testScoresTable.hasName = true
            console.log("✅ test_scoresテーブルにnameカラムが存在します")
          } else {
            results.warnings.push("test_scoresテーブルにnameカラムがありません")
            console.log("⚠️ test_scoresテーブルにnameカラムがありません")
          }
        } catch (error) {
          results.warnings.push("test_scoresテーブルのnameカラムチェックに失敗")
        }
      }
    } catch (error) {
      results.errors.push(`test_scoresテーブルチェック例外: ${error}`)
    }

    // 修正提案を生成
    const recommendations = []
    
    if (!results.studentsTable.hasEmail) {
      recommendations.push("学生データインポートで4列形式を使用する場合は、studentsテーブルにemailカラムが必要です")
    }
    
    if (!results.testScoresTable.hasNewSections) {
      recommendations.push("新分野構造でのテスト結果インポートには、分野別カラムが必要です")
    }

    if (!results.testScoresTable.hasTestType) {
      recommendations.push("80q/100qテスト対応には、test_typeカラムが必要です")
    }

    const canImportStudents = results.studentsTable.exists && results.studentsTable.canInsert
    const canImportTestResults = results.testScoresTable.exists && results.testScoresTable.canInsert

    return NextResponse.json({
      success: true,
      message: "データベース構造チェック完了",
      results,
      recommendations,
      canImportStudents,
      canImportTestResults,
      summary: {
        studentsTable: `${canImportStudents ? '✅ 使用可能' : '❌ 問題あり'}${results.studentsTable.hasEmail ? ' (email対応)' : ' (基本のみ)'}`,
        testScoresTable: `${canImportTestResults ? '✅ 使用可能' : '❌ 問題あり'}${results.testScoresTable.hasNewSections ? ' (新分野対応)' : ' (基本のみ)'}`
      }
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
