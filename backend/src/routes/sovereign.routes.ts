/**
 * ═══════════════════════════════════════════════════════════════
 *  SOVEREIGN CONTROL — لوحة سيادة المالك المطلقة
 *  نظام التحكم المطلق بقاعدة البيانات والموقع والسيرفر
 *  صاحب اللوحة: السيد عماد شكو — المالك الأعلى لـ Auto Renew
 * ═══════════════════════════════════════════════════════════════
 */

import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database';
import { Logger } from '../infrastructure/logging/logger';
import { AuditService } from '../services/audit.service';
import { sovereignState, setSovereignLock, requireSovereign } from '../middleware/sovereign-gate.middleware';

const router = Router();

// ─── Sovereign credentials (env-overridable) ─────────────────
const SOVEREIGN_USERNAME = process.env.SOVEREIGN_USERNAME || 'emad.shko';
const SOVEREIGN_PASSWORD = process.env.SOVEREIGN_PASSWORD || 'Sovereign-Emad-2026!';
const SOVEREIGN_JWT_SECRET = process.env.SOVEREIGN_JWT_SECRET || process.env.JWT_SECRET!;

// ─── Rate limiting for login attempts ────────────────────────
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function isLockedOut(ip: string): number {
  const rec = loginAttempts.get(ip);
  if (!rec) return 0;
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
    return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
  }
  return 0;
}

function recordFailedAttempt(ip: string): void {
  const rec = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCKOUT_MS;
    rec.count = 0;
  }
  loginAttempts.set(ip, rec);
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/** Extract client IP */
function ip(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/** Log owner action to audit trail */
async function logOwnerAction(req: Request, action: string, details?: any): Promise<void> {
  try {
    await AuditService.logAction({
      action: `SOVEREIGN_${action}`,
      entity: 'System',
      entityId: 'sovereign',
      before: null,
      after: details || {},
      ipAddress: ip(req),
      userAgent: AuditService.extractUserAgent(req),
    });
  } catch (e) {
    Logger.warn('Failed to log sovereign action');
  }
}

// ═══════════════════════════════════════════════════════════════
//  AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/** POST /api/sovereign/auth/login — login as sovereign owner */
router.post('/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'محاولات كثيرة — حاول لاحقاً' } },
}), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const clientIp = ip(req);

    if (isLockedOut(clientIp)) {
      const remaining = isLockedOut(clientIp);
      return res.status(429).json({ error: `تم قفل الحساب مؤقتاً. حاول مجدداً بعد ${remaining} ثانية` });
    }

    if (username !== SOVEREIGN_USERNAME || password !== SOVEREIGN_PASSWORD) {
      recordFailedAttempt(clientIp);
      Logger.warn('Sovereign login failed', { ip: clientIp, username });
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { scope: 'sovereign', role: 'SOVEREIGN', username: SOVEREIGN_USERNAME },
      SOVEREIGN_JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logOwnerAction(req, 'LOGIN', { username });
    res.json({ token, expiresIn: 12 * 3600 });
  } catch (error) {
    Logger.error('Sovereign login error:', error);
    res.status(500).json({ error: 'فشل تسجيل الدخول' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SYSTEM CONTROL (kill switch)
// ═══════════════════════════════════════════════════════════════

/** GET /api/sovereign/status — current lock state + server stats */
router.get('/status', requireSovereign, async (_req: Request, res: Response) => {
  try {
    // Check DB connectivity first
    let dbConnected = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbConnected = false;
    }

    const [userCount, customerCount, dealerCount, warrantyCount, invoiceCount, bookingCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.customer.count().catch(() => 0),
      prisma.dealer.count().catch(() => 0),
      prisma.dealerWarranty.count().catch(() => 0),
      prisma.invoice.count().catch(() => 0),
      prisma.booking.count().catch(() => 0),
    ]);

    res.json({
      system: {
        locked: sovereignState.locked,
        lockedAt: sovereignState.lockedAt,
        dbConnected,
      },
      stats: { users: userCount, customers: customerCount, dealers: dealerCount, warranties: warrantyCount, invoices: invoiceCount, bookings: bookingCount },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    Logger.error('Sovereign status error:', error);
    res.status(500).json({ error: 'فشل جلب حالة النظام' });
  }
});

/** POST /api/sovereign/lock — engage maintenance mode (kill switch) */
router.post('/lock', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'أطفئ النظام' && confirm !== 'LOCK_SYSTEM') {
      return res.status(400).json({ error: 'تأكيد الإيقاف مطلوب — أدخل "أطفئ النظام"' });
    }

    await setSovereignLock(true, 'sovereign');
    await logOwnerAction(req, 'SYSTEM_LOCKED', { confirm });

    Logger.warn('SOVEREIGN LOCK ENGAGED — all apps blocked');
    res.json({ locked: true, message: 'تم إيقاف جميع التطبيقات — لوحة المالك فقط تعمل' });
  } catch (error) {
    Logger.error('Sovereign lock error:', error);
    res.status(500).json({ error: 'فشل إيقاف النظام' });
  }
});

