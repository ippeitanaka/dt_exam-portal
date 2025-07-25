-- 歯科技工士学科試験管理システム用テーブル作成SQL
-- Supabaseで実行するためのテーブル構造定義

-- UUIDエクステンションを有効化（すでに有効な場合は無視される）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- studentsテーブル
-- 学生情報を管理するテーブル
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_usersテーブル
-- 管理者ユーザー情報を管理するテーブル（パスワードはハッシュ化）
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- bcryptでハッシュ化されたパスワード
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- adminsテーブル
-- 簡易管理者情報を管理するテーブル（プレーンテキストパスワード）
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- プレーンテキストパスワード
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- test_scoresテーブル
-- 試験結果を管理するテーブル
CREATE TABLE IF NOT EXISTS test_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- rankingsテーブル（順位管理用）
-- 試験結果の順位を管理するテーブル
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  total_students INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成（検索パフォーマンスの向上）
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_student_id ON test_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_name ON test_scores(test_name);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_date ON test_scores(test_date);
CREATE INDEX IF NOT EXISTS idx_rankings_student_id ON rankings(student_id);
CREATE INDEX IF NOT EXISTS idx_rankings_test_name ON rankings(test_name);
CREATE INDEX IF NOT EXISTS idx_rankings_test_date ON rankings(test_date);

-- コメント追加
COMMENT ON TABLE students IS '学生情報テーブル';
COMMENT ON TABLE admin_users IS '管理者ユーザーテーブル（ハッシュ化パスワード）';
COMMENT ON TABLE admins IS '簡易管理者テーブル（プレーンテキストパスワード）';
COMMENT ON TABLE test_scores IS '試験結果テーブル';
COMMENT ON TABLE rankings IS '順位管理テーブル';

COMMENT ON COLUMN students.student_id IS '学生ID（一意）';
COMMENT ON COLUMN students.name IS '学生氏名';
COMMENT ON COLUMN students.password IS 'ログイン用パスワード';

COMMENT ON COLUMN admin_users.username IS '管理者ユーザー名';
COMMENT ON COLUMN admin_users.password IS 'bcryptハッシュ化パスワード';

COMMENT ON COLUMN admins.username IS '管理者ユーザー名';
COMMENT ON COLUMN admins.password IS 'プレーンテキストパスワード';

COMMENT ON COLUMN test_scores.student_id IS '学生ID（studentsテーブル参照）';
COMMENT ON COLUMN test_scores.test_name IS '試験名';
COMMENT ON COLUMN test_scores.test_date IS '試験実施日';
COMMENT ON COLUMN test_scores.score IS '取得点数';
COMMENT ON COLUMN test_scores.max_score IS '満点';

COMMENT ON COLUMN rankings.rank IS '順位';
COMMENT ON COLUMN rankings.total_students IS '総受験者数';
