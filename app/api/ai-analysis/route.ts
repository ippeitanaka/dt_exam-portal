import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { studentScores, studentName } = await request.json()
    
    if (!studentScores || studentScores.length === 0) {
      return NextResponse.json(
        { error: "成績データが必要です" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API キーが設定されていません" },
        { status: 500 }
      )
    }

    // 成績データを分析用に整理
    const scoresText = studentScores.map((score: any) => {
      const testDate = new Date(score.test_date).toLocaleDateString('ja-JP')
      return `
【${score.test_name}】(${testDate})
- 管理: ${score.section_kanri || 0}点/9点
- 解剖: ${score.section_kaibou || 0}点/12点  
- 顎口: ${score.section_gakkou || 0}点/9点
- 理工: ${score.section_rikou || 0}点/16点
- 有床: ${score.section_yushou || 0}点/18点
- 歯冠: ${score.section_shikan || 0}点/18点
- 矯正: ${score.section_kyousei || 0}点/9点
- 小児: ${score.section_shouni || 0}点/9点
- 合計: ${score.total_score || 0}点/100点
      `
    }).join('\n')

    const prompt = `
あなたは歯科技工士を目指す学生の学習サポートAIです。以下の模擬試験結果を分析し、学習アドバイスを提供してください。

学生名: ${studentName || '学生'}

模擬試験結果:
${scoresText}

以下の観点から分析・アドバイスしてください：

1. **得意分野の特定**
   - 各分野の平均正答率から強い分野を特定
   
2. **苦手分野の特定**  
   - 各分野の平均正答率から弱い分野を特定
   
3. **学習対策の提案**
   - 苦手分野の具体的な学習方法
   - 歯科技工士としての実技や知識習得のアドバイス
   - 効果的な復習方法
   
4. **今後の学習計画**
   - 短期的な目標設定
   - 長期的な学習戦略

分析は具体的で実践的な内容にし、歯科技工士の専門知識を活かしたアドバイスを心がけてください。
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "分析結果を生成できませんでした。"

    return NextResponse.json({
      success: true,
      analysis: analysis
    })

  } catch (error) {
    console.error("AI Analysis API エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI分析に失敗しました" },
      { status: 500 }
    )
  }
}
