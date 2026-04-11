"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
const ALREADY_EXISTS_CODES = new Set([
    '42710',
    '42P07',
    '42701',
    '42P16',
    '23505',
    '42704',
]);
const createMigrationsTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
    await (0, connection_1.query)(sql);
};
const getExecutedMigrations = async () => {
    const result = await (0, connection_1.query)('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map((row) => row.filename);
};
const markMigrationExecuted = async (filename) => {
    await (0, connection_1.query)('INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [filename]);
};
const splitStatements = (sql) => {
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    let dollarTag = '';
    const lines = sql.split('\n');
    for (const line of lines) {
        const dollarMatches = line.match(/\$[^$]*\$/g) ?? [];
        for (const tag of dollarMatches) {
            if (!inDollarQuote) {
                inDollarQuote = true;
                dollarTag = tag;
            }
            else if (tag === dollarTag) {
                inDollarQuote = false;
                dollarTag = '';
            }
        }
        current += line + '\n';
        if (!inDollarQuote && line.trimEnd().endsWith(';')) {
            const stmt = current.trim();
            if (stmt && stmt !== ';')
                statements.push(stmt);
            current = '';
        }
    }
    const trailing = current.trim();
    if (trailing && trailing !== ';')
        statements.push(trailing);
    return statements.filter(s => s.length > 0);
};
const runMigrations = async () => {
    console.log('🔄 Starting database migrations...');
    const connected = await (0, connection_1.testConnection)();
    if (!connected)
        throw new Error('Database connection failed');
    await createMigrationsTable();
    let migrationsDir = path_1.default.join(__dirname, 'migrations');
    if (!fs_1.default.existsSync(migrationsDir)) {
        migrationsDir = path_1.default.join(process.cwd(), 'src', 'database', 'migrations');
    }
    const migrationFiles = fs_1.default.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    const executedMigrations = await getExecutedMigrations();
    for (const file of migrationFiles) {
        if (executedMigrations.includes(file)) {
            console.log(`⏭️  Already executed: ${file}`);
            continue;
        }
        console.log(`📝 Running migration: ${file}`);
        const filePath = path_1.default.join(migrationsDir, file);
        const sql = fs_1.default.readFileSync(filePath, 'utf8');
        const statements = splitStatements(sql);
        let skippedCount = 0;
        for (const stmt of statements) {
            try {
                await (0, connection_1.query)(stmt);
            }
            catch (err) {
                if (ALREADY_EXISTS_CODES.has(err.code)) {
                    skippedCount++;
                    console.warn(`   ⚠️  Skipped (already exists): ${err.message.split('\n')[0]}`);
                }
                else {
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
exports.runMigrations = runMigrations;
if (require.main === module) {
    runMigrations()
        .then(() => {
        console.log('✅ Migration process completed');
        (0, connection_1.closePool)();
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration process failed:', error);
        (0, connection_1.closePool)();
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map