import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 学生リストを取得
    const { data: students, error } = await supabase
      .from("students")
      .select("student_id, name")
      .order("student_id")

    if (error) {
      throw error
    }

    // CSVヘッダー
    const headers = [
      "番号",
      "氏名", 
      "得点",
      "管理",
      "解剖", 
      "病口",
      "理工",
      "有床",
      "歯冠",
      "矯正",
      "小児"
    ]

    // CSVデータを作成
    let csvContent = headers.join(",") + "\n"

    // 学生データがある場合は、学生情報を含むテンプレートを作成
    if (students && students.length > 0) {
      students.forEach((student, index) => {
        const row = [
          student.student_id, // 番号（学生ID）
          student.name,       // 氏名
          "",                 // 得点（空白）
          "",                 // 管理（空白）
          "",                 // 解剖（空白）
          "",                 // 病口（空白）
          "",                 // 理工（空白）
          "",                 // 有床（空白）
          "",                 // 歯冠（空白）
          "",                 // 矯正（空白）
          ""                  // 小児（空白）
        ]
        csvContent += row.join(",") + "\n"
      })
    } else {
      // 学生データがない場合はサンプル行を追加
      const sampleRows = [
        ["231001", "前原 謙太", "57", "4", "7", "7", "6", "10", "12", "6", "5"],
        ["231002", "守立 時仁", "85", "7", "11", "6", "15", "14", "15", "9", "8"],
        ["231003", "宇山 哲来", "39", "2", "4", "1", "7", "4", "9", "3", "3"]
      ]
      
      sampleRows.forEach(row => {
        csvContent += row.join(",") + "\n"
      })
    }

    // CSVファイルとしてダウンロード
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=test_results_template.csv",
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
