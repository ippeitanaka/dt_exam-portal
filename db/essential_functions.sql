-- 簡易テスト概要取得関数
-- get_test_summary関数が存在しない場合の代替案

-- テスト概要を取得する関数（シンプル版）
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- パスワード検証関数
CREATE OR REPLACE FUNCTION verify_password(stored_hash TEXT, input_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(input_password, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
