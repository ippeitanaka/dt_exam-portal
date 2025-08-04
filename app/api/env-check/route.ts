import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      supabaseUrl: supabaseUrl ? "設定済み" : "未設定",
      serviceKey: supabaseServiceKey ? "設定済み" : "未設定",
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Error checking environment", details: error },
      { status: 500 }
    )
  }
}
