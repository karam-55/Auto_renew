import prisma from '../../config/database';
import { UserRole } from '@prisma/client';
import { getTelegramService } from '../telegram/service';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Telegram Admin Notification Service
 *
 * Sends Telegram messages to active OWNER and MANAGER users who have
 * configured a telegramChatId on their profile.
 *
 * This is intentionally fire-and-forget: callers should not await it
 * in the critical path, and errors are logged without failing the
 * original business operation.
 */

export class TelegramAdminNotificationService {
  private telegramService = getTelegramService();

  /**
   * Send a plain message to all active owners/managers of a tenant.
   */
  async sendToAdmins(tenantId: string, message: string): Promise<void> {
    if (!this.telegramService.isEnabled()) {
      Logger.info('Telegram admin notifications skipped: bot not enabled');
      return;
    }

    const admins = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: [UserRole.OWNER, UserRole.MANAGER] },
        telegramChatId: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        telegramChatId: true,
      },
    });

    if (admins.length === 0) {
      Logger.debug('No owners/managers with telegramChatId found for tenant', { tenantId });
      return;
    }

    for (const admin of admins) {
      const chatId = admin.telegramChatId?.trim();
      if (!chatId) continue;

      try {
        const result = await this.telegramService.sendMessage(chatId, message);
        if (!result.success) {
          Logger.warn(`Telegram admin notification failed for user ${admin.id}: ${result.error}`);
        }
      } catch (error) {
        Logger.error(`Error sending Telegram admin notification to user ${admin.id}:`, error);
      }
    }
  }

  /**
   * Notify owners/managers that a new booking has been created.
   */
  async notifyBookingCreated(tenantId: string, booking: any): Promise<void> {
    const customer = booking.customer;
    const vehicle = booking.vehicle;
    const bookingNumber = booking.bookingNumber || booking.id.substring(0, 8).toUpperCase();
    const customerName = customer?.fullName || 'غير معروف';
    const vehicleInfo = vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate || ''})`
      : 'غير معروف';
    const scheduledDate = booking.scheduledDate
      ? new Date(booking.scheduledDate).toLocaleDateString('ar-SY')
      : new Date().toLocaleDateString('ar-SY');

    const message =
      `📋 حجز جديد\n\n` +
      `رقم الحجز: ${bookingNumber}\n` +
      `العميل: ${customerName}\n` +
      `المركبة: ${vehicleInfo}\n` +
      `التاريخ: ${scheduledDate}\n` +
      `الحالة: ${booking.status || 'PENDING'}`;

    await this.sendToAdmins(tenantId, message);
  }

  /**
   * Notify owners/managers that a booking status has changed.
   */
  async notifyBookingStatusChanged(
    tenantId: string,
    booking: any,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const customer = booking.customer;
    const vehicle = booking.vehicle;
    const bookingNumber = booking.bookingNumber || booking.id.substring(0, 8).toUpperCase();
    const customerName = customer?.fullName || 'غير معروف';
    const vehicleInfo = vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate || ''})`
      : 'غير معروف';

    const message =
      `🔄 تحديث حالة الحجز\n\n` +
      `رقم الحجز: ${bookingNumber}\n` +
      `العميل: ${customerName}\n` +
      `المركبة: ${vehicleInfo}\n` +
      `الحالة السابقة: ${oldStatus}\n` +
      `الحالة الجديدة: ${newStatus}`;

    await this.sendToAdmins(tenantId, message);
  }

  /**
   * Notify owners/managers that a mechanic has been assigned to a booking.
   */
  async notifyMechanicAssigned(tenantId: string, assignment: any): Promise<void> {
    const booking = assignment.booking;
    const mechanic = assignment.mechanic;
    const bookingNumber =
      booking?.bookingNumber || booking?.id?.substring(0, 8).toUpperCase() || 'غير معروف';
    const customerName = booking?.customer?.fullName || 'غير معروف';
    const vehicleInfo = booking?.vehicle
      ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate || ''})`
      : 'غير معروف';
    const mechanicName = mechanic?.fullName || 'غير معروف';

    const message =
      `🔧 تكليف فني جديد\n\n` +
      `الفني: ${mechanicName}\n` +
      `رقم الحجز: ${bookingNumber}\n` +
      `العميل: ${customerName}\n` +
      `المركبة: ${vehicleInfo}`;

    await this.sendToAdmins(tenantId, message);
  }

  /**
   * Notify owners/managers that an invoice has been finalized/issued.
   */
  async notifyInvoiceCreated(tenantId: string, invoice: any, customerName?: string): Promise<void> {
    const invoiceNumber = invoice.invoiceNumber || invoice.id.substring(0, 8).toUpperCase();
    const totalSYP = Number(invoice.totalSYP || 0).toLocaleString('ar-SY');

    const message =
      `🧾 فاتورة جديدة\n\n` +
      `رقم الفاتورة: ${invoiceNumber}\n` +
      `العميل: ${customerName || 'غير معروف'}\n` +
      `المجموع: ${totalSYP} ل.س\n` +
      `الحالة: ${invoice.status || 'ISSUED'}`;

    await this.sendToAdmins(tenantId, message);
  }

  /**
   * Notify owners/managers that a payment has been received.
   */
  async notifyPaymentReceived(
    tenantId: string,
    invoice: any,
    amountSYP: number,
    customerName?: string
  ): Promise<void> {
    const invoiceNumber = invoice.invoiceNumber || invoice.id.substring(0, 8).toUpperCase();
    const amount = Number(amountSYP || 0).toLocaleString('ar-SY');

    const message =
      `💰 دفعة مستلمة\n\n` +
      `رقم الفاتورة: ${invoiceNumber}\n` +
      `العميل: ${customerName || 'غير معروف'}\n` +
      `المبلغ: ${amount} ل.س\n` +
      `الحالة الجديدة: ${invoice.status || 'PAID'}`;

    await this.sendToAdmins(tenantId, message);
  }

  /**
   * Notify owners/managers that a new customer has been registered.
   */
  async notifyCustomerRegistered(tenantId: string, customer: any): Promise<void> {
    const message =
      `👤 عميل جديد مسجل\n\n` +
      `الاسم: ${customer.fullName || 'غير معروف'}\n` +
      `الهاتف: ${customer.phone || 'غير معروف'}`;

    await this.sendToAdmins(tenantId, message);
  }
}

export default new TelegramAdminNotificationService();
