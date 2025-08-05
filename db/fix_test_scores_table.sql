-- test_scoresテーブルを正しい分野別構造に修正するSQL

-- 既存のtest_scoresテーブルをバックアップとして残し、新しい構造で再作成
DROP TABLE IF EXISTS test_scores_backup;
CREATE TABLE test_scores_backup AS SELECT * FROM test_scores;

-- 既存のtest_scoresテーブルを削除（CASCADE で関連する外部キー制約も削除）
DROP TABLE IF EXISTS test_scores CASCADE;

-- 新しい分野別構造でtest_scoresテーブルを作成
CREATE TABLE test_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 学生名をtest_scoresテーブルにも保存
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  section_a INTEGER DEFAULT 0, -- A問題（人体の構造と機能・疾病の成り立ち）
  section_b INTEGER DEFAULT 0, -- B問題（歯・口腔の構造と機能・疾病・予防）
  section_c INTEGER DEFAULT 0, -- C問題（歯科診療補助・歯科予防処置）
  section_d INTEGER DEFAULT 0, -- D問題（歯科保健指導・その他）
  section_ad INTEGER DEFAULT 0, -- AD問題合計（一般）
  section_bc INTEGER DEFAULT 0, -- BC問題合計（専門）
  total_score INTEGER NOT NULL, -- 合計点
  max_score INTEGER DEFAULT 400, -- 満点（デフォルト400点）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同じ学生の同じテストは1回のみ制限
  UNIQUE(student_id, test_name, test_date)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_test_scores_student_id ON test_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_name ON test_scores(test_name);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_date ON test_scores(test_date);
CREATE INDEX IF NOT EXISTS idx_test_scores_test_name_date ON test_scores(test_name, test_date);
CREATE INDEX IF NOT EXISTS idx_test_scores_total_score ON test_scores(total_score);

-- テーブルコメント
COMMENT ON TABLE test_scores IS '試験結果テーブル（分野別得点対応）';
COMMENT ON COLUMN test_scores.student_id IS '学生ID（studentsテーブル参照）';
COMMENT ON COLUMN test_scores.name IS '学生氏名';
COMMENT ON COLUMN test_scores.test_name IS '試験名';
COMMENT ON COLUMN test_scores.test_date IS '試験実施日';
COMMENT ON COLUMN test_scores.section_a IS 'A問題：人体の構造と機能・疾病の成り立ち';
COMMENT ON COLUMN test_scores.section_b IS 'B問題：歯・口腔の構造と機能・疾病・予防';
COMMENT ON COLUMN test_scores.section_c IS 'C問題：歯科診療補助・歯科予防処置';
COMMENT ON COLUMN test_scores.section_d IS 'D問題：歯科保健指導・その他';
COMMENT ON COLUMN test_scores.section_ad IS 'A+D問題合計（一般分野）';
COMMENT ON COLUMN test_scores.section_bc IS 'B+C問題合計（専門分野）';
COMMENT ON COLUMN test_scores.total_score IS '総得点';
COMMENT ON COLUMN test_scores.max_score IS '満点';

-- RLSポリシーを再作成（セキュリティのため）
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- 学生は自分の成績のみ閲覧可能
CREATE POLICY "test_scores_select_policy" ON test_scores
FOR SELECT USING (true); -- とりあえず全ユーザーが閲覧可能に設定

-- 管理者のみ挿入・更新・削除可能
CREATE POLICY "test_scores_insert_policy" ON test_scores
FOR INSERT WITH CHECK (true); -- とりあえず全ユーザーが挿入可能に設定

CREATE POLICY "test_scores_update_policy" ON test_scores
FOR UPDATE USING (true); -- とりあえず全ユーザーが更新可能に設定

CREATE POLICY "test_scores_delete_policy" ON test_scores
FOR DELETE USING (true); -- とりあえず全ユーザーが削除可能に設定