/** POST /api/sovereign/unlock — release the lock */
router.post('/unlock', requireSovereign, async (req: Request, res: Response) => {
  try {
    await setSovereignLock(false, 'sovereign');
    await logOwnerAction(req, 'SYSTEM_UNLOCKED');

    Logger.info('Sovereign lock released — all apps operational');
    res.json({ locked: false, message: 'تم تشغيل النظام بالكامل' });
  } catch (error) {
    Logger.error('Sovereign unlock error:', error);
    res.status(500).json({ error: 'فشل تشغيل النظام' });
  }
});

/** POST /api/sovereign/restart — restart the server process (Docker/PM2 brings it back) */
router.post('/restart', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'RESTART_SERVER') {
      return res.status(400).json({ error: 'تأكيد إعادة التشغيل مطلوب — أرسل confirm: "RESTART_SERVER"' });
    }

    await logOwnerAction(req, 'SERVER_RESTART');
    Logger.warn('SOVEREIGN RESTART requested — process exiting for process-manager restart');

    res.json({ restarting: true, message: 'جاري إعادة تشغيل السيرفر — سيعود خلال ثوانٍ' });

    // Give the HTTP response time to flush, then exit.
    // The container/process manager (restart: unless-stopped) brings it back.
    setTimeout(() => process.exit(0), 800);
  } catch (error) {
    Logger.error('Sovereign restart error:', error);
    res.status(500).json({ error: 'فشل إعادة تشغيل السيرفر' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  DATABASE CONTROL
// ═══════════════════════════════════════════════════════════════

/** GET /api/sovereign/tables — list all tables with row counts */
router.get('/tables', requireSovereign, async (_req: Request, res: Response) => {
  try {
    // Quick DB connectivity check
    try { await prisma.$queryRaw`SELECT 1`; } catch {
      return res.json({ tables: [], dbOffline: true, message: 'قاعدة البيانات غير متصلة' });
    }
    const tables: any[] = await (prisma as any).$queryRawUnsafe(`
      SELECT table_name as name,
             (SELECT COUNT(*) FROM information_schema.tables t2
              WHERE t2.table_name = t.table_name AND t2.table_schema = 'public') as rows
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name
    `);

    // Add approximate row counts for performance
    const counts = await Promise.all(
      tables.map(async (t: any) => {
        try {
          const c: any[] = await (prisma as any).$queryRawUnsafe(`SELECT COUNT(*)::bigint as n FROM "${t.name}"`);
          return { name: t.name, rows: Number(c[0]?.n ?? 0) };
        } catch {
          return { name: t.name, rows: -1 };
        }
      })
    );

    res.json({ tables: counts });
  } catch (error) {
    Logger.error('Sovereign tables error:', error);
    res.status(500).json({ error: 'فشل جلب الجداول' });
  }
});

/** GET /api/sovereign/table/:name — browse table rows (paginated) */
router.get('/table/:name', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Whitelist table names from information_schema
    const validTables: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      name
    );
    if (validTables.length === 0) {
      return res.status(404).json({ error: 'جدول غير موجود' });
    }

    const [rows, countRows] = await Promise.all([
      (prisma as any).$queryRawUnsafe(`SELECT * FROM "${name}" ORDER BY 1 LIMIT ${limit} OFFSET ${offset}`),
      (prisma as any).$queryRawUnsafe(`SELECT COUNT(*)::bigint as n FROM "${name}"`),
    ]);

    res.json({
      table: name,
      page,
      limit,
      total: Number(countRows[0]?.n ?? 0),
      rows,
    });
  } catch (error) {
    Logger.error('Sovereign table browse error:', error);
    res.status(500).json({ error: 'فشل جلب البيانات' });
  }
});

