-- 歯科技工士学科試験管理システム - 完全なデータベースセットアップSQL
-- Supabaseで実行する一括設定用SQLファイル

-- UUIDエクステンションを有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- テーブル作成
-- ========================================

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

-- test_scoresテーブル（詳細版）
-- 試験結果を管理するテーブル - セクション別得点を含む
DROP TABLE IF EXISTS test_scores CASCADE;
CREATE TABLE test_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 学生名をtest_scoresテーブルにも保存
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  section_a NUMERIC DEFAULT 0, -- A問題（一般）
  section_b NUMERIC DEFAULT 0, -- B問題（必修）
  section_c NUMERIC DEFAULT 0, -- C問題（必修症例）
  section_d NUMERIC DEFAULT 0, -- D問題（一般症例）
  section_ad NUMERIC DEFAULT 0, -- AD問題（一般合計）
  section_bc NUMERIC DEFAULT 0, -- BC問題（必修合計）
  total_score NUMERIC NOT NULL, -- 合計点
  max_score INTEGER DEFAULT 400, -- 満点（デフォルト400点）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同じ学生の同じテストは1回のみ制限
  UNIQUE(student_id, test_name, test_date)
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

-- ========================================
-- インデックス作成
-- ========================================

-- studentsテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- test_scoresテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_test_scores_student_id ON test_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_name ON test_scores(test_name);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_date ON test_scores(test_date);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_name_date ON test_scores(test_name, test_date);
CREATE INDEX IF NOT EXISTS idx_test_scores_total_score ON test_scores(total_score);

-- rankingsテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_rankings_student_id ON rankings(student_id);
CREATE INDEX IF NOT EXISTS idx_rankings_test_name ON rankings(test_name);
CREATE INDEX IF NOT EXISTS idx_rankings_test_date ON rankings(test_date);

-- ========================================
-- 関数作成
-- ========================================

