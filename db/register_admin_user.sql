-- 管理者ユーザー登録SQL
-- dt@toyoiryo.ac.jp / TOYOdt01 でのログイン用

-- オプション1: admin_usersテーブル（bcryptハッシュ化パスワード）に登録
-- パスワード "TOYOdt01" をbcryptでハッシュ化した値（saltRounds: 12）
-- ハッシュ値: $2a$12$oQl.XvJkV9k4rQgJfGJmN.mV4KmNzOKdXhGjQO9qRHcgj8VzJhqKO

-- bcryptハッシュ化パスワードでの登録（推奨）
INSERT INTO admin_users (username, password, created_at) VALUES 
('dt@toyoiryo.ac.jp', '$2a$12$oQl.XvJkV9k4rQgJfGJmN.mV4KmNzOKdXhGjQO9qRHcgj8VzJhqKO', NOW())
ON CONFLICT (username) DO UPDATE SET 
password = EXCLUDED.password,
created_at = NOW();

-- オプション2: adminsテーブル（プレーンテキストパスワード）に登録
-- 開発・テスト環境での簡易ログイン用
INSERT INTO admins (username, password, created_at) VALUES 
('dt@toyoiryo.ac.jp', 'TOYOdt01', NOW())
ON CONFLICT (username) DO UPDATE SET 
password = EXCLUDED.password,
created_at = NOW();
created_at = NOW();

-- 確認用クエリ
-- 登録されたユーザーを確認する
SELECT 'admin_users' as table_name, username, created_at FROM admin_users WHERE username = 'dt@toyoiryo.ac.jp'
UNION ALL
SELECT 'admins' as table_name, username, created_at FROM admins WHERE username = 'dt@toyoiryo.ac.jp';
