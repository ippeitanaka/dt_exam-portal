-- データベース構造を修正して、CSVインポート機能を正常に動作させるSQL

-- studentsテーブルにemailカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'email'
  ) THEN
    ALTER TABLE students ADD COLUMN email VARCHAR(255);
    COMMENT ON COLUMN students.email IS '学生のメールアドレス';
    CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
  END IF;
END $$;

-- test_scoresテーブルを新しい分野構造に対応させる
-- 既存のテーブルをバックアップ
CREATE TABLE IF NOT EXISTS test_scores_backup AS 
SELECT * FROM test_scores WHERE 1=0; -- 構造のみコピー

-- 新しい分野列を追加（存在しない場合のみ）
DO $$
BEGIN
  -- test_type列を追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'test_type'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN test_type VARCHAR(10) DEFAULT '100q';
    COMMENT ON COLUMN test_scores.test_type IS 'テストタイプ（100q または 80q）';
  END IF;

  -- 新しい分野別得点列を追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_kanri'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_kanri INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_kanri IS '管理分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_kaibou'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_kaibou INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_kaibou IS '解剖分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_gakkou'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_gakkou INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_gakkou IS '顎口分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_rikou'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_rikou INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_rikou IS '理工分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_yushou'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_yushou INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_yushou IS '有床分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_shikan'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_shikan INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_shikan IS '歯冠分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_kyousei'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_kyousei INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_kyousei IS '矯正分野の得点';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'section_shouni'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN section_shouni INTEGER DEFAULT 0;
    COMMENT ON COLUMN test_scores.section_shouni IS '小児分野の得点';
  END IF;

  -- name列を追加（存在しない場合のみ）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'name'
  ) THEN
    ALTER TABLE test_scores ADD COLUMN name TEXT;
    COMMENT ON COLUMN test_scores.name IS '学生氏名';
  END IF;

  -- total_score列の名前を変更（scoreが存在する場合）
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'score'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_scores' AND column_name = 'total_score'
  ) THEN
    ALTER TABLE test_scores RENAME COLUMN score TO total_score;
    COMMENT ON COLUMN test_scores.total_score IS '総得点';
  END IF;
END $$;

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_test_scores_test_type ON test_scores(test_type);
CREATE INDEX IF NOT EXISTS idx_test_scores_total_score ON test_scores(total_score);

-- 制約を追加
ALTER TABLE test_scores 
ADD CONSTRAINT check_test_type 
CHECK (test_type IN ('100q', '80q'))
IF NOT EXISTS (
  SELECT 1 FROM information_schema.check_constraints 
  WHERE constraint_name = 'check_test_type'
);

-- サンプルデータがない場合、デフォルト管理者を作成
INSERT INTO admins (username, password) 
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- データ整合性チェック用のビューを作成
CREATE OR REPLACE VIEW test_scores_summary AS
SELECT 
  test_name,
  test_date,
  test_type,
  COUNT(*) as student_count,
  AVG(total_score) as avg_score,
  MAX(total_score) as max_score,
  MIN(total_score) as min_score
FROM test_scores 
GROUP BY test_name, test_date, test_type
ORDER BY test_date DESC, test_name;

COMMENT ON VIEW test_scores_summary IS 'テスト結果のサマリービュー';
