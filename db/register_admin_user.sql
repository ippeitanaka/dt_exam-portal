-- 管理者ユーザー登録SQL
-- dt@toyoiryo.ac.jp / TOYOqq01 でのログイン用

-- オプション1: admin_usersテーブル（bcryptハッシュ化パスワード）に登録
-- パスワード "TOYOqq01" をbcryptでハッシュ化した値（saltRounds: 12）
-- ハッシュ値: $2a$12$K5YgOHYrgjBgXNNPqV8Hv.8F9KgHCQ1ZCzOQRMxcGe8j4CfJfCLaS

-- bcryptハッシュ化パスワードでの登録（推奨）
INSERT INTO admin_users (username, password, created_at) VALUES 
('dt@toyoiryo.ac.jp', '$2a$12$K5YgOHYrgjBgXNNPqV8Hv.8F9KgHCQ1ZCzOQRMxcGe8j4CfJfCLaS', NOW())
ON CONFLICT (username) DO UPDATE SET 
password = EXCLUDED.password,
created_at = NOW();

-- オプション2: adminsテーブル（プレーンテキストパスワード）に登録
-- 開発・テスト環境での簡易ログイン用
INSERT INTO admins (username, password, created_at) VALUES 
('dt@toyoiryo.ac.jp', 'TOYOqq01', NOW())
ON CONFLICT (username) DO UPDATE SET 
password = EXCLUDED.password,
created_at = NOW();

-- 確認用クエリ
-- 登録されたユーザーを確認する
SELECT 'admin_users' as table_name, username, created_at FROM admin_users WHERE username = 'dt@toyoiryo.ac.jp'
UNION ALL
SELECT 'admins' as table_name, username, created_at FROM admins WHERE username = 'dt@toyoiryo.ac.jp';
