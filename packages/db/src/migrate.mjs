import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Resolve environment variables if running locally
const envPaths = [
  path.resolve(__dirname, '../../../.env.local'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../web/.env.local'),
];

for (const envFile of envPaths) {
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key] && val) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

const connectionString =
  process.env['DATABASE_URL_UNPOOLED'] || process.env['DATABASE_URL'];

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL or DATABASE_URL_UNPOOLED is required.');
  process.exit(1);
}

const isLocal =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing database schema migrations...');

    // Ensure migration tracker table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__pyra_migrations" (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.resolve(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn('⚠️ No migrations directory found at', migrationsDir);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query(
      'SELECT name FROM "__pyra_migrations"',
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ [Skipping] ${file} (already applied)`);
        continue;
      }

      console.log(`⚡ [Applying] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO "__pyra_migrations" (name) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`✅ [Applied]  ${file}`);
      } catch (migrationError) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed in ${file}:`, migrationError.message);
        throw migrationError;
      }
    }

    console.log('🎉 All migrations applied successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
