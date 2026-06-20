import { MechanicSpecialization } from './MechanicSpecialization';

export class Mechanic {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly specialization: MechanicSpecialization,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    name: string,
    specialization: MechanicSpecialization
  ): Mechanic {
    return new Mechanic(
      id,
      tenantId,
      name,
      specialization,
      true,
      new Date(),
      new Date()
    );
  }

  deactivate(): Mechanic {
    return new Mechanic(
      this.id,
      this.tenantId,
      this.name,
      this.specialization,
      false,
      this.createdAt,
      new Date()
    );
  }

  activate(): Mechanic {
    return new Mechanic(
      this.id,
      this.tenantId,
      this.name,
      this.specialization,
      true,
      this.createdAt,
      new Date()
    );
  }

  isEngineSpecialist(): boolean {
    return this.specialization === MechanicSpecialization.ENGINE;
  }

  isElectricalSpecialist(): boolean {
    return this.specialization === MechanicSpecialization.ELECTRICAL;
  }

  isBodySpecialist(): boolean {
    return this.specialization === MechanicSpecialization.BODY;
  }

  isGeneralSpecialist(): boolean {
    return this.specialization === MechanicSpecialization.GENERAL;
  }

  canPerformTask(taskSpecialization?: MechanicSpecialization): boolean {
    if (!taskSpecialization) {
      return true;
    }
    return this.specialization === MechanicSpecialization.GENERAL || 
           this.specialization === taskSpecialization;
  }
}
