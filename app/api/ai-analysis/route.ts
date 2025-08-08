import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { studentScores, studentName } = await request.json()

    if (!studentScores || studentScores.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "成績データが見つかりません" 
      }, { status: 400 })
    }

    const latestScore = studentScores[0]
    const previousScore = studentScores[1]

    // Gemini APIキーが設定されている場合はAI分析を使用
    const apiKey = process.env.GEMINI_API_KEY
    
    if (apiKey) {
      try {
        // Gemini AIを使用した高度な分析
        const analysis = await generateGeminiAnalysis(studentScores, studentName, apiKey)
        return NextResponse.json({
          success: true,
          analysis: analysis
        })
      } catch (error) {
        console.error("Gemini API エラー:", error)
        // Gemini APIエラー時はフォールバックを使用
      }
    }

    // フォールバック: 独自の分析ロジック
    const analysis = generateFallbackAnalysis(latestScore, previousScore)
    
    return NextResponse.json({
      success: true,
      analysis: analysis
    })

  } catch (error) {
    console.error("AI分析エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "分析処理中にエラーが発生しました" 
    }, { status: 500 })
  }
}

// Gemini AIを使用した分析
async function generateGeminiAnalysis(studentScores: any[], studentName: string, apiKey: string) {
  const latestScore = studentScores[0]
  
  // 成績データを分析用に整理
  const scoresText = studentScores.map((score: any) => {
    const testDate = new Date(score.test_date).toLocaleDateString('ja-JP')
    return `
【${score.test_name}】(${testDate})
- 衛生管理: ${score.section_kanri || 0}点
- 人体解剖: ${score.section_kaibou || 0}点  
- 学校保健: ${score.section_gakkou || 0}点
- 理工学概論: ${score.section_rikou || 0}点
- 有床義歯: ${score.section_yushou || 0}点
- 歯冠修復: ${score.section_shikan || 0}点
- 矯正: ${score.section_kyousei || 0}点
- 小児: ${score.section_shouni || 0}点
- 合計: ${score.total_score || 0}点/100点
      `
  }).join('\n')

  const prompt = `
あなたは歯科技工士国家試験対策の専門指導者です。以下の学生の模擬試験結果を分析し、具体的で実践的な学習アドバイスを提供してください。

学生名: ${studentName || '学生'}
成績データ:
${scoresText}

以下の観点で分析してください：
1. 総合的な成績評価（優秀/良好/合格ライン/要努力/基礎強化必要）
2. 合格ライン（60点）との比較と具体的な目標
3. 前回からの変化とその要因分析
4. 分野別の強み・弱点の特定
5. 弱点分野の具体的な学習方法
6. モチベーション向上のメッセージ

400文字以内で、学習意欲を高める前向きなトーンで回答してください。
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
      }]
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API エラー: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI分析を取得できませんでした。"
}

// フォールバック分析
function generateFallbackAnalysis(latestScore: any, previousScore: any) {
  const passingScore = latestScore.test_type === "200q" ? 120 : 60
  const totalPossible = latestScore.test_type === "200q" ? 200 : 100
  const pointsToPass = Math.max(0, passingScore - latestScore.total_score)
  
  let analysis = ""

  // 1. 全体評価
  const scoreRatio = (latestScore.total_score / totalPossible) * 100
  let overallGrade = ""
  
  if (scoreRatio >= 80) {
    overallGrade = "優秀"
    analysis += "## 🎉 総合評価: 優秀\n素晴らしい成績です！この調子で継続してください。\n\n"
  } else if (scoreRatio >= 70) {
    overallGrade = "良好"
    analysis += "## ✨ 総合評価: 良好\n良い成績を維持しています。さらなる向上を目指しましょう。\n\n"
  } else if (scoreRatio >= 60) {
    overallGrade = "合格ライン"
    analysis += "## ✅ 総合評価: 合格ライン達成\n合格ラインをクリアしています！安定した成績を保ちましょう。\n\n"
  } else if (scoreRatio >= 50) {
    overallGrade = "要努力"
    analysis += "## 📈 総合評価: 要努力\n合格まであと一歩です。弱点分野を重点的に学習しましょう。\n\n"
  } else {
    overallGrade = "基礎強化必要"
    analysis += "## 💪 総合評価: 基礎強化必要\n基礎からしっかりと復習し、段階的にレベルアップしましょう。\n\n"
  }

  // 2. 合格ラインとの比較
  if (pointsToPass === 0) {
    analysis += `## 🎯 合格ライン達成！\n合格ラインを${latestScore.total_score - passingScore}点上回っています。この成果を維持し、さらなる高得点を目指しましょう。\n\n`
  } else {
    analysis += `## 🎯 合格まで: あと${pointsToPass}点\n`
    if (pointsToPass <= 10) {
      analysis += "あと少しで合格ラインです！集中的な復習で十分到達可能です。\n\n"
    } else if (pointsToPass <= 20) {
      analysis += "計画的な学習で合格ラインに近づけます。弱点分野を中心に学習しましょう。\n\n"
    } else {
      analysis += "基礎力向上が必要です。各分野をバランスよく学習し、着実にステップアップしましょう。\n\n"
    }
  }

  // 3. 前回との比較
  if (previousScore) {
    const scoreDiff = latestScore.total_score - previousScore.total_score
    analysis += "## 📊 前回との比較\n"
    if (scoreDiff > 0) {
      analysis += `前回より${scoreDiff}点向上しています！📈 この調子で継続しましょう。\n\n`
    } else if (scoreDiff < 0) {
      analysis += `前回より${Math.abs(scoreDiff)}点下降しています。📉 復習を強化し、次回は向上を目指しましょう。\n\n`
    } else {
      analysis += "前回と同じ点数です。安定していますが、さらなる向上を目指しましょう。\n\n"
    }
  }

  // 4. 分野別分析
  const sections = [
    { name: '衛生管理', score: latestScore.section_kanri },
    { name: '人体解剖', score: latestScore.section_kaibou },
    { name: '学校保健', score: latestScore.section_gakkou },
    { name: '理工学概論', score: latestScore.section_rikou },
    { name: '有床義歯', score: latestScore.section_yushou },
    { name: '歯冠修復', score: latestScore.section_shikan },
    { name: '矯正', score: latestScore.section_kyousei },
    { name: '小児', score: latestScore.section_shouni },
  ]

  const sortedSections = sections.sort((a, b) => (b.score || 0) - (a.score || 0))
  const strongSections = sortedSections.slice(0, 3)
  const weakSections = sortedSections.slice(-3).reverse()

  analysis += "## 📈 分野別分析\n"
  analysis += `**💪 得意分野:** ${strongSections.map(s => `${s.name}(${s.score}点)`).join(', ')}\n`
  analysis += `**🎯 重点強化分野:** ${weakSections.map(s => `${s.name}(${s.score}点)`).join(', ')}\n\n`

  // 5. 学習アドバイス
  analysis += "## 📚 学習アドバイス\n"
  if (pointsToPass > 0) {
    analysis += `1. **${weakSections[0].name}の集中学習**: 基礎から応用まで段階的に復習\n`
    analysis += "2. **過去問演習の強化**: 弱点分野の問題を重点的に解く\n"
    analysis += "3. **理解度の確認**: 間違えた問題は必ず解説を読み、理解を深める\n\n"
  } else {
    analysis += "1. **高得点維持**: 現在の学習方法を継続し、さらなる向上を目指す\n"
    analysis += "2. **応用問題にチャレンジ**: より難易度の高い問題にも取り組む\n"
    analysis += "3. **全分野のバランス向上**: すべての分野で安定した高得点を目指す\n\n"
  }

  analysis += "💪 **頑張って！合格に向けて着実に前進しています！**"

  return analysis
}