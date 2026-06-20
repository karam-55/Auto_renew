-- Migration: Add missing BookingStatus enum values
-- Run this manually if Prisma Migrate doesn't handle enum changes automatically

-- PostgreSQL doesn't allow ALTER TYPE ADD VALUE in a transaction block
-- Run these statements individually

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'INVOICED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'NO_INVOICE_REQUIRED';
