/**
 * Push SQL migrations to the Supabase database.
 *
 * Reads all .sql files from supabase/migrations/ in alphabetical order
 * and executes them against the Supabase Postgres database using the
 * pg connection string from SUPABASE_DB_URL.
 *
 * Usage: node scripts/push-migrations.cjs
 *
 * Requirements: npm install pg
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL (or DATABASE_URL) environment variable is not set.');
  console.error('Set it in .env.local or pass it inline:');
  console.error('  SUPABASE_DB_URL=postgresql://... node scripts/push-migrations.cjs');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function main() {
  // Read all migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found in', migrationsDir);
    return;
  }

  console.log(`Found ${files.length} migration(s):`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Connect to the database
  console.log('Connecting to Supabase database...');
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected.\n');

    // Create a migrations tracking table if it doesn't exist
    await client.query(`
      create table if not exists _migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    // Execute each migration that hasn't been applied yet
    for (const file of files) {
      const filepath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filepath, 'utf8');

      // Check if already applied
      const { rows } = await client.query(
        'select filename from _migrations where filename = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`⏭️  SKIP (already applied): ${file}`);
        continue;
      }

      console.log(`▶️  Applying: ${file}`);
      try {
        await client.query('begin');
        await client.query(sql);
        await client.query('insert into _migrations (filename) values ($1)', [file]);
        await client.query('commit');
        console.log(`✅ Applied: ${file}\n`);
      } catch (err) {
        await client.query('rollback');
        console.error(`❌ FAILED: ${file}`);
        console.error(`   Error: ${err.message}\n`);
        // Continue with next migration — some may fail on partial re-runs
        // but we still want to try the rest.
      }
    }

    // Verify
    const { rows: applied } = await client.query(
      'select filename, applied_at from _migrations order by filename'
    );
    console.log(`\n📋 Migration summary: ${applied.length} applied`);
    applied.forEach(m => console.log(`   ✅ ${m.filename} (at ${m.applied_at.toISOString()})`));

  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
