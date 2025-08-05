-- studentsテーブルにemail列を追加
ALTER TABLE students 
ADD COLUMN email VARCHAR(255);

-- email列にコメントを追加
COMMENT ON COLUMN students.email IS '学生のメールアドレス';

-- emailカラムにインデックスを追加（検索パフォーマンス向上）
CREATE INDEX idx_students_email ON students(email);
