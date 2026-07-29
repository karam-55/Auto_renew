const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const migrationsDir = path.resolve(__dirname, '..', 'backend', 'prisma', 'migrations');
const outputFile = path.resolve(__dirname, 'baseline-prisma-migrations.sql');

function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  // Normalize to LF to match how files are stored in git and checked out on Linux servers
  const normalized = data.toString().replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(normalized).digest('hex').toLowerCase();
}

function uuid() {
  return crypto.randomUUID();
}

const migrations = fs
  .readdirSync(migrationsDir)
  .filter(name => /^20/.test(name))
  .sort();

const lines = [];
lines.push('-- Baselining SQL for Prisma migrations');
lines.push('-- Run this script ONCE on the production server before using `prisma migrate deploy`');
lines.push('-- It creates the _prisma_migrations table (if missing) and marks all existing migrations as already applied.');
lines.push('');
lines.push('CREATE TABLE IF NOT EXISTS "_prisma_migrations" (');
lines.push('  "id"                      VARCHAR(36) PRIMARY KEY NOT NULL,');
lines.push('  "checksum"                VARCHAR(64) NOT NULL,');
lines.push('  "finished_at"             TIMESTAMPTZ,');
lines.push('  "migration_name"          VARCHAR(255) NOT NULL,');
lines.push('  "logs"                    TEXT,');
lines.push('  "rolled_back_at"          TIMESTAMPTZ,');
lines.push('  "started_at"              TIMESTAMPTZ NOT NULL DEFAULT now(),');
lines.push('  "applied_steps_count"     INTEGER NOT NULL DEFAULT 0');
lines.push(');');
lines.push('');
lines.push('CREATE UNIQUE INDEX IF NOT EXISTS "_prisma_migrations_migration_name_key" ON "_prisma_migrations" ("migration_name");');
lines.push('');

for (const migrationName of migrations) {
  const migrationFile = path.join(migrationsDir, migrationName, 'migration.sql');
  if (!fs.existsSync(migrationFile)) continue;

  const checksum = sha256(migrationFile);
  const id = uuid();

  lines.push('INSERT INTO "_prisma_migrations" (');
  lines.push('  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count"');
  lines.push(') VALUES (');
  lines.push(`  '${id}', '${checksum}', now(), '${migrationName}', NULL, NULL, now(), 1`);
  lines.push(')');
  lines.push('ON CONFLICT ("migration_name") DO NOTHING;');
  lines.push('');
}

fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');
console.log(`Baseline SQL written to: ${outputFile}`);
