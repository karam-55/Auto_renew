import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

/**
 * Data Export Service
 * Manages data export operations
 * 
 * Allows exporting data in various formats (CSV, Excel, JSON)
 */

export interface DataExport {
  id: string;
  tenantId: string;
  name: string;
  entityType: 'BOOKINGS' | 'CUSTOMERS' | 'INVOICES' | 'PAYMENTS' | 'INVENTORY' | 'EMPLOYEES' | 'SERVICES';
  format: 'CSV' | 'EXCEL' | 'JSON';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  filters?: Record<string, any>;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  errorMessage?: string;
  requestedBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export class DataExportService {
  /**
   * Create a new data export request
   */
  async createExport(
    tenantId: string,
    name: string,
    entityType: 'BOOKINGS' | 'CUSTOMERS' | 'INVOICES' | 'PAYMENTS' | 'INVENTORY' | 'EMPLOYEES' | 'SERVICES',
    format: 'CSV' | 'EXCEL' | 'JSON',
    filters: Record<string, any> | undefined,
    requestedBy: string
  ): Promise<DataExport> {
    const dataExport = await prisma.dataExport.create({
      data: {
        tenantId,
        name,
        entityType,
        format,
        status: 'PENDING',
        filters: filters ? JSON.stringify(filters) : Prisma.JsonNull,
        requestedBy
      }
    });

    return {
      id: dataExport.id,
      tenantId: dataExport.tenantId,
      name: dataExport.name,
      entityType: dataExport.entityType as any,
      format: dataExport.format as any,
      status: dataExport.status as any,
      filters: dataExport.filters ? JSON.parse(dataExport.filters as string) : undefined,
      fileUrl: dataExport.fileUrl || undefined,
      fileSize: dataExport.fileSize || undefined,
      recordCount: dataExport.recordCount || undefined,
      errorMessage: dataExport.errorMessage || undefined,
      requestedBy: dataExport.requestedBy,
      createdAt: dataExport.createdAt,
      completedAt: dataExport.completedAt || undefined
    };
  }

  /**
   * Get export by ID
   */
  async getExport(exportId: string): Promise<DataExport | null> {
    const dataExport = await prisma.dataExport.findUnique({
      where: { id: exportId }
    });

    if (!dataExport) return null;

    return {
      id: dataExport.id,
      tenantId: dataExport.tenantId,
      name: dataExport.name,
      entityType: dataExport.entityType as any,
      format: dataExport.format as any,
      status: dataExport.status as any,
      filters: dataExport.filters ? JSON.parse(dataExport.filters as string) : undefined,
      fileUrl: dataExport.fileUrl || undefined,
      fileSize: dataExport.fileSize || undefined,
      recordCount: dataExport.recordCount || undefined,
      errorMessage: dataExport.errorMessage || undefined,
      requestedBy: dataExport.requestedBy,
      createdAt: dataExport.createdAt,
      completedAt: dataExport.completedAt || undefined
    };
  }

  /**
   * Get exports for a tenant
   */
  async getExports(
    tenantId: string,
    entityType?: 'BOOKINGS' | 'CUSTOMERS' | 'INVOICES' | 'PAYMENTS' | 'INVENTORY' | 'EMPLOYEES' | 'SERVICES',
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    limit: number = 50,
    offset: number = 0
  ): Promise<DataExport[]> {
    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;

    const exports = await prisma.dataExport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return exports.map((e: any) => ({
      id: e.id,
      tenantId: e.tenantId,
      name: e.name,
      entityType: e.entityType as any,
      format: e.format as any,
      status: e.status as any,
      filters: e.filters ? JSON.parse(e.filters as string) : undefined,
      fileUrl: e.fileUrl || undefined,
      fileSize: e.fileSize || undefined,
      recordCount: e.recordCount || undefined,
      errorMessage: e.errorMessage || undefined,
      requestedBy: e.requestedBy,
      createdAt: e.createdAt,
      completedAt: e.completedAt || undefined
    }));
  }

  /**
   * Process export
   */
  async processExport(exportId: string): Promise<DataExport> {
    const dataExport = await this.getExport(exportId);
    if (!dataExport) {
      throw new Error('Export not found');
    }

    // Update status to processing
    await prisma.dataExport.update({
      where: { id: exportId },
      data: { status: 'PROCESSING' }
    });

    let fileUrl: string | undefined;
    let fileSize: number | undefined;
    let recordCount: number | undefined;
    let errorMessage: string | undefined;

    try {
      const result = await this.generateExportData(dataExport.entityType, dataExport.filters, dataExport.format);
      fileUrl = result.fileUrl;
      fileSize = result.fileSize;
      recordCount = result.recordCount;

      // Update status to completed
      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          fileSize,
          recordCount,
          completedAt: new Date()
        }
      });

