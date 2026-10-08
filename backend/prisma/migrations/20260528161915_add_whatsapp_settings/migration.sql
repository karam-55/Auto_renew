-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "enableWhatsAppNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsappAccessToken" TEXT,
ADD COLUMN     "whatsappBusinessAccountId" TEXT,
ADD COLUMN     "whatsappPhoneNumberId" TEXT;
