/**
 * ═══════════════════════════════════════════════════════════════
 *  SOVEREIGN CONTROL — لوحة سيادة المالك المطلقة
 *  نظام التحكم المطلق بقاعدة البيانات والموقع والسيرفر
 *  صاحب اللوحة: السيد عماد شكو — المالك الأعلى لـ Auto Renew
 * ═══════════════════════════════════════════════════════════════
 *
 *  الصلاحيات:
 *   • قفل/فتح النظام بالكامل (زر الطوارئ)
 *   • تصفح كل جداول قاعدة البيانات وتعديلها
 *   • إعادة تشغيل السيرفر
 *   • سجل تدقيق كامل لكل عملية
 *
 *  الدخول: /sovereign  (بيانات الدخول من متغيرات البيئة)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { Logger } from '../infrastructure/logging/logger';

// ─── Sovereign credentials (env-overridable) ─────────────────
const SOVEREIGN_USERNAME = process.env.SOVEREIGN_USERNAME || 'emad.shko';
const SOVEREIGN_PASSWORD = process.env.SOVEREIGN_PASSWORD || 'Sovereign-Emad-2026!';
const SOVEREIGN_JWT_SECRET = process.env.SOVEREIGN_JWT_SECRET || process.env.JWT_SECRET!;

// ─── In-memory sovereign state ───────────────────────────────
export const sovereignState = { locked: false, lockedAt: null as Date | null };

export function isLocked(): boolean {
  return sovereignState.locked;
}

export async function loadSovereignState(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS _sovereign_control (
        id INT PRIMARY KEY DEFAULT 1,
        locked BOOLEAN NOT NULL DEFAULT false,
        changed_by TEXT,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT locked FROM _sovereign_control WHERE id = 1`
    );
    if (rows.length > 0) {
      sovereignState.locked = Boolean(rows[0].locked);
    }
    Logger.info(`Sovereign gate initialized (locked=${sovereignState.locked})`);
  } catch (err) {
    Logger.warn('Sovereign gate: control table unavailable, starting unlocked');
  }
}

export async function setSovereignLock(locked: boolean, by: string): Promise<void> {
  sovereignState.locked = locked;
  sovereignState.lockedAt = locked ? new Date() : null;
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO _sovereign_control (id, locked, changed_by, changed_at)
      VALUES (1, ${locked}, '${by.replace(/'/g, "''")}', NOW())
      ON CONFLICT (id) DO UPDATE SET locked = ${locked}, changed_at = NOW()
    `);
  } catch (err) {
    // DB may be unreachable — lock still works in-memory
    Logger.warn('Sovereign lock persisted in-memory only (DB unreachable)');
  }
}

/** The gate: blocks all API traffic when the sovereign lock is ON */
export function sovereignGate(req: Request, res: Response, next: NextFunction): void {
  if (!sovereignState.locked) return next();

  // Sovereign panel routes always pass through (mounted on /api and /api/v1)
  const url = req.originalUrl;
  if (url.startsWith('/api/sovereign') || url.startsWith('/api/v1/sovereign')) return next();
  if (req.path === '/health' || req.path === '/metrics') return next();

  res.status(503).json({
    success: false,
    error: {
      code: 'SYSTEM_LOCKED',
      message: 'النظام تحت سيطرة المالك الكاملة — جميع الخدمات متوقفة مؤقتاً',
    },
  });
}

// ─── Sovereign auth middleware ────────────────────────────────
export function requireSovereign(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'مطلوب رمز السيادة' });
    return;
  }
  const payload = verifySovereignToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: 'جلسة غير صالحة' });
    return;
  }
  (req as any).sovereign = payload;
  next();
}

function verifySovereignToken(token: string): { role: string; username: string } | null {
  try {
    const payload = jwt.verify(token, SOVEREIGN_JWT_SECRET) as any;
    if (payload?.scope !== 'sovereign' || payload?.role !== 'SOVEREIGN') return null;
    return { role: payload.role, username: payload.username };
  } catch {
    return null;
  }
}
