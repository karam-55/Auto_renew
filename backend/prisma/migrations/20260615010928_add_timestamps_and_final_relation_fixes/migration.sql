/*
  Warnings:

  - You are about to drop the column `companyAddress` on the `CompanySettings` table. All the data in the column will be lost.
  - You are about to drop the column `companyLogoUrl` on the `CompanySettings` table. All the data in the column will be lost.
  - You are about to drop the column `companyPhone` on the `CompanySettings` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `MaintenancePackageItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VehicleMileageLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollRecord" DROP CONSTRAINT "PayrollRecord_employeeId_fkey";

-- AlterTable
ALTER TABLE "CompanySettings" DROP COLUMN "companyAddress",
DROP COLUMN "companyLogoUrl",
DROP COLUMN "companyPhone";

-- AlterTable
ALTER TABLE "MaintenancePackageItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "VehicleMileageLog" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
