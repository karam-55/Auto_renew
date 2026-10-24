export {};

import prisma from '../../src/config/database';

describe('Prisma soft-delete middleware', () => {
  const middleware = (prisma.$use as jest.Mock).mock.calls.at(-1)?.[0];

  it.each(['AccountPostingMap', 'BookingServiceMaterial', 'BookingJobCost', 'WorkOrder', 'InvoiceNumberSequence'])(
    'does not add deletedAt to %s because that model has no soft-delete field',
    async (model) => {
      const params: any = { model, action: 'findMany', args: { where: { tenantId: 'default' } } };
      await middleware(params, async (nextParams: any) => nextParams);
      expect(params.args.where).toEqual({ tenantId: 'default' });
    },
  );

  it('filters soft-deleted accounts from reads', async () => {
    const params: any = { model: 'Account', action: 'findMany', args: { where: { tenantId: 'default' } } };
    await middleware(params, async (nextParams: any) => nextParams);
    expect(params.args.where).toEqual({ tenantId: 'default', deletedAt: null });
  });
});
