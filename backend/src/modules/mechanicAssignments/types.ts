export interface CreateMechanicAssignmentInput {
  bookingId: string;
  mechanicUserId: string;
  assignedAt?: Date;
  notes?: string;
}

export interface UpdateMechanicAssignmentInput {
  mechanicUserId?: string;
  status?: string;
  notes?: string;
}

export interface MechanicAssignmentResponse {
  id: string;
  bookingId: string;
  mechanicUserId: string;
  status: string;
  assignedAt: Date;
  notes: string | null;
  updatedAt: Date;
  booking?: {
    id: string;
    scheduledDate: Date;
    status: string;
    customer?: {
      id: string;
      fullName: string;
      phone: string;
    };
    vehicle?: {
      id: string;
      make: string;
      model: string;
      licensePlate: string;
    };
  };
  mechanic?: {
    id: string;
    fullName: string;
    phone: string;
  };
}
