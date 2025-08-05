import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    console.log("Creating sample test score data...")

    // 学生221017用のサンプルテストスコアデータ
    const sampleScores = [
      {
        student_id: "221017",
        name: "前原 謙太",
        test_name: "第1回模擬試験",
        test_date: "2025-01-15",
        section_kanri: 4,
        section_kaibou: 7,
        section_gakkou: 7,
        section_rikou: 8,
        section_yushou: 9,
        section_shikan: 10,
        section_kyousei: 6,
        section_shouni: 6,
        total_score: 57
      },
      {
        student_id: "221017",
        name: "前原 謙太",
        test_name: "第2回模擬試験", 
        test_date: "2025-02-15",
        section_kanri: 5,
        section_kaibou: 8,
        section_gakkou: 6,
        section_rikou: 9,
        section_yushou: 11,
        section_shikan: 12,
        section_kyousei: 7,
        section_shouni: 7,
        total_score: 65
      },
      {
        student_id: "221017",
        name: "前原 謙太",
        test_name: "第3回模擬試験",
        test_date: "2025-03-15",
        section_kanri: 6,
        section_kaibou: 9,
        section_gakkou: 8,
        section_rikou: 10,
        section_yushou: 12,
        section_shikan: 13,
        section_kyousei: 8,
        section_shouni: 8,
        total_score: 74
      }
    ]

    // 他の学生用のサンプルデータも追加
    const otherStudents = [
      {
        student_id: "231001",
        name: "足立 晴仁",
        test_name: "第1回模擬試験",
        test_date: "2025-01-15",
        section_kanri: 6,
        section_kaibou: 8,
        section_gakkou: 7,
        section_rikou: 9,
        section_yushou: 10,
        section_shikan: 11,
        section_kyousei: 7,
        section_shouni: 7,
        total_score: 65
      },
      {
        student_id: "231002", 
        name: "宇山 爾来",
        test_name: "第1回模擬試験",
        test_date: "2025-01-15",
        section_kanri: 5,
        section_kaibou: 7,
        section_gakkou: 6,
        section_rikou: 8,
        section_yushou: 9,
        section_shikan: 10,
        section_kyousei: 6,
        section_shouni: 6,
        total_score: 57
      },
      {
        student_id: "231003",
        name: "加藤 嗣人", 
        test_name: "第1回模擬試験",
        test_date: "2025-01-15",
        section_kanri: 7,
        section_kaibou: 9,
        section_gakkou: 8,
        section_rikou: 11,
        section_yushou: 12,
        section_shikan: 13,
        section_kyousei: 8,
        section_shouni: 8,
        total_score: 76
      }
    ]

    const allSampleData = [...sampleScores, ...otherStudents]

    // データを挿入
    const { data: insertedData, error: insertError } = await supabase
      .from("test_scores")
      .insert(allSampleData)
      .select()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({
        success: false,
        error: insertError.message
      }, { status: 500 })
    }

    // 挿入後のデータを確認
    const { data: verifyData, error: verifyError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", "221017")

    return NextResponse.json({
      success: true,
      message: "Sample test scores created successfully",
      insertedCount: insertedData?.length || 0,
      student221017Data: verifyData,
      verifyError
    })

  } catch (error) {
    console.error("Create sample data error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
