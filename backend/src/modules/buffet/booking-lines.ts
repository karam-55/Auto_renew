import { Prisma } from '@prisma/client';
import prisma from '../../config/database';

export const BUFFET_ATTACHED_TO_BOOKING = 'ATTACHED_TO_BOOKING';

export function buffetLinePrices(line: { priceSYP?: unknown; priceUSD?: unknown }, rate: number) {
  const usd = line.priceUSD == null ? 0 : Number(line.priceUSD);
  const syp = line.priceSYP == null ? 0 : Number(line.priceSYP);
  if (!(rate > 0)) return { priceSYP: syp, priceUSD: usd };
  if (usd > 0) return { priceSYP: Math.round(usd * rate), priceUSD: usd };
  return { priceSYP: syp, priceUSD: Math.round((syp / rate) * 100) / 100 };
}

export function loadAttachedBuffetLines(
  db: Prisma.TransactionClient | typeof prisma,
  tenantId: string,
  bookingId: string
) {
  return db.buffetSaleLine.findMany({
    where: { sale: { tenantId, bookingId, status: BUFFET_ATTACHED_TO_BOOKING } },
    include: { part: { select: { name: true, nameAr: true } } },
    orderBy: { createdAt: 'asc' },
  });
}
