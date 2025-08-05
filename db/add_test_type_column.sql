-- test_scoresテーブルにtest_type列を追加
-- 100問の場合は'100q'、80問の場合は'80q'を格納

ALTER TABLE test_scores 
ADD COLUMN test_type VARCHAR(10) DEFAULT '100q';

-- test_type列にコメントを追加
COMMENT ON COLUMN test_scores.test_type IS '試験タイプ: 100q(100問), 80q(80問)';

-- 既存のデータを100問として設定
UPDATE test_scores 
SET test_type = '100q' 
WHERE test_type IS NULL;

-- test_type列にNOT NULL制約を追加
ALTER TABLE test_scores 
ALTER COLUMN test_type SET NOT NULL;

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX idx_test_scores_test_type ON test_scores(test_type);
CREATE INDEX idx_test_scores_type_name_date ON test_scores(test_type, test_name, test_date);
