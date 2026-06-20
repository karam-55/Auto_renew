import { PhoneNumber } from '../value-objects/PhoneNumber';

export class Customer {
  constructor(
    public readonly id: string,
    public readonly phone: PhoneNumber,
    public readonly fullName: string,
    public readonly tenantId: string,
    public readonly address?: string,
    public readonly notes?: string,
    public readonly city?: string,
    public readonly isVip: boolean = false,
    public readonly loyaltyPoints: number = 0,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    phone: PhoneNumber,
    fullName: string,
    tenantId: string,
    address?: string,
    notes?: string,
    city?: string
  ): Customer {
    return new Customer(
      id,
      phone,
      fullName,
      tenantId,
      address,
      notes,
      city,
      false,
      0,
      true,
      new Date(),
      new Date()
    );
  }

  addLoyaltyPoints(points: number): Customer {
    return new Customer(
      this.id,
      this.phone,
      this.fullName,
      this.tenantId,
      this.address,
      this.notes,
      this.city,
      this.isVip,
      this.loyaltyPoints + points,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  setVipStatus(isVip: boolean): Customer {
    return new Customer(
      this.id,
      this.phone,
      this.fullName,
      this.tenantId,
      this.address,
      this.notes,
      this.city,
      isVip,
      this.loyaltyPoints,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  deactivate(): Customer {
    return new Customer(
      this.id,
      this.phone,
      this.fullName,
      this.tenantId,
      this.address,
      this.notes,
      this.city,
      this.isVip,
      this.loyaltyPoints,
      false,
      this.createdAt,
      new Date()
    );
  }

  update(
    fullName?: string,
    phone?: PhoneNumber,
    address?: string,
    notes?: string,
    city?: string,
    isVip?: boolean
  ): Customer {
    return new Customer(
      this.id,
      phone || this.phone,
      fullName || this.fullName,
      this.tenantId,
      address !== undefined ? address : this.address,
      notes !== undefined ? notes : this.notes,
      city !== undefined ? city : this.city,
      isVip !== undefined ? isVip : this.isVip,
      this.loyaltyPoints,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }
}