/** Helper: fetch column metadata + primary key flags for a public table */
async function getTableColumns(name: string): Promise<{ name: string; type: string; nullable: boolean; isPk: boolean }[]> {
  const cols: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT c.column_name as name, c.data_type as type,
            (c.is_nullable = 'YES') as nullable,
            EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
               AND tc.table_name = kcu.table_name
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = c.table_name
                AND kcu.column_name = c.column_name
            ) as "isPk"
     FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = $1
     ORDER BY c.ordinal_position`,
    name
  );
  return cols;
}

/** Normalize a JSON value for use as a Postgres query parameter */
function sqlParam(v: any): any {
  if (v === undefined) return null;
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

/** GET /api/sovereign/table/:name/schema — column metadata for the row editor */
router.get('/table/:name/schema', requireSovereign, async (req: Request, res: Response) => {
  try {
    const columns = await getTableColumns(req.params.name);
    if (columns.length === 0) {
      return res.status(404).json({ error: 'جدول غير موجود' });
    }
    res.json({ table: req.params.name, columns });
  } catch (error) {
    Logger.error('Sovereign schema error:', error);
    res.status(500).json({ error: 'فشل جلب بنية الجدول' });
  }
});

/** PUT /api/sovereign/table/:name/row — update a row by its primary key */
router.put('/table/:name/row', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { pk, data } = req.body;
    if (!pk || typeof pk !== 'object' || !data || typeof data !== 'object') {
      return res.status(400).json({ error: 'مطلوب pk و data' });
    }

    const columns = await getTableColumns(name);
    if (columns.length === 0) return res.status(404).json({ error: 'جدول غير موجود' });

    const pkCols = columns.filter(c => c.isPk).map(c => c.name);
    if (pkCols.length === 0) return res.status(400).json({ error: 'الجدول بلا مفتاح أساسي — استخدم SQL Console' });
    for (const k of pkCols) {
      if (pk[k] === undefined || pk[k] === null) {
        return res.status(400).json({ error: `قيمة المفتاح الأساسي "${k}" مطلوبة` });
      }
    }

    const validNames = new Set(columns.map(c => c.name));
    const setCols = Object.keys(data).filter(k => validNames.has(k) && !pkCols.includes(k));
    if (setCols.length === 0) return res.status(400).json({ error: 'لا توجد أعمدة صالحة للتحديث' });

    const params: any[] = [];
    const setClause = setCols.map(c => {
      params.push(sqlParam(data[c]));
      return `"${c}" = $${params.length}`;
    }).join(', ');
    const whereClause = pkCols.map(c => {
      params.push(sqlParam(pk[c]));
      return `"${c}" = $${params.length}`;
    }).join(' AND ');

    const updated: any[] = await (prisma as any).$queryRawUnsafe(
      `UPDATE "${name}" SET ${setClause} WHERE ${whereClause} RETURNING *`,
      ...params
    );

    if (updated.length === 0) return res.status(404).json({ error: 'السطر غير موجود' });

    await logOwnerAction(req, 'ROW_UPDATE', { table: name, pk, columns: setCols });
    res.json({ success: true, row: updated[0] });
  } catch (error: any) {
    Logger.error('Sovereign row update error:', error);
    res.status(500).json({ error: `فشل التحديث: ${error.message?.substring(0, 200)}` });
  }
});

/** DELETE /api/sovereign/table/:name/row — delete a row by its primary key */
router.delete('/table/:name/row', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { pk } = req.body;
    if (!pk || typeof pk !== 'object') {
      return res.status(400).json({ error: 'مطلوب pk' });
    }

    const columns = await getTableColumns(name);
    if (columns.length === 0) return res.status(404).json({ error: 'جدول غير موجود' });

    const pkCols = columns.filter(c => c.isPk).map(c => c.name);
    if (pkCols.length === 0) return res.status(400).json({ error: 'الجدول بلا مفتاح أساسي — استخدم SQL Console' });
    for (const k of pkCols) {
      if (pk[k] === undefined || pk[k] === null) {
        return res.status(400).json({ error: `قيمة المفتاح الأساسي "${k}" مطلوبة` });
      }
    }

    const params: any[] = [];
    const whereClause = pkCols.map(c => {
      params.push(sqlParam(pk[c]));
      return `"${c}" = $${params.length}`;
    }).join(' AND ');

    const deleted = await (prisma as any).$executeRawUnsafe(
      `DELETE FROM "${name}" WHERE ${whereClause}`,
      ...params
    );

    if (Number(deleted) === 0) return res.status(404).json({ error: 'السطر غير موجود' });

    await logOwnerAction(req, 'ROW_DELETE', { table: name, pk });
    res.json({ success: true, deleted: Number(deleted) });
  } catch (error: any) {
    Logger.error('Sovereign row delete error:', error);
    res.status(500).json({ error: `فشل الحذف: ${error.message?.substring(0, 200)}` });
  }
});

/** POST /api/sovereign/query — raw SQL console (SELECT by default) */
router.post('/query', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { sql, confirm } = req.body;
    if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
      return res.status(400).json({ error: 'استعلام SQL مطلوب' });
    }

    const trimmed = sql.trim().toLowerCase();
    const isSelect = trimmed.startsWith('select') || trimmed.startsWith('with') || trimmed.startsWith('explain');

    if (!isSelect && confirm !== 'EXECUTE_DANGEROUS') {
      return res.status(400).json({
        error: 'استعلامات تعديل تتطلب تأكيد — أرسل confirm: "EXECUTE_DANGEROUS"',
        warning: true,
      });
    }

    const start = Date.now();
    const result: any = await (prisma as any).$queryRawUnsafe(sql);
    const duration = Date.now() - start;

    await logOwnerAction(req, 'RAW_QUERY', { sql: sql.substring(0, 200), duration, rows: Array.isArray(result) ? result.length : 1 });

    res.json({ success: true, duration_ms: duration, rows: result });
  } catch (error: any) {
    Logger.error('Sovereign query error:', error);
    res.status(500).json({ error: `خطأ في الاستعلام: ${error.message?.substring(0, 200)}` });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ENTITY DETAILS — rich views for dashboard stat cards
// ═══════════════════════════════════════════════════════════════

/** GET /api/sovereign/entity/:type — detailed records with relations */
router.get('/entity/:type', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const skip = (page - 1) * limit;

    switch (type) {
      case 'warranties': {
        const [rows, total] = await Promise.all([
          prisma.dealerWarranty.findMany({
            where: { deletedAt: null },
            include: { dealer: { select: { name: true, companyName: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
          }),
          prisma.dealerWarranty.count({ where: { deletedAt: null } }),
        ]);
        return res.json({ rows, total, page, limit });
      }

      case 'customers': {
        const [rows, total] = await Promise.all([
          prisma.customer.findMany({
            include: {
              vehicles: { select: { make: true, model: true, year: true, licensePlate: true, color: true } },
              _count: { select: { bookings: true, invoices: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
          }),
          prisma.customer.count(),
        ]);
        return res.json({ rows, total, page, limit });
      }

      case 'dealers': {
        const [rows, total] = await Promise.all([
          prisma.dealer.findMany({
            include: { _count: { select: { warranties: true } } },
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
          }),
          prisma.dealer.count(),
        ]);
        // Strip password field before sending
        const sanitized = rows.map(({ password: _p, ...rest }) => rest);
        return res.json({ rows: sanitized, total, page, limit });
      }

      case 'users': {
        const [rows, total] = await Promise.all([
          prisma.user.findMany({
            select: {
              id: true, fullName: true, username: true, phone: true,
              role: true, isActive: true, createdAt: true,
              tenant: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
          }),
          prisma.user.count(),
        ]);
        return res.json({ rows, total, page, limit });
      }

      case 'bookings': {
        const [rows, total] = await Promise.all([
          prisma.booking.findMany({
            where: { deletedAt: null },
            include: {
              customer: { select: { fullName: true, phone: true } },
              vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
              _count: { select: { bookingServices: true, invoices: true, tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
          }),
          prisma.booking.count({ where: { deletedAt: null } }),
        ]);
        return res.json({ rows, total, page, limit });
      }

      case 'invoices': {
        const [rows, total] = await Promise.all([
          prisma.invoice.findMany({
            include: {
              customer: { select: { fullName: true, phone: true } },
              vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
              _count: { select: { items: true, payments: true } },
            },
            orderBy: { invoiceDate: 'desc' },
            skip, take: limit,
          }),
          prisma.invoice.count(),
        ]);
        return res.json({ rows, total, page, limit });
      }

      default:
        return res.status(400).json({ error: 'نوع غير معروف' });
    }
  } catch (error) {
    Logger.error('Sovereign entity details error:', error);
    res.status(500).json({ error: 'فشل جلب التفاصيل' });
  }
});

/** PUT /api/sovereign/entity/warranties/:id — update a warranty */
router.put('/entity/warranties/:id', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const allowed = [
      'customerName', 'customerPhone', 'manufacturer', 'vehicleModel', 'vehicleYear',
      'chassisNumber', 'plateNumber', 'mileage', 'color', 'durationMonths',
      'amountPaid', 'currency', 'startDate', 'endDate', 'isActive', 'dealerId',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'لا توجد حقول للتعديل' });
    }

    // Type coercion
    if (data.vehicleYear !== undefined) data.vehicleYear = parseInt(String(data.vehicleYear), 10);
    if (data.mileage !== undefined) data.mileage = parseInt(String(data.mileage), 10);
    if (data.durationMonths !== undefined) data.durationMonths = parseInt(String(data.durationMonths), 10);
    if (data.amountPaid !== undefined) data.amountPaid = parseFloat(String(data.amountPaid));
    if (data.startDate) data.startDate = new Date(String(data.startDate));
    if (data.endDate) data.endDate = new Date(String(data.endDate));
    if (data.isActive !== undefined) data.isActive = Boolean(data.isActive);

    const before = await prisma.dealerWarranty.findUnique({ where: { id } });
    if (!before) return res.status(404).json({ error: 'الكفالة غير موجودة' });

    const updated = await prisma.dealerWarranty.update({ where: { id }, data });
    await logOwnerAction(req, 'WARRANTY_UPDATED', { id, before, after: updated });
    Logger.info(`Sovereign warranty updated: ${id}`);
    res.json({ success: true, row: updated });
  } catch (error: any) {
    Logger.error('Sovereign warranty update error:', error);
    res.status(500).json({ error: `فشل التعديل: ${error.message?.substring(0, 150)}` });
  }
});

/** DELETE /api/sovereign/entity/warranties/:id — delete a warranty (soft delete) */
router.delete('/entity/warranties/:id', requireSovereign, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const before = await prisma.dealerWarranty.findUnique({ where: { id } });
    if (!before) return res.status(404).json({ error: 'الكفالة غير موجودة' });

    await prisma.dealerWarranty.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await logOwnerAction(req, 'WARRANTY_DELETED', { id, deleted: before });
    Logger.warn(`Sovereign warranty deleted: ${id}`);
    res.json({ success: true, message: 'تم حذف الكفالة' });
  } catch (error: any) {
    Logger.error('Sovereign warranty delete error:', error);
    res.status(500).json({ error: `فشل الحذف: ${error.message?.substring(0, 150)}` });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AUDIT & LOGS
// ═══════════════════════════════════════════════════════════════

/** GET /api/sovereign/audit — owner action audit log */
router.get('/audit', requireSovereign, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const logs = await prisma.auditLog.findMany({
      where: { action: { startsWith: 'SOVEREIGN_' } },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.auditLog.count({
      where: { action: { startsWith: 'SOVEREIGN_' } },
    });

    res.json({ logs, total, page, limit });
  } catch (error) {
    Logger.error('Sovereign audit error:', error);
    res.status(500).json({ error: 'فشل جلب سجل العمليات' });
  }
});

export default router;
