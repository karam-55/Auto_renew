import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { CreateInvoiceCommand } from '../commands/CreateInvoiceCommand';
import { InvoiceDTO } from '../dto/InvoiceDTO';
import { v4 as uuidv4 } from 'uuid';

export class CreateInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly bookingRepository: IBookingRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<InvoiceDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if booking exists
    const booking = await this.bookingRepository.findById(dto.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if booking already has an invoice
    const existingInvoice = await this.invoiceRepository.findByBookingId(dto.bookingId);
    if (existingInvoice) {
      throw new Error('Booking already has an invoice');
    }

    // Check if customer exists
    const customer = await this.customerRepository.findById(booking.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if vehicle exists
    const vehicle = await this.vehicleRepository.findById(booking.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Generate public tracking URL
    const publicTrackingUrl = `/invoice/${uuidv4()}`;

    // Create invoice
    const invoice = {
      id: uuidv4(),
      bookingId: dto.bookingId,
      customerId: booking.customerId,
      vehicleId: booking.vehicleId,
      tenantId: customer.tenantId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      isFinalized: false,
      publicTrackingUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save invoice
    const savedInvoice = await this.invoiceRepository.save(invoice);

    return InvoiceDTO.fromEntity(savedInvoice);
  }
}
