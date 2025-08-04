# 歯科技工士学科試験管理システム

歯科技工士学科の模擬試験結果を管理・表示するWebアプリケーションです。

## 機能

### 学生機能
- 学生IDとパスワードでログイン
- 自分の試験結果の確認
- 過去のテスト結果一覧
- セクション別得点の詳細表示
- 順位の確認
- 平均点との比較

### 管理者機能
- 学生データの管理
- 試験結果のCSVインポート（2つのフォーマット対応）
- テスト結果の管理・削除
- CSVテンプレートの自動生成
- 学生パスワードのリセット

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デプロイ**: Vercel

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. 「Project Settings」→「API」から以下の値を取得：
   - `Project URL`
   - `anon public key`

### 2. データベースセットアップ

1. SupabaseのSQL Editorで`db/complete_database_setup.sql`の内容を実行
2. 以下のテーブルと機能が作成されます：
   - `students`（学生情報）
   - `test_scores`（試験結果）
   - `admin_users`, `admins`（管理者）
   - `rankings`（順位管理）
   - 各種関数とRLSポリシー

### 3. Vercelでのデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ippeitanaka/dt_exam-portal)

または手動でデプロイ：

1. [Vercel](https://vercel.com)にログイン
2. GitHubリポジトリを接続
3. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`: SupabaseのProject URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseのanon public key

### 4. デフォルト管理者アカウント

データベースセットアップ後、以下のアカウントでログインできます：

- **ユーザー名**: `admin`
- **パスワード**: `admin123`

⚠️ **セキュリティ**: 本番環境では必ずデフォルトパスワードを変更してください。

## 使用方法

### CSVインポート

#### 新フォーマット（推奨）
```csv
番号,氏名,得点,管理,解剖,病口,理工,有床,歯冠,矯正,小児
231001,前原 謙太,57,4,7,7,6,10,12,6,5
231002,守立 時仁,85,7,11,6,15,14,15,9,8
```

#### 従来フォーマット
```csv
student_id,name,section_a,section_b,section_c,section_d,section_ad,section_bc,total_score
231001,前原 謙太,27,7,10,11,38,17,57
```

### セクション別得点の自動計算

新フォーマット使用時、以下のように自動計算されます：
- **section_a**（一般）: 管理 + 解剖 + 理工 + 歯冠
- **section_b**（必修）: 病口
- **section_c**（必修症例）: 有床
- **section_d**（一般症例）: 矯正 + 小児
- **section_ad**（一般合計）: A + D
- **section_bc**（必修合計）: B + C

### 合格基準

- **AD問題（一般合計）**: 132点以上
- **BC問題（必修合計）**: 44点以上
- 両方の基準を満たす必要があります

## ディレクトリ構造

```
dt_exam-portal/
├── app/                 # Next.js App Router
│   ├── api/            # API エンドポイント
│   ├── admin/          # 管理者ページ
│   ├── dashboard/      # 学生ダッシュボード
│   └── ...
├── components/         # Reactコンポーネント
├── db/                 # データベース関連SQL
├── hooks/              # カスタムフック
├── lib/                # ユーティリティ関数
└── public/            # 静的ファイル
```

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番サーバーの起動
npm start
```

## API エンドポイント

- `GET /api/export-csv-template` - CSVテンプレートダウンロード
- `POST /api/import-csv-new` - 新フォーマットCSVインポート
- `POST /api/import-test-results` - 従来フォーマットCSVインポート
- `POST /api/import-students` - 学生データインポート

## ライセンス

MIT License

## 作者

- **開発者**: GitHub Copilot with Human
- **リポジトリ**: https://github.com/ippeitanaka/dt_exam-portal

## サポート

問題が発生した場合は、GitHubのIssuesページでお知らせください。
# Force redeploy
