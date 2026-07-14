export interface CreateUserInput {
  fullName: string;
  username: string;
  password: string;
  phone: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'MECHANIC' | 'ACCOUNTANT' | 'CASHIER' | 'SALES';
  isActive?: boolean;
}

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  password?: string;
  phone?: string;
  role?: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'MECHANIC' | 'ACCOUNTANT' | 'CASHIER' | 'SALES';
  isActive?: boolean;
  telegramChatId?: string;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  fullName: string;
  username: string;
  phone: string;
  role: string;
  isActive: boolean;
  telegramChatId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
