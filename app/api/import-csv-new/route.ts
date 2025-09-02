import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("CSVインポートAPI開始")
  
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
    
    // フォームデータの取得
    const formData = await request.formData()
    const csvFile = formData.get("file") as File
    const testName = formData.get("testName") as string
    const testDate = formData.get("testDate") as string
    const testType = formData.get("testType") as string || '100q' // デフォルトは100問

    console.log("パラメータ:", { 
      fileName: csvFile?.name, 
      testName, 
      testDate,
      testType,
      fileSize: csvFile?.size 
    })

    if (!csvFile || !testName || !testDate) {
      console.log("パラメータ不足エラー")
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    // testTypeの検証
    if (testType !== '100q' && testType !== '80q') {
      return NextResponse.json({ error: "無効なテストタイプです" }, { status: 400 })
    }

    // CSVファイルをテキストとして読み込む（UTF-8 BOM対応）
    const arrayBuffer = await csvFile.arrayBuffer()
    let text = new TextDecoder('utf-8').decode(arrayBuffer)
    
    // BOMを削除
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.substring(1)
    }
    
    console.log("CSVテキスト長:", text.length)
    console.log("CSVテキスト先頭100文字:", text.substring(0, 100))
    
    const rows = text.split("\n").filter(row => row.trim() !== '')
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

        if (columns.length < 5) {
          errors.push(`行 ${i + 1}: 列が不足しています (${columns.length} 列、最低5列必要)`)
          continue
        }

        // 新しい分野構造でのデータ抽出
        const studentId = columns[0]      // 学生ID
        const name = columns[1]           // 氏名
        const testNameCol = columns[2]    // テスト名
        const testDateCol = columns[3]    // テスト日付
        const totalScore = parseFloat(columns[4]) || 0  // 総得点

        // 分野別得点（新構造）
        const sectionKanri = parseFloat(columns[5]) || 0     // 管理
        const sectionKaibou = parseFloat(columns[6]) || 0    // 解剖
        const sectionGakkou = parseFloat(columns[7]) || 0    // 顎口
        const sectionRikou = parseFloat(columns[8]) || 0     // 理工
        const sectionYushou = parseFloat(columns[9]) || 0    // 有床
        const sectionShikan = parseFloat(columns[10]) || 0   // 歯冠
        const sectionKyousei = parseFloat(columns[11]) || 0  // 矯正
        const sectionShouni = parseFloat(columns[12]) || 0   // 小児
        
        // test_typeに応じてmax_scoreを設定
        const maxScore = testType === '80q' ? 80 : 100

        // テスト名と日付はパラメータを優先（CSVに含まれていても上書き）
        const finalTestName = testName || testNameCol || '未設定テスト'
        const finalTestDate = testDate || testDateCol || new Date().toISOString().split('T')[0]

        console.log(`行 ${i + 1} パースされたデータ: ID=${studentId}, 氏名=${name}, 総合得点=${totalScore}`)
        console.log(`分野別得点: 管理=${sectionKanri}, 解剖=${sectionKaibou}, 顎口=${sectionGakkou}, 理工=${sectionRikou}`)

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
          
          try {
            const { error: createStudentError } = await supabaseAdmin
              .from("students")
              .insert({
                student_id: studentId,
                name: name,
                email: `${studentId}@example.com`, // デフォルトメール
                password: studentId // デフォルトパスワードは学生ID
              })

            if (createStudentError) {
              // emailカラムが存在しない場合は、emailなしで再試行
              if (createStudentError.message.includes('email') || createStudentError.message.includes('column')) {
                console.log('emailカラムが存在しないため、emailなしで学生を作成します')
                const { error: retryError } = await supabaseAdmin
                  .from("students")
                  .insert({
                    student_id: studentId,
                    name: name,
                    password: studentId
                  })
                
                if (retryError) {
                  console.log(`学生作成エラー (retry): ${retryError.message}`)
                  errors.push(`行 ${i + 1}: 学生データの作成に失敗しました: ${retryError.message}`)
                  continue
                }
              } else {
                console.log(`学生作成エラー: ${createStudentError.message}`)
                errors.push(`行 ${i + 1}: 学生データの作成に失敗しました: ${createStudentError.message}`)
                continue
              }
            }
            console.log(`学生ID ${studentId} の作成完了`)
          } catch (studentCreateError) {
            console.log(`学生作成例外: ${studentCreateError}`)
            errors.push(`行 ${i + 1}: 学生データの作成で例外が発生しました`)
            continue
          }
        }

        // 新しい分野構造でのデータを追加
        const recordData = {
          student_id: studentId,
          name: name,
          test_name: finalTestName,
          test_date: finalTestDate,
          test_type: testType, // テストタイプを追加
          section_kanri: sectionKanri,      // 管理
          section_kaibou: sectionKaibou,    // 解剖
          section_gakkou: sectionGakkou,    // 顎口
          section_rikou: sectionRikou,      // 理工
          section_yushou: sectionYushou,    // 有床
          section_shikan: sectionShikan,    // 歯冠
          section_kyousei: sectionKyousei,  // 矯正
          section_shouni: sectionShouni,    // 小児
          total_score: totalScore,
          max_score: maxScore
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
          
          try {
            const { data, error } = await supabaseAdmin.from("test_scores").insert(newRecords).select()

            if (error) {
              console.error("バッチ挿入エラー:", error)
              
              // 分野カラムが存在しない場合のフォールバック処理
              if (error.message.includes('section_') || error.message.includes('column')) {
                console.log("分野別カラムが存在しない可能性があります。基本データのみで再試行...")
                
                const basicRecords = newRecords.map(record => ({
                  student_id: record.student_id,
                  name: record.name,
                  test_name: record.test_name,
                  test_date: record.test_date,
                  total_score: record.total_score,
                  max_score: record.max_score
                }))
                
                const { data: basicData, error: basicError } = await supabaseAdmin
                  .from("test_scores")
                  .insert(basicRecords)
                  .select()
                
                if (basicError) {
                  console.error("基本データ挿入エラー:", basicError)
                  return NextResponse.json(
                    {
                      error: "テスト結果の挿入に失敗しました（基本データ）",
                      details: basicError.message,
                      code: basicError.code,
                      hint: "データベースのテーブル構造を確認してください",
                    },
                    { status: 500 }
                  )
                }
                
                console.log("基本データ挿入成功:", basicData)
                
                // 成功した結果を追加
                for (const item of basicData) {
                  results.push({
                    studentId: item.student_id,
                    name: item.name,
                    resultId: item.id,
                  })
                }
                
                errors.push("注意: 分野別得点カラムが存在しないため、基本データ（総得点のみ）で登録されました。")
              } else {
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
            } else {
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
          } catch (insertError) {
            console.error("挿入処理例外:", insertError)
            return NextResponse.json(
              {
                error: "データベースの挿入処理で例外が発生しました",
                details: insertError instanceof Error ? insertError.message : "不明なエラー",
              },
              { status: 500 }
            )
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
