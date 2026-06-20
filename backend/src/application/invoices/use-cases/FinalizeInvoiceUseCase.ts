import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { Logger } from '../../../infrastructure/logging/logger';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { ICustomerRepository } from '../../bookings/interfaces/ICustomerRepository';
import { FinalizeInvoiceCommand } from '../commands/FinalizeInvoiceCommand';
import { InvoiceDTO } from '../dto/InvoiceDTO';
import { WhatsAppService } from '../../../api/services/whatsapp.service';

export class FinalizeInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly bookingRepository: IBookingRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly whatsappService: WhatsAppService
  ) {}

  async execute(command: FinalizeInvoiceCommand): Promise<InvoiceDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find invoice
    const invoice = await this.invoiceRepository.findById(dto.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Check if invoice is already finalized
    if (invoice.isFinalized) {
      throw new Error('Invoice is already finalized');
    }

    // Check if invoice has items
    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Cannot finalize invoice without items');
    }

    // Find booking to check WorkOrder status
    const booking = await this.bookingRepository.findById(invoice.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if WorkOrder is completed (this would typically check WorkOrder status)
    // For now, we'll assume this is validated at the repository level or through a WorkOrder check
    // In a real implementation, you would check: if (booking.workOrder && booking.workOrder.status !== 'COMPLETED')

    // Finalize invoice
    const updatedInvoice = {
      ...invoice,
      isFinalized: true,
      finalizedAt: new Date(),
      updatedAt: new Date(),
    };

    const savedInvoice = await this.invoiceRepository.update(updatedInvoice);

    // Send WhatsApp notification
    try {
      const customer = await this.customerRepository.findById(booking.customerId);
      if (customer) {
        const total = savedInvoice.totalSYP?.toString() || savedInvoice.totalUSD?.toString() || '0';
        const invoiceUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/track/${booking.publicTrackingId}`;
        await this.whatsappService.sendInvoiceReady(
          booking.tenantId,
          customer.phone,
          total,
          invoiceUrl
        );
      }
    } catch (error) {
      Logger.error('Failed to send WhatsApp notification:', error);
      // Don't fail the invoice finalization if notification fails
    }

    return InvoiceDTO.fromEntity(savedInvoice);
  }
}
