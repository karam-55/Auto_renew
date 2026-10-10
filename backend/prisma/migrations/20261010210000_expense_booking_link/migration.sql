-- Link expenses to bookings so job-specific purchases can be tracked per job
ALTER TABLE "Expense" ADD COLUMN "bookingId" TEXT;

CREATE INDEX "Expense_bookingId_idx" ON "Expense"("bookingId");
