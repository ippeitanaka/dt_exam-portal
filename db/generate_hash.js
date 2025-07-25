// bcryptハッシュ化パスワード生成スクリプト
// パスワード "TOYOdt01" をハッシュ化します

const bcrypt = require('bcrypt');

const password = 'TOYOdt01';
const saltRounds = 12;

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('元のパスワード:', password);
    console.log('ハッシュ化されたパスワード:', hash);
    console.log('\n以下のSQLで admin_users テーブルに登録してください:');
    console.log(`INSERT INTO admin_users (username, password, created_at) VALUES`);
    console.log(`('dt@toyoiryo.ac.jp', '${hash}', NOW())`);
    console.log(`ON CONFLICT (username) DO UPDATE SET`);
    console.log(`password = EXCLUDED.password,`);
    console.log(`created_at = NOW();`);
  } catch (error) {
    console.error('ハッシュ化エラー:', error);
  }
}

generateHash();
