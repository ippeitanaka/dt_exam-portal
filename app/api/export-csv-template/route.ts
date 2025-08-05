import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

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

    // 学生リストを取得
    const { data: students, error } = await supabase
      .from("students")
      .select("student_id, name")
      .order("student_id")

    if (error) {
      throw error
    }

    // 新しい分野構造のCSVヘッダー
    const headers = [
      "学生ID",
      "氏名", 
      "テスト名",
      "テスト日付",
      "総得点",
      "管理",      // 新分野1
      "解剖",      // 新分野2
      "顎口",      // 新分野3
      "理工",      // 新分野4
      "有床",      // 新分野5
      "歯冠",      // 新分野6
      "矯正",      // 新分野7
      "小児",      // 新分野8
      "満点"
    ]

    // UTF-8 BOMを追加して文字化けを防ぐ
    const BOM = '\uFEFF'
    let csvContent = BOM + headers.join(",") + "\n"

    // 学生データがある場合は、学生情報を含むテンプレートを作成
    if (students && students.length > 0) {
      students.forEach((student) => {
        const row = [
          student.student_id,     // 学生ID
          student.name,           // 氏名
          "第1回模擬試験",         // テスト名（例）
          "2025-08-05",          // テスト日付（例）
          "",                    // 総得点（空白）
          "",                    // 管理（空白）
          "",                    // 解剖（空白）
          "",                    // 顎口（空白）
          "",                    // 理工（空白）
          "",                    // 有床（空白）
          "",                    // 歯冠（空白）
          "",                    // 矯正（空白）
          "",                    // 小児（空白）
          "400"                  // 満点（例）
        ]
        csvContent += row.join(",") + "\n"
      })
    } else {
      // 学生データがない場合はサンプル行を追加
      const sampleRows = [
        ["231001", "前原 謙太", "第1回模擬試験", "2025-08-05", "350", "45", "42", "38", "40", "47", "44", "46", "48", "400"],
        ["231002", "足立 晴仁", "第1回模擬試験", "2025-08-05", "320", "40", "38", "35", "42", "43", "41", "40", "41", "400"],
        ["231003", "宇山 爾来", "第1回模擬試験", "2025-08-05", "340", "39", "42", "38", "42", "47", "46", "42", "46", "400"]
      ]
      
      sampleRows.forEach(row => {
        csvContent += row.join(",") + "\n"
      })
    }

    // CSVファイルとしてダウンロード
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"テスト結果テンプレート_新分野構造.csv\"",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    })
  } catch (error) {
    console.error("CSVテンプレートエクスポートエラー:", error)
    return NextResponse.json(
      {
        error: "CSVテンプレートのエクスポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