-- パスワード検証関数
CREATE OR REPLACE FUNCTION verify_password(stored_hash TEXT, input_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(input_password, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- テスト平均点取得関数
CREATE OR REPLACE FUNCTION get_test_averages(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  avg_section_a NUMERIC,
  avg_section_b NUMERIC,
  avg_section_c NUMERIC,
  avg_section_d NUMERIC,
  avg_section_ad NUMERIC,
  avg_section_bc NUMERIC,
  avg_total_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(section_a) as avg_section_a,
    AVG(section_b) as avg_section_b,
    AVG(section_c) as avg_section_c,
    AVG(section_d) as avg_section_d,
    AVG(section_ad) as avg_section_ad,
    AVG(section_bc) as avg_section_bc,
    AVG(total_score) as avg_total_score
  FROM 
    test_scores
  WHERE 
    test_name = p_test_name
    AND test_date = p_test_date;
END;
$$ LANGUAGE plpgsql;

-- 特定のテストでの学生の順位を取得する関数
CREATE OR REPLACE FUNCTION get_student_rank(
  p_student_id TEXT,
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rankings.rank
  FROM (
    SELECT 
      student_id,
      RANK() OVER (ORDER BY total_score DESC) as rank
    FROM 
      test_scores
    WHERE 
      test_name = p_test_name
      AND test_date = p_test_date
  ) as rankings
  WHERE 
    rankings.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- 学生の総合順位を取得する関数
CREATE OR REPLACE FUNCTION get_student_total_rank(
  p_student_id TEXT
)
RETURNS TABLE (
  rank BIGINT,
  avg_rank NUMERIC
) AS $$
DECLARE
  v_avg_rank NUMERIC;
  v_rank BIGINT;
BEGIN
  -- この学生の各テストでの順位の平均を計算
  WITH student_test_ranks AS (
    SELECT 
      ts.student_id,
      RANK() OVER (PARTITION BY ts.test_name, ts.test_date ORDER BY ts.total_score DESC) as test_rank
    FROM 
      test_scores ts
    WHERE
      ts.student_id = p_student_id
  )
  SELECT 
    COALESCE(AVG(test_rank), 999999)
  INTO 
    v_avg_rank
  FROM 
    student_test_ranks;
  
  -- 全学生の平均順位を計算し、この学生の順位を決定
  WITH all_student_avg_ranks AS (
    SELECT 
      s.student_id,
      (
        SELECT 
          COALESCE(AVG(RANK() OVER (PARTITION BY ts.test_name, ts.test_date ORDER BY ts.total_score DESC)), 999999)
        FROM 
          test_scores ts
        WHERE 
          ts.student_id = s.student_id
      ) as avg_rank
    FROM 
      students s
  )
  SELECT 
    RANK() OVER (ORDER BY avg_rank)
  INTO 
    v_rank
  FROM 
    all_student_avg_ranks
  WHERE 
    student_id = p_student_id;
  
  -- 結果を返す
  RETURN QUERY
  SELECT 
    v_rank,
    v_avg_rank;
END;
$$ LANGUAGE plpgsql;

-- 特定のテストの全学生の順位を取得する関数
CREATE OR REPLACE FUNCTION get_test_rankings(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  section_a NUMERIC,
  section_b NUMERIC,
  section_c NUMERIC,
  section_d NUMERIC,
  section_ad NUMERIC,
  section_bc NUMERIC,
  total_score NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.student_id,
    ts.name,
    ts.section_a,
    ts.section_b,
    ts.section_c,
    ts.section_d,
    ts.section_ad,
    ts.section_bc,
    ts.total_score,
    RANK() OVER (ORDER BY ts.total_score DESC) as rank
  FROM 
    test_scores ts
  WHERE 
    ts.test_name = p_test_name
    AND ts.test_date = p_test_date
  ORDER BY 
    RANK() OVER (ORDER BY ts.total_score DESC);
END;
$$ LANGUAGE plpgsql;

-- 総合ランキングを取得する関数
CREATE OR REPLACE FUNCTION get_total_rankings()
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  avg_score NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.student_id,
    s.name,
    COALESCE(AVG(ts.total_score), 0) as avg_score,
    RANK() OVER (ORDER BY COALESCE(AVG(ts.total_score), 0) DESC) as rank
  FROM 
    students s
  LEFT JOIN 
    test_scores ts ON s.student_id = ts.student_id
  GROUP BY 
    s.student_id, s.name
  ORDER BY 
    rank, s.student_id;
END;
$$ LANGUAGE plpgsql;

-- テスト概要を取得する関数（テスト管理用）
CREATE OR REPLACE FUNCTION get_test_summary()
RETURNS TABLE (
  test_name TEXT,
  test_date DATE,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.test_name,
    ts.test_date,
    COUNT(*) as count
  FROM 
    test_scores ts
  GROUP BY 
    ts.test_name, ts.test_date
  ORDER BY 
    ts.test_date DESC, ts.test_name;
END;
$$ LANGUAGE plpgsql;

-- 学生ログイン検証用の関数
CREATE OR REPLACE FUNCTION verify_student_login(
  p_student_id TEXT,
  p_password TEXT
)
RETURNS SETOF students AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM students
  WHERE student_id = p_student_id
  AND (
    -- ハッシュ化されたパスワードの場合
    (password LIKE '$2a$%' AND verify_password(password, p_password))
    OR
    -- 平文パスワードの場合（移行期間中のみ）
    (password NOT LIKE '$2a$%' AND password = p_password)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者ログイン検証用の関数
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS SETOF admin_users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM admin_users
  WHERE username = p_username
  AND (
    -- ハッシュ化されたパスワードの場合
    (password LIKE '$2a$%' AND verify_password(password, p_password))
    OR
    -- 平文パスワードの場合（移行期間中のみ）
    (password NOT LIKE '$2a$%' AND password = p_password)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- RLS (Row Level Security) ポリシー設定
-- ========================================

-- studentsテーブルのRLS設定
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 学生は自分のデータのみ閲覧可能
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT
  USING (auth.uid()::text = student_id OR auth.role() = 'authenticated');

-- 管理者は全学生データを閲覧・操作可能
CREATE POLICY "Admins can manage all students" ON students
  FOR ALL
  USING (auth.role() = 'service_role');

-- test_scoresテーブルのRLS設定
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- 学生は自分の成績のみ閲覧可能
CREATE POLICY "Students can view their own scores" ON test_scores
  FOR SELECT
  USING (auth.uid()::text = student_id OR auth.role() = 'authenticated');

-- 管理者は全成績データを閲覧・操作可能
CREATE POLICY "Admins can manage all scores" ON test_scores
  FOR ALL
  USING (auth.role() = 'service_role');

-- admin_usersテーブルのRLS設定
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Only admins can access admin_users" ON admin_users
  FOR ALL
  USING (auth.role() = 'service_role');

-- adminsテーブルのRLS設定
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Only admins can access admins" ON admins
  FOR ALL
  USING (auth.role() = 'service_role');

-- rankingsテーブルのRLS設定
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能、管理者のみ編集可能
CREATE POLICY "Everyone can view rankings" ON rankings
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify rankings" ON rankings
  FOR ALL
  USING (auth.role() = 'service_role');

-- ========================================
-- トリガー関数作成
-- ========================================

-- updated_atカラムを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- test_scoresテーブルにupdated_atトリガーを設定
CREATE TRIGGER update_test_scores_updated_at
  BEFORE UPDATE ON test_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- コメント追加
-- ========================================

COMMENT ON TABLE students IS '学生情報テーブル';
COMMENT ON TABLE admin_users IS '管理者ユーザーテーブル（ハッシュ化パスワード）';
COMMENT ON TABLE admins IS '簡易管理者テーブル（プレーンテキストパスワード）';
COMMENT ON TABLE test_scores IS '試験結果テーブル（セクション別得点を含む）';
COMMENT ON TABLE rankings IS '順位管理テーブル';

COMMENT ON COLUMN students.student_id IS '学生ID（一意）';
COMMENT ON COLUMN students.name IS '学生氏名';
COMMENT ON COLUMN students.password IS 'ログイン用パスワード';

COMMENT ON COLUMN test_scores.section_a IS 'A問題（一般）の得点';
COMMENT ON COLUMN test_scores.section_b IS 'B問題（必修）の得点';
COMMENT ON COLUMN test_scores.section_c IS 'C問題（必修症例）の得点';
COMMENT ON COLUMN test_scores.section_d IS 'D問題（一般症例）の得点';
COMMENT ON COLUMN test_scores.section_ad IS 'AD問題（一般合計）の得点';
COMMENT ON COLUMN test_scores.section_bc IS 'BC問題（必修合計）の得点';
COMMENT ON COLUMN test_scores.total_score IS '総合得点';

-- ========================================
-- 初期データ挿入（管理者ユーザー）
-- ========================================

-- デフォルト管理者ユーザーを作成（パスワード: admin123）
INSERT INTO admin_users (username, password) 
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- 簡易管理者ユーザーも作成
INSERT INTO admins (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- 実行完了メッセージ
SELECT 'データベースセットアップが完了しました。以下が作成されました:
- studentsテーブル（学生情報）
- admin_users, adminsテーブル（管理者情報）  
- test_scoresテーブル（試験結果、セクション別得点対応）
- rankingsテーブル（順位管理）
- 各種関数（ランキング計算、ログイン認証）
- RLSポリシー（セキュリティ設定）
- インデックス（パフォーマンス最適化）

デフォルト管理者ユーザー:
- ユーザー名: admin
- パスワード: admin123' as setup_status;
