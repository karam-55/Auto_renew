import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Database Audit Utility
 * Runtime checks for database health, missing indexes, and optimization opportunities.
 */

export interface DbAuditResult {
  tableName: string;
  rowCount: number;
  hasPrimaryKey: boolean;
  hasTenantIdIndex: boolean;
  hasDeletedAtFilter: boolean;
  missingIndexes: string[];
  recommendations: string[];
}

export interface DbHealthReport {
  timestamp: string;
  totalTables: number;
  totalRows: number;
  tablesWithMissingIndexes: number;
  largeTables: { table: string; rows: number }[];
  auditResults: DbAuditResult[];
}

/**
 * Audit a single table for missing indexes and optimizations
 */
async function auditTable(tableName: string): Promise<DbAuditResult> {
  try {
    // Get row count
    const countResult: any = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM "${tableName}"`
    );
    const rowCount = Array.isArray(countResult) ? countResult[0]?.count || 0 : 0;

    // Check for primary key
    const pkResult: any = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = '${tableName}' 
      AND indexname LIKE '%pkey%'
    `);
    const hasPrimaryKey = Array.isArray(pkResult) && pkResult.length > 0;

    // Check for tenantId index
    const tenantIdxResult: any = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = '${tableName}' 
      AND indexdef LIKE '%tenantId%'
    `);
    const hasTenantIdIndex = Array.isArray(tenantIdxResult) && tenantIdxResult.length > 0;

    // Check if table has deletedAt column
    const hasDeletedAtResult: any = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = 'deletedAt'
    `);
    const hasDeletedAt = Array.isArray(hasDeletedAtResult) && hasDeletedAtResult.length > 0;

    const missingIndexes: string[] = [];
    const recommendations: string[] = [];

    if (!hasPrimaryKey) {
      missingIndexes.push('PRIMARY KEY');
      recommendations.push(`Add PRIMARY KEY to ${tableName}`);
    }

    if (!hasTenantIdIndex && rowCount > 100) {
      missingIndexes.push('tenantId');
      recommendations.push(`Add index on tenantId for ${tableName} (${rowCount} rows)`);
    }

    if (hasDeletedAt && rowCount > 1000) {
      recommendations.push(`Consider composite index on (tenantId, deletedAt) for ${tableName}`);
    }

    if (rowCount > 100000) {
      recommendations.push(`Table ${tableName} has ${rowCount} rows - consider archiving old data`);
    }

    return {
      tableName,
      rowCount,
      hasPrimaryKey,
      hasTenantIdIndex,
      hasDeletedAtFilter: hasDeletedAt,
      missingIndexes,
      recommendations,
    };
  } catch (error) {
    Logger.error(`Error auditing table ${tableName}`, error);
    return {
      tableName,
      rowCount: 0,
      hasPrimaryKey: false,
      hasTenantIdIndex: false,
      hasDeletedAtFilter: false,
      missingIndexes: [],
      recommendations: [`Error auditing: ${(error as Error).message}`],
    };
  }
}

/**
 * Get all tables in the database
 */
async function getAllTables(): Promise<string[]> {
  const result: any = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE '_prisma_%'
    AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename
  `);
  return Array.isArray(result) ? result.map((r: any) => r.tablename) : [];
}

/**
 * Run comprehensive database audit
 */
export async function runDatabaseAudit(): Promise<DbHealthReport> {
  const tables = await getAllTables();
  const auditResults: DbAuditResult[] = [];
  let totalRows = 0;
  let tablesWithMissingIndexes = 0;
  const largeTables: { table: string; rows: number }[] = [];

  for (const table of tables) {
    const result = await auditTable(table);
    auditResults.push(result);
    totalRows += result.rowCount;

    if (result.missingIndexes.length > 0) {
      tablesWithMissingIndexes++;
    }

    if (result.rowCount > 50000) {
      largeTables.push({ table, rows: result.rowCount });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalTables: tables.length,
    totalRows,
    tablesWithMissingIndexes,
    largeTables: largeTables.sort((a, b) => b.rows - a.rows),
    auditResults: auditResults.filter((r) => r.recommendations.length > 0),
  };
}

/**
 * Check for unused indexes (run sparingly - can be slow)
 */
export async function getUnusedIndexes(): Promise<any[]> {
  try {
    const result: any = await prisma.$queryRawUnsafe(`
      SELECT 
        schemaname,
        relname as table,
        indexrelname as index,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      AND indexrelname NOT LIKE '%pkey%'
      AND indexrelname NOT LIKE '%unique%'
      ORDER BY relname, indexrelname
    `);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    Logger.error('Error getting unused indexes', error);
    return [];
  }
}

/**
 * Get table size information
 */
export async function getTableSizes(): Promise<any[]> {
  try {
    const result: any = await prisma.$queryRawUnsafe(`
      SELECT 
        relname as table,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        pg_size_pretty(pg_relation_size(relid)) as table_size,
        pg_size_pretty(pg_indexes_size(relid)) as index_size,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(relid) DESC
    `);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    Logger.error('Error getting table sizes', error);
    return [];
  }
}
