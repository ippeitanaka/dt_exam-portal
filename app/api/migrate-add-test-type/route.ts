import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Service role key でテーブル変更を実行
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log("Adding test_type column to test_scores table...")

    // test_type列を追加
    const { data: alterResult, error: alterError } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE test_scores 
        ADD COLUMN IF NOT EXISTS test_type VARCHAR(10) DEFAULT '100q';
      `
    })

    if (alterError) {
      console.error("Error adding column:", alterError)
    }

    // 既存のデータを更新
    const { data: updateResult, error: updateError } = await supabase
      .from('test_scores')
      .update({ test_type: '100q' })
      .is('test_type', null)

    if (updateError) {
      console.error("Error updating existing data:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "test_type column added successfully",
      alterResult,
      updateResult
    })

  } catch (error) {
    console.error("Database migration error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
