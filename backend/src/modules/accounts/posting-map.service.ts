import prisma from '../../config/database';
import { ACCOUNT_MAPPING_DEFINITIONS, DEFAULT_ACCOUNT_CODES } from '../accounting/chart-of-accounts.defaults';

type MappingRole = keyof typeof DEFAULT_ACCOUNT_CODES;

export class PostingMapService {
  async getAll(tenantId: string) {
    const mappings = await prisma.accountPostingMap.findMany({
      where: { tenantId },
      include: { account: true },
    });
    const byKey = new Map(mappings.map((mapping) => [mapping.mappingKey, mapping]));

    return ACCOUNT_MAPPING_DEFINITIONS.map((definition) => {
      const mapping = byKey.get(definition.key);
      return {
        mappingKey: definition.key,
        labelAr: definition.labelAr,
        accountType: definition.accountType,
        fallbackCode: DEFAULT_ACCOUNT_CODES[definition.key as MappingRole],
        accountId: mapping?.accountId || null,
        accountCode: mapping?.account.code || null,
        accountName: mapping?.account.nameAr || null,
        isActive: mapping?.isActive ?? false,
      };
    });
  }

  async setAccount(tenantId: string, mappingKey: string, accountId: string) {
    const definition = ACCOUNT_MAPPING_DEFINITIONS.find((item) => item.key === mappingKey);
    if (!definition) throw new Error('Unknown account mapping role');

    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId, isActive: true, deletedAt: null },
      include: { children: { select: { id: true } } },
    });
    if (!account) throw new Error('Account not found or inactive');
    if (account.children.length > 0) throw new Error('Posting must use a leaf account, not a parent');
    if (account.accountType !== definition.accountType) {
      throw new Error(`Selected account must be of type ${definition.accountType}`);
    }

    return prisma.accountPostingMap.upsert({
      where: { tenantId_mappingKey: { tenantId, mappingKey } },
      update: { accountId, isActive: true },
      create: { tenantId, mappingKey, accountId, isActive: true },
      include: { account: true },
    });
  }
}

export const postingMapService = new PostingMapService();
