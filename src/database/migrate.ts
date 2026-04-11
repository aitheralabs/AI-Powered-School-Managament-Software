import fs from 'fs';
import path from 'path';
import { query, testConnection, closePool } from './connection';

// PostgreSQL error codes that mean "object already exists" — safe to skip
const ALREADY_EXISTS_CODES = new Set([
  '42710', // duplicate_object        (trigger/rule already exists)
  '42P07', // duplicate_table
  '42701', // duplicate_column
  '42P16', // invalid_table_definition (e.g. generated column conflict)
  '23505', // unique_violation         (constraint already present)
  '42704', // undefined_object         (DROP of non-existent — IF NOT EXISTS missing)
]);

// Migration tracking table
const createMigrationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await query(sql);
};

// Get executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await query('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map((row: any) => row.filename);
};

// Mark migration as executed
const markMigrationExecuted = async (filename: string) => {
  await query(
    'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
    [filename]
  );
};

// Split a SQL file into individual statements so we can run them one by one
// and skip individual statements that fail with "already exists".
const splitStatements = (sql: string): string[] => {
  // Naive split on semicolons — good enough for DDL migration files.
  // Preserves dollar-quoted function bodies ($$...$$) by not splitting inside them.
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  const lines = sql.split('\n');
  for (const line of lines) {
    // Detect start/end of dollar-quoted block (e.g. $$ or $BODY$)
    const dollarMatches = line.match(/\$[^$]*\$/g) ?? [];
    for (const tag of dollarMatches) {
      if (!inDollarQuote) {
        inDollarQuote = true;
        dollarTag = tag;
      } else if (tag === dollarTag) {
        inDollarQuote = false;
        dollarTag = '';
      }
    }

    current += line + '\n';

    if (!inDollarQuote && line.trimEnd().endsWith(';')) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') statements.push(stmt);
      current = '';
    }
  }

  // Catch any trailing statement without a semicolon
  const trailing = current.trim();
  if (trailing && trailing !== ';') statements.push(trailing);

  return statements.filter(s => s.length > 0);
};

// Run migrations
const runMigrations = async () => {
  console.log('🔄 Starting database migrations...');

  const connected = await testConnection();
  if (!connected) throw new Error('Database connection failed');

  await createMigrationsTable();

  // Resolve migrations directory (works from both src/ and dist/)
  let migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.join(process.cwd(), 'src', 'database', 'migrations');
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  const executedMigrations = await getExecutedMigrations();

  for (const file of migrationFiles) {
    if (executedMigrations.includes(file)) {
      console.log(`⏭️  Already executed: ${file}`);
      continue;
    }

    console.log(`📝 Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = splitStatements(sql);

    let skippedCount = 0;
    for (const stmt of statements) {
      try {
        await query(stmt);
      } catch (err: any) {
        if (ALREADY_EXISTS_CODES.has(err.code)) {
          // Object already exists from a previous partial run — safe to skip
          skippedCount++;
          console.warn(
            `   ⚠️  Skipped (already exists): ${err.message.split('\n')[0]}`
          );
        } else {
          // Real error — abort
          console.error(`   ❌ Failed statement:\n${stmt}\n`);
          throw err;
        }
      }
    }

    await markMigrationExecuted(file);
    const note = skippedCount > 0 ? ` (${skippedCount} stmt(s) skipped — already existed)` : '';
    console.log(`✅ Migration completed: ${file}${note}`);
  }

  console.log('🎉 All migrations completed successfully!');
};

// CLI execution
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process completed');
      closePool();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      closePool();
      process.exit(1);
    });
}

export { runMigrations };
