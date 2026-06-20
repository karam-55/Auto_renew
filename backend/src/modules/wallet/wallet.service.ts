import prisma from '../../config/database';

export class WalletService {
  async getWallet(customerId: string, tenantId: string) {
    let wallet = await prisma.customerWallet.findFirst({
      where: {
        customerId,
        tenantId,
      },
    });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.customerWallet.create({
        data: {
          tenantId,
          customerId,
          balance: 0,
        },
      });
    }

    return wallet;
  }

  async addBalance(data: {
    tenantId: string;
    customerId: string;
    amount: number;
  }) {
    // Get or create wallet
    const wallet = await this.getWallet(data.customerId, data.tenantId);

    // Update balance
    const newBalance = Number(wallet.balance) + data.amount;
    const updatedWallet = await prisma.customerWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        updatedAt: new Date(),
      },
    });

    return updatedWallet;
  }

  async deductBalance(data: {
    tenantId: string;
    customerId: string;
    amount: number;
  }) {
    // Get wallet
    const wallet = await this.getWallet(data.customerId, data.tenantId);

    // Check if sufficient balance
    if (Number(wallet.balance) < data.amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Update balance
    const newBalance = Number(wallet.balance) - data.amount;
    const updatedWallet = await prisma.customerWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        updatedAt: new Date(),
      },
    });

    return updatedWallet;
  }

  async getBalance(customerId: string, tenantId: string) {
    const wallet = await this.getWallet(customerId, tenantId);
    return Number(wallet.balance);
  }
}
