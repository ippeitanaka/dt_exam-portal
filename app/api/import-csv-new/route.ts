import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const formData = await request.formData()
    const csvFile = formData.get("file") as File
    const testName = formData.get("testName") as string
    const testDate = formData.get("testDate") as string

    if (!csvFile || !testName || !testDate) {
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    // CSVファイルをテキストとして読み込む
    const text = await csvFile.text()
    const rows = text.split("\n")

    if (rows.length < 2) {
      return NextResponse.json({ error: "CSVファイルにデータがありません" }, { status: 400 })
    }

    // ヘッダー行を確認
    const headers = rows[0].split(",").map((h) => h.trim())
    console.log("CSVヘッダー:", headers)

    const results = []
    const errors = []
    const batchData = []

    // ヘッダー行をスキップしてデータを処理
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue

      try {
        // カンマで分割
        const columns = row.split(",").map((col) => col.trim())

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

        if (!studentId || !name) {
          errors.push(`行 ${i + 1}: 学生IDまたは氏名が不足しています`)
          continue
        }

        // 学生がstudentsテーブルに存在するか確認
        const { data: studentExists, error: studentError } = await supabase
          .from("students")
          .select("student_id")
          .eq("student_id", studentId)
          .single()

        if (studentError && studentError.code !== "PGRST116") {
          errors.push(`行 ${i + 1}: 学生データの確認でエラーが発生しました: ${studentError.message}`)
          continue
        }

        if (!studentExists) {
          // 学生が存在しない場合は作成
          const { error: createStudentError } = await supabase
            .from("students")
            .insert({
              student_id: studentId,
              name: name,
              password: studentId // デフォルトパスワードは学生ID
            })

          if (createStudentError) {
            errors.push(`行 ${i + 1}: 学生データの作成に失敗しました: ${createStudentError.message}`)
            continue
          }
        }

        // シンプルなデータ構造でバッチ処理用のデータを追加
        batchData.push({
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
        })
      } catch (err) {
        console.error(`行 ${i + 1} の例外:`, err)
        errors.push(`行 ${i + 1}: ${err instanceof Error ? err.message : "不明なエラー"}`)
      }
    }

    // バッチデータがある場合は一括挿入
    if (batchData.length > 0) {
      try {
        // 既存レコードをチェック
        const existingRecords = []
        const newRecords = []

        for (const record of batchData) {
          const { data: existingData, error: checkError } = await supabase
            .from("test_scores")
            .select("id")
            .eq("student_id", record.student_id)
            .eq("test_name", record.test_name)
            .eq("test_date", record.test_date)
            .single()

          if (checkError && checkError.code !== "PGRST116") {
            errors.push(`学生ID ${record.student_id} の重複チェックでエラー: ${checkError.message}`)
            continue
          }

          if (existingData) {
            existingRecords.push(record)
          } else {
            newRecords.push(record)
          }
        }

        // 新しいレコードのみ挿入
        if (newRecords.length > 0) {
          const { data, error } = await supabase.from("test_scores").insert(newRecords).select()

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
    return NextResponse.json({
      success: true,
      message: `${results.length} 件のテスト結果をインポートしました`,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: batchData.length,
        imported: results.length,
        skipped: batchData.length - results.length,
        errors: errors.length,
      },
    })
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
