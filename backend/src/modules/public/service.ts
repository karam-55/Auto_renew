import prisma from '../../config/database';
import {
  PublicBookingResponse,
  PublicTokenValidationResponse,
} from './types';
import { Logger } from '../../infrastructure/logging/logger';

export class PublicService {
  /**
   * Validate a public token and return the booking ID
   * @param publicToken - The public token from the booking
   * @returns Validation result with booking ID if valid
   */
  async validatePublicToken(publicToken: string): Promise<PublicTokenValidationResponse> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { publicToken },
        select: { id: true },
      });

      if (!booking) {
        return {
          valid: false,
          bookingId: null,
          error: 'Invalid or expired token',
        };
      }

      return {
        valid: true,
        bookingId: booking.id,
      };
    } catch (error) {
      Logger.error('Validate public token error:', error);
      return {
        valid: false,
        bookingId: null,
        error: 'Failed to validate token',
      };
    }
  }

  /**
   * Get booking details by public token
   * Returns all necessary data for customer tracking page
   * @param publicToken - The public token from the booking
   * @returns Booking details with vehicle, customer, services, invoice, and tenant info
   */
  async getBookingByPublicToken(publicToken: string): Promise<PublicBookingResponse | null> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { publicToken },
        include: {
          customer: {
            select: {
              fullName: true,
              phone: true,
              address: true,
            },
          },
          vehicle: {
            select: {
              make: true,
              model: true,
              year: true,
              licensePlate: true,
              vin: true,
              currentKm: true,
            },
          },
          bookingServices: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  nameEn: true,
                  description: true,
                  priceSYP: true,
                  priceUSD: true,
                  estimatedDurationMinutes: true,
                },
              },
            },
          },
          invoices: {
            where: {
              status: {
                in: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'],
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          schedules: {
            include: {
              technician: {
                select: {
                  id: true,
                  fullNameAr: true,
                  fullNameEn: true,
                  position: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                },
              },
            },
            orderBy: {
              startTime: 'asc',
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              nameEn: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!booking) {
        return null;
      }

      // Get company settings for additional tenant info
      const companySettings = await prisma.companySettings.findUnique({
        where: { tenantId: booking.tenantId },
        select: {
          address: true,
          phone: true,
        },
      });

      // Transform services to match response format
      const services = (booking as any).bookingServices?.map((bs: any) => ({
        ...bs.service,
        priceSYP: Number(bs.service.priceSYP),
        priceUSD: bs.service.priceUSD ? Number(bs.service.priceUSD) : null,
      })) || [];

      // Transform invoice to match response format
      let invoice = null;
      if ((booking as any).invoices && (booking as any).invoices.length > 0) {
        const inv = (booking as any).invoices[0];
        const totalSYP = Number(inv.totalSYP);
        const totalUSD = inv.totalUSD ? Number(inv.totalUSD) : null;
        const paidSYP = Number(inv.paidSYP);
        const paidUSD = inv.paidUSD ? Number(inv.paidUSD) : null;

        invoice = {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          subtotalSYP: Number(inv.subtotalSYP),
          subtotalUSD: inv.subtotalUSD ? Number(inv.subtotalUSD) : null,
          taxSYP: Number(inv.taxSYP),
          taxUSD: inv.taxUSD ? Number(inv.taxUSD) : null,
          discountSYP: Number(inv.discountSYP),
          discountUSD: inv.discountUSD ? Number(inv.discountUSD) : null,
          totalSYP,
          totalUSD,
          paidSYP,
          paidUSD,
          balanceSYP: totalSYP - paidSYP,
          balanceUSD: totalUSD && paidUSD !== null ? totalUSD - paidUSD : null,
          status: inv.status,
          notes: inv.notes,
        };
      }

      // Transform tenant to match response format
      const tenant = {
        id: (booking as any).tenant.id,
        companyName: (booking as any).tenant.name,
        companyNameAr: (booking as any).tenant.nameAr,
        companyNameEn: (booking as any).tenant.nameEn,
        logoUrl: (booking as any).tenant.logoUrl,
        address: companySettings?.address || null,
        phone: companySettings?.phone || null,
      };

      // Transform schedules to match response format
      const schedules = (booking as any).schedules ? (booking as any).schedules.map((schedule: any) => ({
        id: schedule.id,
        status: schedule.status,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        technician: schedule.technician ? {
          id: schedule.technician.id,
          fullNameAr: schedule.technician.fullNameAr,
          fullNameEn: schedule.technician.fullNameEn,
          position: schedule.technician.position,
        } : null,
        service: schedule.service ? {
          id: schedule.service.id,
          name: schedule.service.name,
          nameAr: schedule.service.nameAr,
        } : null,
      })) : [];

      // Transform vehicle history
      const histories: any[] = [];

      // Transform faults
      const faults: any[] = [];

      // Transform recommendations
      const recommendations: any[] = [];

      // Transform attachments
      const attachments: any[] = [];

      return {
        id: booking.id,
        status: booking.status,
        publicToken: booking.publicToken,
        notes: booking.notes,
        estimatedCompletionDate: booking.estimatedCompletionDate,
        actualCompletionDate: booking.actualCompletionDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        customer: (booking as any).customer,
        vehicle: {
          ...(booking as any).vehicle,
          lastServiceDate: (booking as any).vehicle?.lastServiceDate || null,
          nextServiceDate: (booking as any).vehicle?.nextServiceDate || null,
        },
        services,
        invoice,
        tenant,
        schedules,
        histories,
        faults,
        recommendations,
        attachments,
      };
    } catch (error) {
      Logger.error('Get booking by public token error:', error);
      throw new Error('Failed to fetch booking details');
    }
  }
}
