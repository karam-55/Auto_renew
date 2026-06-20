import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { Logger } from '../infrastructure/logging/logger';

/**
 * Apply database views from prisma/views.sql
 * Run this after prisma migrate deploy to ensure views are created
 */
async function applyViews(): Promise<void> {
  const viewsPath = path.join(process.cwd(), 'prisma', 'views.sql');

  if (!fs.existsSync(viewsPath)) {
    Logger.warn('views.sql not found at: ' + viewsPath);
    return;
  }

  const sql = fs.readFileSync(viewsPath, 'utf-8');

  // Split by semicolons and filter out comments and empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let appliedCount = 0;
  for (const statement of statements) {
    // Skip DROP VIEW statements (they cause locks and slowness)
    if (statement.toUpperCase().includes('DROP VIEW')) {
      continue;
    }
    // Replace CREATE VIEW with CREATE OR REPLACE VIEW (faster, no drops needed)
    const optimizedStatement = statement
      .replace(/CREATE\s+VIEW\s+IF\s+NOT\s+EXISTS/i, 'CREATE OR REPLACE VIEW')
      .replace(/CREATE\s+VIEW/i, 'CREATE OR REPLACE VIEW');
    try {
      await prisma.$executeRawUnsafe(`${optimizedStatement};`);
      appliedCount++;
    } catch (error: any) {
      // Ignore "already exists" errors, log others
      if (!error.message?.includes('already exists')) {
        Logger.error('Error applying view:', error.message);
      }
    }
  }

  Logger.info(`Database views applied successfully (${appliedCount} statements)`);
}

// Only auto-run when executed directly (CLI), not when imported as a module
if (require.main === module) {
  applyViews().catch((error) => {
    console.error('Failed to apply views:', error);
    process.exit(1);
  });
}

export default applyViews;
