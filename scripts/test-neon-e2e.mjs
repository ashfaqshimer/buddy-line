import { Pool } from 'pg';

const unpooled = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pooled = process.env.DATABASE_URL;

console.log('Testing Neon PostgreSQL Connection and Services...');

const unpooledPool = new Pool({ connectionString: unpooled });
const pooledPool = new Pool({ connectionString: pooled });

async function run() {
  // 1. Test unpooled direct connection
  const unpooledRes = await unpooledPool.query('SELECT NOW() as now, current_database() as db');
  console.log('✓ Unpooled connection successful:', unpooledRes.rows[0]);

  // 2. Test pooled connection
  const pooledRes = await pooledPool.query('SELECT 1 as pooled_ok');
  console.log('✓ Pooled connection successful:', pooledRes.rows[0]);

  // 3. Ensure games table in Neon Postgres
  await unpooledPool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT NOT NULL,
      html_content TEXT NOT NULL,
      css_content TEXT,
      js_content TEXT,
      author_id TEXT NOT NULL,
      author_username TEXT NOT NULL,
      author_avatar TEXT,
      play_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ Games table verified in Neon Postgres');

  // 4. Check all public tables
  const tablesRes = await pooledPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('✓ Tables active on Neon:', tablesRes.rows.map(r => r.table_name));

  // 5. Test Inserting and Querying a test game in Neon Postgres
  const testId = `e2e-game-${Date.now()}`;
  await pooledPool.query(`
    INSERT INTO games (id, title, description, icon, html_content, author_id, author_username, author_avatar, play_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    testId,
    'Neon Astro Blitz',
    'Test game verifying end-to-end Neon DB integration',
    '⚡',
    '<h1>Hello Neon!</h1>',
    'author-neon-tester',
    'NeonTestCadet',
    '🚀',
    10
  ]);
  console.log('✓ Inserted test game row into Neon Postgres');

  const verifyRow = await pooledPool.query('SELECT id, title, author_username, play_count FROM games WHERE id = $1', [testId]);
  console.log('✓ Read back game row from Neon Postgres:', verifyRow.rows[0]);

  // 6. Clean up test row
  await pooledPool.query('DELETE FROM games WHERE id = $1', [testId]);
  console.log('✓ Cleaned up test game row from Neon Postgres');

  await unpooledPool.end();
  await pooledPool.end();
  console.log('🎉 ALL NEON SERVICES & DATABASE OPERATIONS VERIFIED END-TO-END!');
}

run().catch((err) => {
  console.error('Error during Neon test:', err);
  process.exit(1);
});

