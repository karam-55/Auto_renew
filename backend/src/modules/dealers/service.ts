import { PrismaClient, DealerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Logger } from '../../infrastructure/logging/logger';
import { generateWarrantyPdf } from './pdf-generator';
import { WhatsAppService } from '../whatsapp/service';
import { WhatChimpService } from '../whatsapp/whatchimp.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class DealerService {
  async register(data: { name: string; phone: string; password: string; companyName: string; address?: string; tenantId: string }) {
    const existing = await prisma.dealer.findFirst({
      where: { phone: data.phone, deletedAt: null },
    });
    if (existing) {
      throw new Error('Phone already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const dealer = await prisma.dealer.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        companyName: data.companyName,
        address: data.address,
        tenantId: data.tenantId,
        status: DealerStatus.ACTIVE,
        isActive: true,
      },
    });

    const { password: _, ...dealerWithoutPassword } = dealer as any;
    const token = jwt.sign(
      { dealerId: dealer.id, tenantId: dealer.tenantId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { dealer: dealerWithoutPassword, token };
  }

  async login(data: { phone: string; password: string }) {
    const dealer = await prisma.dealer.findFirst({
      where: { phone: data.phone, deletedAt: null },
    });

    if (!dealer) {
      throw new Error('Invalid phone or password');
    }

    if (!dealer.password) {
      throw new Error('Password not set. Please contact admin.');
    }
    const valid = await bcrypt.compare(data.password, dealer.password);
    if (!valid) {
      throw new Error('Invalid phone or password');
    }

    if (dealer.status !== DealerStatus.ACTIVE) {
      throw new Error('Account is not active');
    }

    const { password: _, ...dealerWithoutPassword } = dealer as any;
    const token = jwt.sign(
      { dealerId: dealer.id, tenantId: dealer.tenantId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { dealer: dealerWithoutPassword, token };
  }

  async createDealer(tenantId: string, data: any) {
    return prisma.dealer.create({
      data: { ...data, tenantId },
    });
  }

  async getDealers(tenantId: string, filters: any, skip: number, limit: number) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const dealers = await prisma.dealer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const counts = await prisma.dealerWarranty.groupBy({
      by: ['dealerId'],
      where: { dealerId: { in: dealers.map((d: any) => d.id) }, deletedAt: null },
      _count: { id: true },
    });
    const countMap = new Map(counts.map((c: any) => [c.dealerId, c._count.id]));

    return dealers.map((d: any) => ({
      ...d,
      warrantyCount: countMap.get(d.id) || 0,
    }));
  }

  async getDealersCount(tenantId: string, filters: any) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.dealer.count({ where });
  }

  async getDealerById(id: string, tenantId: string) {
    const dealer = await prisma.dealer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!dealer) return null;

    const warrantyCount = await prisma.dealerWarranty.count({
      where: { dealerId: id, deletedAt: null },
    });

    return { ...dealer, warrantyCount };
  }

  async updateDealer(id: string, tenantId: string, data: any) {
    return prisma.dealer.updateMany({
      where: { id, tenantId },
      data,
    }).then(() => this.getDealerById(id, tenantId));
  }

  async deleteDealer(id: string, tenantId: string) {
    return prisma.dealer.deleteMany({
      where: { id, tenantId },
    });
  }

  async searchDealers(tenantId: string, query: string) {
    return prisma.dealer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  // ===== Warranty Methods =====

  async createWarranty(dealerId: string, data: {
    customerName: string;
    customerPhone: string;
    manufacturer: string;
    vehicleModel: string;
    vehicleYear: number;
    chassisNumber: string;
    plateNumber: string;
    mileage: number;
    color: string;
    durationMonths: number;
    amountPaid: number;
    currency?: string;
    pdfUrl?: string;
  }) {
    const dealer = await prisma.dealer.findFirst({
      where: { id: dealerId, deletedAt: null },
    });
    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + data.durationMonths);

    const warranty = await prisma.dealerWarranty.create({
      data: {
        tenantId: dealer.tenantId,
        dealerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        manufacturer: data.manufacturer,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        chassisNumber: data.chassisNumber,
        plateNumber: data.plateNumber,
        mileage: data.mileage,
        color: data.color,
        durationMonths: data.durationMonths,
        amountPaid: data.amountPaid,
        currency: data.currency || 'SYP',
        startDate,
        endDate,
        pdfUrl: data.pdfUrl,
      },
    });

    // Generate PDF (WhatsApp notification temporarily disabled)
    try {
      const pdfResult = await generateWarrantyPdf(warranty, dealer);

      // Update warranty with PDF URL
      await prisma.dealerWarranty.update({
        where: { id: warranty.id },
        data: { pdfUrl: pdfResult.pdfUrl },
      });

      // Send WhatsApp notification with warranty PDF via WhatChimp
      try {
        const whatChimpService = new WhatChimpService();
        const baseUrl = process.env.BASE_URL || process.env.SERVER_URL || '';
        const fullPdfUrl = pdfResult.pdfUrl
          ? `${baseUrl.replace(/\/$/, '')}${pdfResult.pdfUrl}`
          : undefined;

        // Send warranty notification (template + PDF handled internally with fallback)
        const result = await whatChimpService.sendWarrantyNotification({
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          warrantyNumber: warranty.id.substring(0, 8).toUpperCase(),
          expiryDate: endDate.toLocaleDateString('ar-SY'),
          garageName: dealer.companyName || dealer.name || 'Auto Renew',
          pdfUrl: fullPdfUrl,
        });

        if (!result.success) {
          Logger.warn('Failed to send WhatChimp warranty notification', { error: result.error, warrantyId: warranty.id });
        }
      } catch (waError) {
        Logger.error('Error sending WhatChimp warranty notification', waError);
      }
    } catch (err) {
      Logger.error('Error generating PDF for warranty', err);
    }

    return prisma.dealerWarranty.findUnique({
      where: { id: warranty.id },
    });
  }

  async getDealerWarranties(dealerId: string) {
    return prisma.dealerWarranty.findMany({
      where: { dealerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { dealer: { select: { name: true, companyName: true } } },
    });
  }

  async getWarrantyById(id: string, dealerId: string) {
    return prisma.dealerWarranty.findFirst({
      where: { id, dealerId, deletedAt: null },
      include: { dealer: { select: { name: true, companyName: true, phone: true } } },
    });
  }

  async getDealerStats(dealerId: string) {
    const [totalWarranties, activeWarranties, uniqueCustomers, warranties] = await Promise.all([
      prisma.dealerWarranty.count({ where: { dealerId, deletedAt: null } }),
      prisma.dealerWarranty.count({ where: { dealerId, deletedAt: null, endDate: { gte: new Date() } } }),
      prisma.dealerWarranty.groupBy({
        by: ['customerPhone'],
        where: { dealerId, deletedAt: null },
      }),
      prisma.dealerWarranty.findMany({
        where: { dealerId, deletedAt: null },
        select: { amountPaid: true, currency: true },
      }) as Promise<Array<{ amountPaid: any; currency: string | null }>>,
    ]);

    // Client-side aggregation to support old DB without currency column
    let totalRevenueSYP = 0;
    let totalRevenueUSD = 0;
    for (const w of warranties) {
      const amt = Number(w.amountPaid) || 0;
      if (w.currency === 'USD') {
        totalRevenueUSD += amt;
      } else {
        totalRevenueSYP += amt; // Default SYP for old records
      }
    }

    return {
      totalWarranties,
      activeWarranties,
      totalCustomers: uniqueCustomers.length,
      totalRevenueSYP,
      totalRevenueUSD,
    };
  }

  async updateWarranty(id: string, dealerId: string, data: any) {
    const existing = await prisma.dealerWarranty.findFirst({
      where: { id, dealerId, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Warranty not found');
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (data.durationMonths || existing.durationMonths));

    return prisma.dealerWarranty.update({
      where: { id },
      data: {
        customerName: data.customerName ?? existing.customerName,
        customerPhone: data.customerPhone ?? existing.customerPhone,
        manufacturer: data.manufacturer ?? existing.manufacturer,
        vehicleModel: data.vehicleModel ?? existing.vehicleModel,
        vehicleYear: data.vehicleYear ?? existing.vehicleYear,
        chassisNumber: data.chassisNumber ?? existing.chassisNumber,
        plateNumber: data.plateNumber ?? existing.plateNumber,
        mileage: data.mileage ?? existing.mileage,
        color: data.color ?? existing.color,
        durationMonths: data.durationMonths ?? existing.durationMonths,
        amountPaid: data.amountPaid ?? existing.amountPaid,
        currency: data.currency ?? existing.currency,
        endDate: data.durationMonths ? endDate : existing.endDate,
      },
    });
  }

  async deleteWarranty(id: string, dealerId: string) {
    const existing = await prisma.dealerWarranty.findFirst({
      where: { id, dealerId, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Warranty not found');
    }
    return prisma.dealerWarranty.delete({
      where: { id },
    });
  }

  // ===== Admin Warranty Methods (no dealerAuth, uses admin auth) =====

  async adminCreateWarranty(dealerId: string, tenantId: string, data: {
    customerName: string;
    customerPhone: string;
    manufacturer: string;
    vehicleModel: string;
    vehicleYear: number;
    chassisNumber: string;
    plateNumber: string;
    mileage: number;
    color: string;
    durationMonths: number;
    amountPaid: number;
    currency?: string;
    pdfUrl?: string;
  }) {
    // Validate required fields
    if (!data?.customerName || !data?.customerPhone || !data?.manufacturer ||
        !data?.vehicleModel || !data?.chassisNumber || !data?.plateNumber || !data?.color) {
      throw new Error('Missing required fields');
    }
    if (!Number.isFinite(data.vehicleYear) || data.vehicleYear < 1900 || data.vehicleYear > 2100) {
      throw new Error('Invalid vehicle year');
    }
    if (!Number.isFinite(data.durationMonths) || data.durationMonths <= 0) {
      throw new Error('Duration months must be greater than 0');
    }
    if (!Number.isFinite(data.mileage) || data.mileage < 0) {
      throw new Error('Invalid mileage');
    }
    if (!Number.isFinite(data.amountPaid) || data.amountPaid < 0) {
      throw new Error('Invalid amount paid');
    }

    const dealer = await prisma.dealer.findFirst({
      where: { id: dealerId, tenantId, deletedAt: null },
    });
    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + data.durationMonths);

    const warranty = await prisma.dealerWarranty.create({
      data: {
        tenantId: dealer.tenantId,
        dealerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        manufacturer: data.manufacturer,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        chassisNumber: data.chassisNumber,
        plateNumber: data.plateNumber,
        mileage: data.mileage,
        color: data.color,
        durationMonths: data.durationMonths,
        amountPaid: data.amountPaid,
        currency: data.currency || 'SYP',
        startDate,
        endDate,
        pdfUrl: data.pdfUrl,
      },
    });

    // Generate PDF
    try {
      const pdfResult = await generateWarrantyPdf(warranty, dealer);
      await prisma.dealerWarranty.update({
        where: { id: warranty.id },
        data: { pdfUrl: pdfResult.pdfUrl },
      });
    } catch (err) {
      Logger.error('Error generating PDF for admin-created warranty', err);
    }

    return prisma.dealerWarranty.findUnique({
      where: { id: warranty.id },
    });
  }

  async adminUpdateWarranty(id: string, tenantId: string, data: any) {
    const existing = await prisma.dealerWarranty.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Warranty not found');
    }

    // Validate numeric fields if provided
    if (data.vehicleYear !== undefined && (!Number.isFinite(data.vehicleYear) || data.vehicleYear < 1900 || data.vehicleYear > 2100)) {
      throw new Error('Invalid vehicle year');
    }
    if (data.durationMonths !== undefined && (!Number.isFinite(data.durationMonths) || data.durationMonths <= 0)) {
      throw new Error('Duration months must be greater than 0');
    }
    if (data.mileage !== undefined && (!Number.isFinite(data.mileage) || data.mileage < 0)) {
      throw new Error('Invalid mileage');
    }
    if (data.amountPaid !== undefined && (!Number.isFinite(data.amountPaid) || data.amountPaid < 0)) {
      throw new Error('Invalid amount paid');
    }

    const durationMonths = data.durationMonths || existing.durationMonths;
    const endDate = new Date(existing.startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    return prisma.dealerWarranty.update({
      where: { id },
      data: {
        customerName: data.customerName ?? existing.customerName,
        customerPhone: data.customerPhone ?? existing.customerPhone,
        manufacturer: data.manufacturer ?? existing.manufacturer,
        vehicleModel: data.vehicleModel ?? existing.vehicleModel,
        vehicleYear: data.vehicleYear ?? existing.vehicleYear,
        chassisNumber: data.chassisNumber ?? existing.chassisNumber,
        plateNumber: data.plateNumber ?? existing.plateNumber,
        mileage: data.mileage ?? existing.mileage,
        color: data.color ?? existing.color,
        durationMonths: data.durationMonths ?? existing.durationMonths,
        amountPaid: data.amountPaid !== undefined ? data.amountPaid : existing.amountPaid,
        currency: data.currency ?? existing.currency,
        endDate: data.durationMonths ? endDate : existing.endDate,
      },
    });
  }

  async adminDeleteWarranty(id: string, tenantId: string) {
    const existing = await prisma.dealerWarranty.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Warranty not found');
    }
    return prisma.dealerWarranty.delete({
      where: { id },
    });
  }
}
