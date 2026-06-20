import { IBookingRepository } from '../interfaces/IBookingRepository';
import { Logger } from '../../../infrastructure/logging/logger';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { IWorkOrderRepository } from '../interfaces/IWorkOrderRepository';
import { IServiceRepository } from '../interfaces/IServiceRepository';
import { CreateBookingCommand } from '../commands/CreateBookingCommand';
import { BookingDTO } from '../dto/BookingDTO';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppService } from '../../../api/services/whatsapp.service';

export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly vehicleRepository: IVehicleRepository,
    private readonly workOrderRepository: IWorkOrderRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly whatsappService: WhatsAppService
  ) {}

  async execute(command: CreateBookingCommand): Promise<BookingDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if customer exists
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if vehicle exists
    const vehicle = await this.vehicleRepository.findById(dto.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Check if vehicle has an open booking
    const openBooking = await this.bookingRepository.findOpenByVehicleId(dto.vehicleId);
    if (openBooking) {
      throw new Error('Vehicle already has an open booking');
    }

    // Validate services exist
    for (const service of dto.requestedServices) {
      const serviceEntity = await this.serviceRepository.findById(service.serviceId);
      if (!serviceEntity) {
        throw new Error(`Service with ID ${service.serviceId} not found`);
      }
    }

    // Generate public tracking ID and URL
    const publicTrackingId = uuidv4();
    const publicTrackingUrl = `/track/${publicTrackingId}`;

    // Create booking
    const booking = {
      id: uuidv4(),
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      tenantId: customer.tenantId,
      status: 'PENDING',
      requestedServices: dto.requestedServices,
      additionalServices: [],
      publicTrackingId,
      publicTrackingUrl,
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save booking
    const savedBooking = await this.bookingRepository.save(booking);

    // Create WorkOrder automatically
    const workOrder = await this.workOrderRepository.createForBooking(savedBooking.id);

    // Update booking with workOrderId
    const updatedBooking = {
      ...savedBooking,
      workOrderId: workOrder.id,
      updatedAt: new Date(),
    };

    const finalBooking = await this.bookingRepository.update(updatedBooking);

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendBookingCreated(
        customer.tenantId,
        customer.phone,
        finalBooking.id
      );
    } catch (error) {
      Logger.error('Failed to send WhatsApp notification:', error);
      // Don't fail the booking creation if notification fails
    }

    return BookingDTO.fromEntity(finalBooking);
  }
}
