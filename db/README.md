# 歯科技工士学科試験管理システム - データベースセットアップ

このディレクトリには、SupabaseデータベースをセットアップするためのSQLファイルが含まれています。

## セットアップ手順

### 1. テーブル作成
まず、以下のSQLファイルをSupabase SQL エディタで実行してテーブルを作成します：

```sql
-- ファイル: create_tables.sql
-- 実行内容: 
-- - students（学生）テーブル
-- - admin_users（管理者ユーザー・ハッシュ化パスワード）テーブル
-- - admins（簡易管理者・プレーンテキストパスワード）テーブル
-- - test_scores（試験結果）テーブル
-- - rankings（順位管理）テーブル
-- - インデックスとコメントの追加
```

### 2. セキュリティポリシー設定
次に、Row Level Security (RLS) とポリシーを設定します：

```sql
-- ファイル: setup_rls_policies.sql
-- 実行内容:
-- - 各テーブルでRLSを有効化
-- - SELECT、INSERT、UPDATE、DELETEポリシーの設定
-- - authenticated と anon ユーザーに対するアクセス許可
```

### 3. サンプルデータ挿入（オプション）
テスト用のサンプルデータを挿入します：

```sql
-- ファイル: insert_sample_data.sql
-- 実行内容:
-- - 管理者ユーザーのサンプルデータ
-- - 学生のサンプルデータ（106名分）
-- - ON CONFLICT DO NOTHING で重複を回避
```

## テーブル構造

### students テーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| id | UUID | 主キー |
| name | TEXT | 学生氏名 |
| student_id | TEXT | 学生ID（一意） |
| password | TEXT | ログイン用パスワード |
| created_at | TIMESTAMPTZ | 作成日時 |

### admin_users テーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| id | UUID | 主キー |
| username | TEXT | ユーザー名（一意） |
| password | TEXT | bcryptハッシュ化パスワード |
| created_at | TIMESTAMPTZ | 作成日時 |

### admins テーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| id | UUID | 主キー |
| username | TEXT | ユーザー名（一意） |
| password | TEXT | プレーンテキストパスワード |
| created_at | TIMESTAMPTZ | 作成日時 |

### test_scores テーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| id | UUID | 主キー |
| student_id | TEXT | 学生ID（外部キー） |
| test_name | TEXT | 試験名 |
| test_date | DATE | 試験実施日 |
| score | INTEGER | 取得点数 |
| max_score | INTEGER | 満点 |
| created_at | TIMESTAMPTZ | 作成日時 |

### rankings テーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| id | UUID | 主キー |
| student_id | TEXT | 学生ID（外部キー） |
| test_name | TEXT | 試験名 |
| test_date | DATE | 試験実施日 |
| score | INTEGER | 取得点数 |
| max_score | INTEGER | 満点 |
| rank | INTEGER | 順位 |
| total_students | INTEGER | 総受験者数 |
| created_at | TIMESTAMPTZ | 作成日時 |

## 注意事項

1. **セキュリティ**: 現在のRLSポリシーは開発用に設定されており、本番環境では適切に制限する必要があります。

2. **パスワード**: `admin_users`テーブルはbcryptハッシュ化、`admins`テーブルはプレーンテキストと、2つの異なるパスワード形式をサポートしています。

3. **外部キー制約**: `test_scores`と`rankings`テーブルは`students.student_id`を参照しており、CASCADE削除が設定されています。

4. **インデックス**: 検索パフォーマンス向上のため、よく使用されるカラムにインデックスが設定されています。
