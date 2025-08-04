import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// 管理者用のSupabaseクライアント（RLSをバイパス）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  console.log("CSVインポートAPI開始")
  
  try {
    // 管理者権限でデータ操作
    const formData = await request.formData()
    const csvFile = formData.get("file") as File
    const testName = formData.get("testName") as string
    const testDate = formData.get("testDate") as string

    console.log("パラメータ:", { 
      fileName: csvFile?.name, 
      testName, 
      testDate,
      fileSize: csvFile?.size 
    })

    if (!csvFile || !testName || !testDate) {
      console.log("パラメータ不足エラー")
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    // CSVファイルをテキストとして読み込む
    const text = await csvFile.text()
    console.log("CSVテキスト長:", text.length)
    console.log("CSVテキスト先頭100文字:", text.substring(0, 100))
    
    const rows = text.split("\n")
    console.log("CSV行数:", rows.length)

    if (rows.length < 2) {
      console.log("データ不足エラー")
      return NextResponse.json({ error: "CSVファイルにデータがありません" }, { status: 400 })
    }

    // ヘッダー行を確認
    const headers = rows[0].split(",").map((h) => h.trim())
    console.log("CSVヘッダー:", headers)

    const results = []
    const errors = []
    const batchData = []

    // ヘッダー行をスキップしてデータを処理
    console.log(`データ行数: ${rows.length - 1}`)
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue

      try {
        console.log(`行 ${i + 1} 処理中: ${row}`)
        
        // カンマで分割
        const columns = row.split(",").map((col) => col.trim())
        console.log(`行 ${i + 1} 列数: ${columns.length}, データ: ${columns}`)

        if (columns.length < 3) {
          errors.push(`行 ${i + 1}: 列が不足しています (${columns.length} 列、最低3列必要)`)
          continue
        }

        // データを抽出（シンプル版）
        const studentId = columns[0]  // 番号（学生ID）
        const name = columns[1]       // 氏名
        const totalScore = parseFloat(columns[2]) || 0  // 得点

        // 個別科目得点（ある場合のみ）
        const subject1 = parseFloat(columns[3]) || 0   // 科目1
        const subject2 = parseFloat(columns[4]) || 0   // 科目2
        const subject3 = parseFloat(columns[5]) || 0   // 科目3
        const subject4 = parseFloat(columns[6]) || 0   // 科目4
        const subject5 = parseFloat(columns[7]) || 0   // 科目5

        console.log(`行 ${i + 1} パースされたデータ: ID=${studentId}, 氏名=${name}, 総合得点=${totalScore}`)

        if (!studentId || !name) {
          errors.push(`行 ${i + 1}: 学生IDまたは氏名が不足しています`)
          continue
        }

        // 学生がstudentsテーブルに存在するか確認
        console.log(`学生ID ${studentId} の存在確認中...`)
        const { data: studentExists, error: studentError } = await supabaseAdmin
          .from("students")
          .select("student_id")
          .eq("student_id", studentId)
          .single()

        console.log(`学生存在確認結果: ${studentExists ? 'あり' : 'なし'}`)
        if (studentError) {
          console.log(`学生確認エラー: ${studentError.message}`)
        }

        if (studentError && studentError.code !== "PGRST116") {
          errors.push(`行 ${i + 1}: 学生データの確認でエラーが発生しました: ${studentError.message}`)
          continue
        }

        if (!studentExists) {
          // 学生が存在しない場合は作成
          console.log(`学生ID ${studentId} を新規作成中...`)
          const { error: createStudentError } = await supabaseAdmin
            .from("students")
            .insert({
              student_id: studentId,
              name: name,
              password: studentId // デフォルトパスワードは学生ID
            })

          if (createStudentError) {
            console.log(`学生作成エラー: ${createStudentError.message}`)
            errors.push(`行 ${i + 1}: 学生データの作成に失敗しました: ${createStudentError.message}`)
            continue
          }
          console.log(`学生ID ${studentId} の作成完了`)
        }

        // シンプルなデータ構造でバッチ処理用のデータを追加
        const recordData = {
          student_id: studentId,
          name: name,
          test_name: testName,
          test_date: testDate,
          section_a: subject1,  // 科目1
          section_b: subject2,  // 科目2
          section_c: subject3,  // 科目3
          section_d: subject4,  // 科目4
          section_ad: subject5, // 科目5
          section_bc: 0,        // 未使用
          total_score: totalScore,
          max_score: 400 // デフォルト満点
        }
        
        console.log(`バッチデータ追加: ${JSON.stringify(recordData)}`)
        batchData.push(recordData)
      } catch (err) {
        console.error(`行 ${i + 1} の例外:`, err)
        errors.push(`行 ${i + 1}: ${err instanceof Error ? err.message : "不明なエラー"}`)
      }
    }

    // バッチデータがある場合は一括挿入
    console.log(`バッチデータ数: ${batchData.length}`)
    
    if (batchData.length > 0) {
      try {
        // 既存レコードをチェック
        console.log("既存レコードのチェック開始...")
        const existingRecords = []
        const newRecords = []

        for (const record of batchData) {
          console.log(`重複チェック: 学生ID=${record.student_id}, テスト=${record.test_name}, 日付=${record.test_date}`)
          
          const { data: existingData, error: checkError } = await supabaseAdmin
            .from("test_scores")
            .select("id")
            .eq("student_id", record.student_id)
            .eq("test_name", record.test_name)
            .eq("test_date", record.test_date)
            .single()

          if (checkError && checkError.code !== "PGRST116") {
            console.log(`重複チェックエラー: ${checkError.message}`)
            errors.push(`学生ID ${record.student_id} の重複チェックでエラー: ${checkError.message}`)
            continue
          }

          if (existingData) {
            console.log(`既存レコード発見: ${existingData.id}`)
            existingRecords.push(record)
          } else {
            console.log(`新規レコード: ${record.student_id}`)
            newRecords.push(record)
          }
        }

        console.log(`新規レコード数: ${newRecords.length}, 既存レコード数: ${existingRecords.length}`)

        // 新しいレコードのみ挿入
        if (newRecords.length > 0) {
          console.log("データベースに挿入開始...")
          console.log("挿入データ:", JSON.stringify(newRecords, null, 2))
          
          const { data, error } = await supabaseAdmin.from("test_scores").insert(newRecords).select()

          if (error) {
            console.error("バッチ挿入エラー:", error)
            return NextResponse.json(
              {
                error: "テスト結果の挿入に失敗しました",
                details: error.message,
                code: error.code,
                hint: error.hint,
              },
              { status: 500 }
            )
          }

          console.log("挿入成功:", data)

          // 成功した結果を追加
          for (const item of data) {
            results.push({
              studentId: item.student_id,
              name: item.name,
              resultId: item.id,
            })
          }
        }

        // 既存レコードがあった場合は警告を追加
        if (existingRecords.length > 0) {
          for (const record of existingRecords) {
            errors.push(
              `学生ID ${record.student_id} のテスト「${record.test_name}」(${record.test_date}) は既に存在するためスキップされました`
            )
          }
        }
      } catch (insertError) {
        console.error("挿入処理エラー:", insertError)
        return NextResponse.json(
          {
            error: "データベースの挿入処理でエラーが発生しました",
            details: insertError instanceof Error ? insertError.message : "不明なエラー",
          },
          { status: 500 }
        )
      }
    }

    // レスポンスを返す
    console.log(`処理完了 - 成功: ${results.length}件, エラー: ${errors.length}件`)
    
    const response = {
      success: true,
      message: `${results.length} 件のテスト結果をインポートしました`,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: batchData.length,
        imported: results.length,
        skipped: batchData.length - results.length,
      },
    }
    
    console.log("最終レスポンス:", JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error("インポートエラー:", error)
    return NextResponse.json(
      {
        error: "テスト結果のインポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
