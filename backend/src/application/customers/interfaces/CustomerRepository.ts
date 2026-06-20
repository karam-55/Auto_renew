import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhoneAndTenantId(phone: PhoneNumber, tenantId: string): Promise<Customer | null>;
  findByTenantId(tenantId: string): Promise<Customer[]>;
  create(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
  addLoyaltyPoints(customerId: string, points: number): Promise<void>;
}
