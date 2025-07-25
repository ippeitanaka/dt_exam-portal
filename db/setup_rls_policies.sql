-- Row Level Security (RLS) 設定とポリシー定義
-- Supabaseで実行するセキュリティ設定SQL

-- studentsテーブルのRLS設定
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- studentsテーブルの読み取りポリシー
DROP POLICY IF EXISTS students_select_policy ON students;
CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- studentsテーブルの挿入ポリシー
DROP POLICY IF EXISTS students_insert_policy ON students;
CREATE POLICY students_insert_policy
  ON students
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- studentsテーブルの更新ポリシー
DROP POLICY IF EXISTS students_update_policy ON students;
CREATE POLICY students_update_policy
  ON students
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- admin_usersテーブルのRLS設定
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- admin_usersテーブルの読み取りポリシー
DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;
CREATE POLICY admin_users_select_policy
  ON admin_users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- admin_usersテーブルの挿入ポリシー
DROP POLICY IF EXISTS admin_users_insert_policy ON admin_users;
CREATE POLICY admin_users_insert_policy
  ON admin_users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- adminsテーブルのRLS設定
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- adminsテーブルの読み取りポリシー
DROP POLICY IF EXISTS admins_select_policy ON admins;
CREATE POLICY admins_select_policy
  ON admins
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- adminsテーブルの挿入ポリシー
DROP POLICY IF EXISTS admins_insert_policy ON admins;
CREATE POLICY admins_insert_policy
  ON admins
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- test_scoresテーブルのRLS設定
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- test_scoresテーブルの読み取りポリシー
DROP POLICY IF EXISTS test_scores_select_policy ON test_scores;
CREATE POLICY test_scores_select_policy
  ON test_scores
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- test_scoresテーブルの挿入ポリシー
DROP POLICY IF EXISTS test_scores_insert_policy ON test_scores;
CREATE POLICY test_scores_insert_policy
  ON test_scores
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- test_scoresテーブルの更新ポリシー
DROP POLICY IF EXISTS test_scores_update_policy ON test_scores;
CREATE POLICY test_scores_update_policy
  ON test_scores
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- test_scoresテーブルの削除ポリシー
DROP POLICY IF EXISTS test_scores_delete_policy ON test_scores;
CREATE POLICY test_scores_delete_policy
  ON test_scores
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- rankingsテーブルのRLS設定
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- rankingsテーブルの読み取りポリシー
DROP POLICY IF EXISTS rankings_select_policy ON rankings;
CREATE POLICY rankings_select_policy
  ON rankings
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- rankingsテーブルの挿入ポリシー
DROP POLICY IF EXISTS rankings_insert_policy ON rankings;
CREATE POLICY rankings_insert_policy
  ON rankings
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- rankingsテーブルの更新ポリシー
DROP POLICY IF EXISTS rankings_update_policy ON rankings;
CREATE POLICY rankings_update_policy
  ON rankings
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- rankingsテーブルの削除ポリシー
DROP POLICY IF EXISTS rankings_delete_policy ON rankings;
CREATE POLICY rankings_delete_policy
  ON rankings
  FOR DELETE
  TO authenticated, anon
  USING (true);
