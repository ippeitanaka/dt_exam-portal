import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'students'

    // テンプレートデータの定義
    const templates = {
      students: {
        filename: '学生データテンプレート.csv',
        headers: ['学生ID', '氏名', 'メールアドレス', 'パスワード'],
        sampleData: [
          ['221017', '前原 謙太', 'maehara@example.com', 'password123'],
          ['231001', '足立 晴仁', 'adachi@example.com', 'password456'],
          ['231002', '宇山 爾来', 'uyama@example.com', 'password789']
        ],
        description: '学生データインポート用のCSVテンプレートです。学生ID、氏名、メールアドレス、パスワードの順で入力してください。パスワードは学生がログインに使用します。'
      },
      testResults: {
        filename: 'テスト結果テンプレート.csv',
        headers: [
          '学生ID',
          '氏名', 
          'テスト名',
          'テスト日付',
          '総得点',
          '管理',
          '解剖',
          '顎口',
          '理工',
          '有床',
          '歯冠',
          '矯正',
          '小児',
          '満点'
        ],
        sampleData: [
          ['221017', '前原 謙太', '第1回模擬試験', '2025-08-05', '75', '7', '9', '7', '12', '14', '13', '7', '6', '100'],
          ['231001', '足立 晴仁', '第1回模擬試験', '2025-08-05', '68', '6', '8', '6', '11', '13', '12', '6', '6', '100'],
          ['231002', '宇山 爾来', '第1回模擬試験', '2025-08-05', '82', '8', '10', '8', '14', '16', '15', '8', '7', '100']
        ],
        description: 'テスト結果インポート用のCSVテンプレートです。新しい分野構造（管理9問、解剖12問、顎口9問、理工16問、有床18問、歯冠18問、矯正9問、小児9問）の100点満点に対応しています。'
      },
      testResultsLegacy: {
        filename: 'テスト結果テンプレート_旧構造.csv',
        headers: [
          '学生ID',
          '氏名',
          'テスト名', 
          'テスト日付',
          '総得点',
          'A問題',
          'B問題',
          'C問題',
          'D問題',
          'AD合計',
          'BC合計',
          '満点'
        ],
        sampleData: [
          ['221017', '前原 謙太', '第1回模擬試験', '2025-08-05', '350', '80', '90', '85', '95', '175', '175', '400'],
          ['231001', '足立 晴仁', '第1回模擬試験', '2025-08-05', '320', '75', '85', '80', '80', '155', '165', '400'],
          ['231002', '宇山 爾来', '第1回模擬試験', '2025-08-05', '340', '78', '88', '82', '92', '170', '170', '400']
        ],
        description: 'テスト結果インポート用のCSVテンプレートです（旧A/B/C/D構造）。'
      }
    }

    const template = templates[type as keyof typeof templates]
    if (!template) {
      return NextResponse.json({ error: '無効なテンプレートタイプです' }, { status: 400 })
    }

    // CSVデータを生成（UTF-8 BOM付きで文字化け防止）
    const csvLines = [
      template.headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ]
    
    // UTF-8 BOMを追加して文字化けを防ぐ
    const BOM = '\uFEFF'
    const csvContent = BOM + csvLines.join('\n')
    
    // CSVファイルとしてレスポンスを返す
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(template.filename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('CSV template generation error:', error)
    return NextResponse.json({ 
      error: 'CSVテンプレートの生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
