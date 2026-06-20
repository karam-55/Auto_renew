// Jest setup file
import { PrismaClient } from '@prisma/client';

// Mock Prisma client globally
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    account: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    fiscalPeriod: {
      findFirst: jest.fn(),
    },
    journalEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    journalLine: {
      createMany: jest.fn(),
    },
    exchangeRate: {
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
  AccountType: {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE',
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '8080';