      return await this.getExport(exportId) as DataExport;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update status to failed
      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date()
        }
      });

      return await this.getExport(exportId) as DataExport;
    }
  }

  /**
   * Generate export data
   */
  private async generateExportData(
    entityType: 'BOOKINGS' | 'CUSTOMERS' | 'INVOICES' | 'PAYMENTS' | 'INVENTORY' | 'EMPLOYEES' | 'SERVICES',
    filters: Record<string, any> | undefined,
    format: 'CSV' | 'EXCEL' | 'JSON'
  ): Promise<{
    fileUrl: string;
    fileSize: number;
    recordCount: number;
  }> {
    let data: any[] = [];

    // Fetch data based on entity type
    switch (entityType) {
      case 'BOOKINGS':
        data = await this.fetchBookingsData(filters);
        break;
      case 'CUSTOMERS':
        data = await this.fetchCustomersData(filters);
        break;
      case 'INVOICES':
        data = await this.fetchInvoicesData(filters);
        break;
      case 'PAYMENTS':
        data = await this.fetchPaymentsData(filters);
        break;
      case 'INVENTORY':
        data = await this.fetchInventoryData(filters);
        break;
      case 'EMPLOYEES':
        data = await this.fetchEmployeesData(filters);
        break;
      case 'SERVICES':
        data = await this.fetchServicesData(filters);
        break;
    }

    // Generate file based on format
    const fileUrl = await this.generateFile(data, entityType, format);
    const filePath = path.join(process.cwd(), fileUrl);
    const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    const recordCount = data.length;

    return {
      fileUrl,
      fileSize,
      recordCount
    };
  }

  /**
   * Fetch bookings data
   */
  private async fetchBookingsData(filters: Record<string, any> | undefined): Promise<any[]> {
    const bookings = await prisma.booking.findMany({
      where: filters || {},
      take: 1000
    });

    return bookings.map(b => ({
      id: b.id,
      status: b.status,
      customerId: b.customerId,
      vehicleId: b.vehicleId,
      scheduledDate: b.scheduledDate,
      createdAt: b.createdAt
    }));
  }

  /**
   * Fetch customers data
   */
  private async fetchCustomersData(filters: Record<string, any> | undefined): Promise<any[]> {
    const customers = await prisma.customer.findMany({
      where: filters || {},
      take: 1000
    });

    return customers.map(c => ({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      address: c.address,
      city: c.city,
      createdAt: c.createdAt
    }));
  }

  /**
   * Fetch invoices data
   */
  private async fetchInvoicesData(filters: Record<string, any> | undefined): Promise<any[]> {
    const invoices = await prisma.invoice.findMany({
      where: filters || {},
      include: {
        customer: true
      },
      take: 1000
    });

    return invoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      customerName: i.customer?.fullName,
      totalSYP: i.totalSYP,
      status: i.status,
      dueDate: i.dueDate,
      createdAt: i.createdAt
    }));
  }

  /**
   * Fetch payments data
   */
  private async fetchPaymentsData(filters: Record<string, any> | undefined): Promise<any[]> {
    const payments = await prisma.payment.findMany({
      where: filters || {},
      include: {
        invoice: true
      },
      take: 1000
    });

    return payments.map(p => ({
      id: p.id,
      amountSYP: p.amountSYP,
      paymentMethod: p.paymentMethod,
      invoiceNumber: p.invoice?.invoiceNumber,
      createdAt: p.createdAt
    }));
  }

  /**
   * Fetch inventory data
   */
  private async fetchInventoryData(filters: Record<string, any> | undefined): Promise<any[]> {
    const parts = await prisma.part.findMany({
      where: filters || {},
      take: 1000
    });

    return parts.map((i: any) => ({
      id: i.id,
      nameEn: i.nameEn,
      quantity: i.quantity,
      sellingPriceSYP: i.sellingPriceSYP,
      location: i.location,
      createdAt: i.createdAt
    }));
  }

  /**
   * Fetch employees data
   */
  private async fetchEmployeesData(filters: Record<string, any> | undefined): Promise<any[]> {
    const employees = await prisma.employee.findMany({
      where: filters || {},
      take: 1000
    });

    return employees.map(e => ({
      id: e.id,
      fullNameAr: e.fullNameAr,
      fullNameEn: e.fullNameEn,
      position: e.position,
      phone: e.phone,
      address: e.address,
      departmentId: e.departmentId,
      createdAt: e.createdAt
    }));
  }

  /**
   * Fetch services data
   */
  private async fetchServicesData(filters: Record<string, any> | undefined): Promise<any[]> {
    const services = await prisma.service.findMany({
      where: filters || {},
      take: 1000
    });

    return services.map(s => ({
      id: s.id,
      nameEn: s.nameEn,
      nameAr: s.nameAr,
      basePrice: s.basePrice,
      duration: s.duration,
      categoryId: s.categoryId,
      createdAt: s.createdAt
    }));
  }

  /**
   * Generate file from data
   */
  private async generateFile(
    data: any[],
    entityType: string,
    format: 'CSV' | 'EXCEL' | 'JSON'
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `${entityType.toLowerCase()}_export_${timestamp}.${format.toLowerCase()}`;
    const exportDir = path.join(process.cwd(), 'uploads', 'exports');
    fs.mkdirSync(exportDir, { recursive: true });
    const filePath = path.join(exportDir, filename);

    if (format === 'JSON') {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } else if (format === 'CSV') {
      if (data.length === 0) {
        fs.writeFileSync(filePath, '', 'utf-8');
      } else {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((row: any) =>
          Object.values(row).map((v: any) => {
            const str = String(v ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(',')
        ).join('\n');
        fs.writeFileSync(filePath, `${headers}\n${rows}`, 'utf-8');
      }
    } else if (format === 'EXCEL') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Export');
      if (data.length > 0) {
        worksheet.columns = Object.keys(data[0]).map((key) => ({ header: key, key }));
        data.forEach((row: any) => worksheet.addRow(row));
      }
      await workbook.xlsx.writeFile(filePath);
    }

    return `/uploads/exports/${filename}`;
  }

  /**
   * Delete export
   */
  async deleteExport(exportId: string): Promise<boolean> {
    await prisma.dataExport.delete({
      where: { id: exportId }
    });
    return true;
  }

  /**
   * Get export summary for dashboard
   */
  async getExportSummary(tenantId: string): Promise<{
    totalExports: number;
    completedExports: number;
    pendingExports: number;
    failedExports: number;
    exportsByType: Record<string, number>;
  }> {
    const exports = await this.getExports(tenantId);
    const completedExports = exports.filter(e => e.status === 'COMPLETED').length;
    const pendingExports = exports.filter(e => e.status === 'PENDING' || e.status === 'PROCESSING').length;
    const failedExports = exports.filter(e => e.status === 'FAILED').length;

    const exportsByType: Record<string, number> = {};
    for (const exp of exports) {
      if (!exportsByType[exp.entityType]) {
        exportsByType[exp.entityType] = 0;
      }
      exportsByType[exp.entityType]++;
    }

    return {
      totalExports: exports.length,
      completedExports,
      pendingExports,
      failedExports,
      exportsByType
    };
  }
}

export default new DataExportService();
