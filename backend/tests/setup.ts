// Jest setup file

// Mock Prisma client globally
if (process.env.RUN_DATABASE_INTEGRATION_TESTS !== 'true') jest.doMock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const methodNames = ['findFirst', 'findUnique', 'findMany', 'create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'];
  const delegates = new Map<string, any>();
  const getDelegate = (name: string) => {
    if (!delegates.has(name)) {
      delegates.set(name, Object.fromEntries(methodNames.map((method) => {
        const fallback = method === 'findMany' || method === 'groupBy' ? []
          : method === 'findFirst' || method === 'findUnique' ? null
            : method === 'count' ? 0
              : method === 'createMany' || method === 'updateMany' || method === 'deleteMany' ? { count: 0 }
                : undefined;
        return [method, jest.fn().mockResolvedValue(fallback)];
      })));
    }
    return delegates.get(name);
  };
  const createClient = () => {
    const client: any = {
      $use: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };
    client.$transaction = jest.fn(async (operation: any) =>
      typeof operation === 'function' ? operation(client) : Promise.all(operation)
    );
    return new Proxy(client, {
      get(target, property) {
        if (typeof property !== 'string') return Reflect.get(target, property);
        if (property in target) return target[property];
        return getDelegate(property);
      },
    });
  };

  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(createClient),
  };
});

jest.mock('ioredis', () => {
  const { EventEmitter } = require('events');
  class MockRedis extends EventEmitter {
    constructor() {
      super();
      this.status = 'ready';
    }
    async ping() { this.emit('connect'); return 'PONG'; }
    async get() { return null; }
    async set() { return 'OK'; }
    async setex() { return 'OK'; }
    async del() { return 0; }
    async quit() { return 'OK'; }
    disconnect() {}
    duplicate() { return new MockRedis(); }
  }
  return { __esModule: true, default: MockRedis };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '8080';
