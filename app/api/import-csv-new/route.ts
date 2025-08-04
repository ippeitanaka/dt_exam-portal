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

        if (columns.length < 11) {
          errors.push(`行 ${i + 1}: 列が不足しています (${columns.length} 列、11列必要)`)
          continue
        }

        // データを抽出
        const studentId = columns[0]  // 番号（学生ID）
        const name = columns[1]       // 氏名
        const totalScore = parseFloat(columns[2]) || 0  // 得点
        const management = parseFloat(columns[3]) || 0  // 管理
        const anatomy = parseFloat(columns[4]) || 0     // 解剖
        const oralPathology = parseFloat(columns[5]) || 0 // 病口
        const technology = parseFloat(columns[6]) || 0  // 理工
        const removable = parseFloat(columns[7]) || 0   // 有床
        const crown = parseFloat(columns[8]) || 0       // 歯冠
        const orthodontics = parseFloat(columns[9]) || 0 // 矯正
        const pediatric = parseFloat(columns[10]) || 0  // 小児

        if (!studentId || !name) {
          errors.push(`行 ${i + 1}: 学生IDまたは氏名が不足しています`)
          continue
        }

        // セクション別得点の計算
        // section_a: 一般問題（管理 + 解剖 + 理工 + 歯冠）
        const sectionA = management + anatomy + technology + crown
        
        // section_b: 必修問題（病口）
        const sectionB = oralPathology
        
        // section_c: 必修症例問題（有床）
        const sectionC = removable
        
        // section_d: 一般症例問題（矯正 + 小児）
        const sectionD = orthodontics + pediatric
        
        // section_ad: 一般合計（A + D）
        const sectionAD = sectionA + sectionD
        
        // section_bc: 必修合計（B + C）
        const sectionBC = sectionB + sectionC

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

        // バッチ処理用のデータを追加
        batchData.push({
          student_id: studentId,
          name: name,
          test_name: testName,
          test_date: testDate,
          section_a: sectionA,
          section_b: sectionB,
          section_c: sectionC,
          section_d: sectionD,
          section_ad: sectionAD,
          section_bc: sectionBC,
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
