import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// 管理者用のSupabaseクライアント（RLSをバイパス）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  console.log("テストAPI開始")
  
  try {
    // 管理者権限でテスト
    console.log("Supabase接続テスト開始...")
    
    // test_scoresテーブルの存在確認
    const { count: testCount, error: testError } = await supabaseAdmin
      .from("test_scores")
      .select("*", { count: "exact", head: true })
    
    console.log("test_scores確認結果:", testCount, testError)
    
    // studentsテーブルの存在確認
    const { count: studentCount, error: studentError } = await supabaseAdmin
      .from("students")
      .select("*", { count: "exact", head: true })
    
    console.log("students確認結果:", studentCount, studentError)
    
    return NextResponse.json({
      success: true,
      message: "テスト完了",
      tables: {
        test_scores: { count: testCount, error: testError?.message },
        students: { count: studentCount, error: studentError?.message }
      }
    })
    
  } catch (error) {
    console.error("テストAPI エラー:", error)
    return NextResponse.json(
      {
        error: "テストAPIでエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log("最小CSVインポートAPI開始")
  
  try {
    // 管理者権限でテスト
    const formData = await request.formData()
    const csvFile = formData.get("file") as File
    const testName = formData.get("testName") as string
    const testDate = formData.get("testDate") as string

    console.log("パラメータ受信:", { 
      fileName: csvFile?.name, 
      testName, 
      testDate,
      fileSize: csvFile?.size 
    })

    if (!csvFile || !testName || !testDate) {
      console.log("パラメータ不足")
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    // CSVファイルをテキストとして読み込む
    const text = await csvFile.text()
    console.log("CSVテキスト長:", text.length)
    
    if (!text || text.trim().length === 0) {
      console.log("CSVファイルが空です")
      return NextResponse.json({ error: "CSVファイルが空です" }, { status: 400 })
    }

    // 最小限のCSV処理 - 1行だけテスト
    const lines = text.split('\n').filter(line => line.trim())
    console.log("CSVライン数:", lines.length)
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSVデータが不足しています" }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const firstDataLine = lines[1].split(',').map(d => d.trim())
    
    console.log("ヘッダー:", headers)
    console.log("最初のデータ行:", firstDataLine)
    
    // 最小限のテストデータで挿入テスト
    const testRecord = {
      student_id: firstDataLine[0] || "TEST001",
      name: firstDataLine[1] || "テストユーザー",
      test_name: testName,
      test_date: testDate,
      section_a: parseFloat(firstDataLine[3]) || 0,
      section_b: parseFloat(firstDataLine[4]) || 0,
      section_c: parseFloat(firstDataLine[5]) || 0,
      section_d: parseFloat(firstDataLine[6]) || 0,
      section_ad: parseFloat(firstDataLine[7]) || 0,
      section_bc: 0,
      total_score: parseFloat(firstDataLine[2]) || 0,
      max_score: 400
    }
    
    console.log("テストレコード:", JSON.stringify(testRecord, null, 2))
    
    // 学生レコードを先に作成
    console.log("学生レコード作成/確認中...")
    const { data: existingStudent, error: checkError } = await supabaseAdmin
      .from("students")
      .select("student_id")
      .eq("student_id", testRecord.student_id)
      .single()
    
    console.log("学生確認結果:", existingStudent, checkError?.message)
    
    if (!existingStudent) {
      console.log("学生レコード新規作成中...")
      const { error: createStudentError } = await supabaseAdmin
        .from("students")
        .insert({
          student_id: testRecord.student_id,
          name: testRecord.name,
          password: testRecord.student_id
        })
      
      if (createStudentError) {
        console.error("学生作成エラー:", createStudentError)
        return NextResponse.json(
          { 
            error: "学生レコードの作成に失敗しました", 
            details: createStudentError.message 
          }, 
          { status: 500 }
        )
      }
      console.log("学生レコード作成完了")
    }
    
    // テストスコア挿入
    console.log("テストスコア挿入中...")
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("test_scores")
      .insert(testRecord)
      .select()
      .single()
    
    console.log("挿入結果:", insertedData, insertError?.message)
    
    if (insertError) {
      console.error("テストスコア挿入エラー:", insertError)
      return NextResponse.json(
        {
          error: "テストスコアの挿入に失敗しました",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "テストインポート完了",
      result: insertedData,
      debug: {
        csvLines: lines.length,
        headers: headers,
        testRecord: testRecord
      }
    })

  } catch (error) {
    console.error("最小インポートエラー:", error)
    return NextResponse.json(
      {
        error: "インポート処理でエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
