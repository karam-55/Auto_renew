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

    const [userCount, customerCount, dealerCount, warrantyCount, invoiceCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.customer.count().catch(() => 0),
      prisma.dealer.count().catch(() => 0),
      prisma.dealerWarranty.count().catch(() => 0),
      prisma.invoice.count().catch(() => 0),
    ]);

    res.json({
      system: {
        locked: sovereignState.locked,
        lockedAt: sovereignState.lockedAt,
        dbConnected,
      },
      stats: { users: userCount, customers: customerCount, dealers: dealerCount, warranties: warrantyCount, invoices: invoiceCount },
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
            include: { dealer: { select: { name: true, companyName: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
          }),
          prisma.dealerWarranty.count(),
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
