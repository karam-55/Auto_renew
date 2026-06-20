import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update Cost of Goods Sold accounts to COGS type
  const result = await prisma.account.updateMany({
    where: {
      OR: [
        { nameEn: { contains: 'Cost of Goods Sold', mode: 'insensitive' } },
        { nameAr: { contains: 'تكلفة البضاعة المباعة', mode: 'insensitive' } },
        { code: '5000' },
      ],
    },
    data: { accountType: 'COGS' },
  })
  console.log('Updated COGS accounts:', result.count)

  // Add AccountCategory to existing accounts based on accountType and code
  const accounts = await prisma.account.findMany()
  for (const acc of accounts) {
    let category = null
    if (acc.accountType === 'ASSET') {
      if (acc.code.startsWith('11')) category = 'CURRENT_ASSET'
      else if (acc.code.startsWith('12')) category = 'FIXED_ASSET'
      else category = 'CURRENT_ASSET'
    } else if (acc.accountType === 'LIABILITY') {
      if (acc.code.startsWith('21')) category = 'CURRENT_LIABILITY'
      else category = 'LONG_TERM_LIABILITY'
    } else if (acc.accountType === 'EQUITY') {
      category = 'EQUITY'
    } else if (acc.accountType === 'REVENUE') {
      category = 'REVENUE'
    } else if (acc.accountType === 'COGS') {
      category = 'COGS'
    } else if (acc.accountType === 'EXPENSE') {
      category = 'OPERATING_EXPENSE'
    }
    if (category) {
      await prisma.account.update({ where: { id: acc.id }, data: { category } })
    }
  }
  console.log('Updated account categories')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
