import analyticsService from './analytics.service';
import prisma from '../config/database';

interface AIResponse {
  type: 'text' | 'analytics' | 'search' | 'insight';
  message: string;
  data?: any;
  chartSuggestion?: 'line' | 'bar' | 'pie' | null;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

interface UserContext {
  tenantId: string;
  branchId?: string;
  userId: string;
  role: string;
}

class AiService {
  /**
   * Process natural language query
   */
  async processQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const normalizedQuery = query.toLowerCase().trim();

    // Detect intent
    const intent = this.detectIntent(normalizedQuery);

    switch (intent) {
      case 'analytics_sales':
        return await this.handleSalesQuery(normalizedQuery, userContext);
      case 'analytics_profit':
        return await this.handleProfitQuery(normalizedQuery, userContext);
      case 'analytics_bookings':
        return await this.handleBookingsQuery(normalizedQuery, userContext);
      case 'analytics_inventory':
        return await this.handleInventoryQuery(normalizedQuery, userContext);
      case 'analytics_memberships':
        return await this.handleMembershipQuery(normalizedQuery, userContext);
      case 'analytics_branches':
        return await this.handleBranchQuery(normalizedQuery, userContext);
      case 'search_invoice':
        return await this.handleInvoiceSearch(normalizedQuery, userContext);
      case 'search_customer':
        return await this.handleCustomerSearch(normalizedQuery, userContext);
      case 'search_vehicle':
        return await this.handleVehicleSearch(normalizedQuery, userContext);
      case 'search_booking':
        return await this.handleBookingSearch(normalizedQuery, userContext);
      case 'insight_summary':
        return await this.handleSummaryQuery(normalizedQuery, userContext);
      case 'insight_anomaly':
        return await this.handleAnomalyDetection(userContext);
      default:
        return {
          type: 'text',
          message: 'لم أفهم سؤالك. يمكنك سؤالي عن:\n- المبيعات والربح\n- الحجوزات\n- المخزون\n- الاشتراكات\n- البحث عن فواتير أو عملاء\n- ملخص الأداء',
        };
    }
  }

  /**
   * Detect intent from query
   */
  private detectIntent(query: string): string {
    // Sales queries
    if (query.includes('ربح') || query.includes('مبيعات') || query.includes('إيرادات')) {
      if (query.includes('ربح')) return 'analytics_profit';
      return 'analytics_sales';
    }

    // Booking queries
    if (query.includes('حجز') || query.includes('فني') || query.includes('جدول')) {
      return 'analytics_bookings';
    }

    // Inventory queries
    if (query.includes('مخزون') || query.includes('قطع') || query.includes('صنف')) {
      return 'analytics_inventory';
    }

    // Membership queries
    if (query.includes('اشتراك') || query.includes('عضوية')) {
      return 'analytics_memberships';
    }

    // Branch queries
    if (query.includes('فرع') || query.includes('مقارنة')) {
      return 'analytics_branches';
    }

    // Search queries
    if (query.includes('فاتورة') || query.includes('invoice')) {
      return 'search_invoice';
    }
    if (query.includes('عميل') || query.includes('زبون')) {
      return 'search_customer';
    }
    if (query.includes('سيارة') || query.includes('مركبة')) {
      return 'search_vehicle';
    }
    if (query.includes('حجوزات اليوم') || query.includes('حجوزات اليوم')) {
      return 'search_booking';
    }

    // Summary queries
    if (query.includes('ملخص') || query.includes('أداء') || query.includes('اليوم')) {
      return 'insight_summary';
    }

    // Anomaly detection
    if (query.includes('مشكلة') || query.includes('إنذار') || query.includes('تنبيه')) {
      return 'insight_anomaly';
    }

    return 'unknown';
  }

  /**
   * Handle sales/profit queries
   */
  private async handleSalesQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const dateRange = this.extractDateRange(query);
    const analytics = await analyticsService.getSalesAnalytics(
      userContext.tenantId,
      userContext.branchId || 'all',
      dateRange
    );

    return {
      type: 'analytics',
      message: `إجمالي المبيعات: ${this.formatCurrency(analytics.totalSales)}\nمتوسط قيمة الفاتورة: ${this.formatCurrency(analytics.averageInvoiceValue)}`,
      data: analytics,
      chartSuggestion: 'line',
    };
  }

  /**
   * Handle profit queries
   */
  private async handleProfitQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const dateRange = this.extractDateRange(query);
    const analytics = await analyticsService.getProfitabilityAnalytics(
      userContext.tenantId,
      userContext.branchId || 'all',
      dateRange
    );

    return {
      type: 'analytics',
      message: `إجمالي الإيرادات: ${this.formatCurrency(analytics.totalRevenue)}\nإجمالي التكاليف: ${this.formatCurrency(analytics.totalCost)}\nصافي الربح: ${this.formatCurrency(analytics.totalProfit)}\nهامش الربح: ${analytics.profitMargin.toFixed(1)}%`,
      data: analytics,
      chartSuggestion: 'bar',
    };
  }

  /**
   * Handle booking queries
   */
  private async handleBookingsQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const dateRange = this.extractDateRange(query);
    const analytics = await analyticsService.getBookingAnalytics(
      userContext.tenantId,
      userContext.branchId || 'all',
      dateRange
    );

    // Check if asking about best technician
    if (query.includes('أفضل') || query.includes('فني')) {
      const bestTechnician = analytics.technicianUtilization[0];
      return {
        type: 'analytics',
        message: `أفضل فني: ${bestTechnician.technicianName} (${bestTechnician.utilization.toFixed(1)}% استخدام)`,
        data: analytics,
        chartSuggestion: 'bar',
      };
    }

    return {
      type: 'analytics',
      message: `إجمالي الحجوزات: ${analytics.totalBookings}`,
      data: analytics,
      chartSuggestion: 'pie',
    };
  }

  /**
   * Handle inventory queries
   */
  private async handleInventoryQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const analytics = await analyticsService.getInventoryAnalytics(
      userContext.tenantId,
      userContext.branchId || 'all'
    );

    // Check if asking about low stock
    if (query.includes('قربت') || query.includes('منخفض') || query.includes('نقص')) {
      const lowStock = analytics.lowStockItems.slice(0, 5);
      return {
        type: 'analytics',
        message: `القطع منخفضة المخزون: ${lowStock.length} قطعة\nقيمة المخزون: ${this.formatCurrency(analytics.inventoryValue)}`,
        data: { lowStockItems: lowStock },
        chartSuggestion: 'bar',
      };
    }

    // Check if asking about most used parts
    if (query.includes('أكثر') || query.includes('مطلوب')) {
      const topUsed = analytics.topUsedParts.slice(0, 5);
      return {
        type: 'analytics',
        message: `أكثر القطع استخداماً: ${topUsed[0]?.partName || 'لا يوجد'}`,
        data: { topUsedParts: topUsed },
        chartSuggestion: 'bar',
      };
    }

    return {
      type: 'analytics',
      message: `قيمة المخزون: ${this.formatCurrency(analytics.inventoryValue)}\nحركات الدخول: ${analytics.stockMovements[0].count}\nحركات الخروج: ${analytics.stockMovements[1].count}`,
      data: analytics,
      chartSuggestion: 'bar',
    };
  }

  /**
   * Handle membership queries
   */
  private async handleMembershipQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const dateRange = this.extractDateRange(query);
    const analytics = await analyticsService.getMembershipAnalytics(
      userContext.tenantId,
      userContext.branchId || 'all',
      dateRange
    );

    return {
      type: 'analytics',
      message: `الاشتراكات النشطة: ${analytics.activeMemberships}\nاشتراكات جديدة: ${analytics.newMemberships}\nإيرادات الاشتراكات: ${this.formatCurrency(analytics.membershipRevenue)}`,
      data: analytics,
      chartSuggestion: 'pie',
    };
  }

  /**
   * Handle branch comparison queries
   */
  private async handleBranchQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const dateRange = this.extractDateRange(query);
    const comparison = await analyticsService.getBranchComparison(
      userContext.tenantId,
      dateRange
    );

    const bestBranch = comparison.sort((a, b) => b.sales - a.sales)[0];

    return {
      type: 'analytics',
      message: `أفضل فرع: ${bestBranch.branchName} (${this.formatCurrency(bestBranch.sales)} مبيعات)`,
      data: comparison,
      chartSuggestion: 'bar',
    };
  }

  /**
   * Handle invoice search
   */
  private async handleInvoiceSearch(query: string, userContext: UserContext): Promise<AIResponse> {
    // Extract invoice number
    const invoiceNumberMatch = query.match(/\d+/);
    if (!invoiceNumberMatch) {
      return {
        type: 'text',
        message: 'يرجى تحديد رقم الفاتورة',
      };
    }

    const invoiceNumber = invoiceNumberMatch[0];
    const invoice = await prisma.invoice.findFirst({
      where: {
        tenantId: userContext.tenantId,
        invoiceNumber: { contains: invoiceNumber },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return {
        type: 'text',
        message: `لم يتم العثور على فاتورة برقم ${invoiceNumber}`,
      };
    }

    return {
      type: 'search',
      message: `تم العثور على فاتورة ${invoice.invoiceNumber}`,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer?.fullName,
        total: invoice.totalSYP,
        status: invoice.status,
        date: invoice.createdAt,
      },
    };
  }

  /**
   * Handle customer search
   */
  private async handleCustomerSearch(query: string, userContext: UserContext): Promise<AIResponse> {
    // Extract customer name
    const nameMatch = query.match(/(?:اسم|اسمه|العميل|الزبون)\s+([أ-ي\s]+)/i);
    const customerName = nameMatch ? nameMatch[1].trim() : query.replace(/(?:عميل|زبون|اسم|اسمه)/gi, '').trim();

    if (!customerName || customerName.length < 2) {
      return {
        type: 'text',
        message: 'يرجى تحديد اسم العميل',
      };
    }

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: userContext.tenantId,
        fullName: { contains: customerName, mode: 'insensitive' },
      },
      take: 5,
    });

    if (customers.length === 0) {
      return {
        type: 'text',
        message: `لم يتم العثور على عملاء باسم "${customerName}"`,
      };
    }

    return {
      type: 'search',
      message: `تم العثور على ${customers.length} عميل`,
      data: customers.map(c => ({
        id: c.id,
        name: c.fullName,
        phone: c.phone,
        loyaltyPoints: c.loyaltyPoints,
      })),
    };
  }

  /**
   * Handle vehicle search
   */
  private async handleVehicleSearch(query: string, userContext: UserContext): Promise<AIResponse> {
    // Extract plate number
    const plateMatch = query.match(/[A-Z]{2,3}-\d{3,4}/i);
    if (!plateMatch) {
      return {
        type: 'text',
        message: 'يرجى تحديد رقم اللوحة (مثال: ABC-123)',
      };
    }

    const plateNumber = plateMatch[0].toUpperCase();
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        tenantId: userContext.tenantId,
        licensePlate: plateNumber,
      },
      include: {
        customer: true,
      },
    });

    if (!vehicle) {
      return {
        type: 'text',
        message: `لم يتم العثور على سيارة برقم ${plateNumber}`,
      };
    }

    return {
      type: 'search',
      message: `تم العثور على سيارة ${plateNumber}`,
      data: {
        plateNumber: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        customer: vehicle.customer?.fullName,
      },
    };
  }

  /**
   * Handle booking search (today's bookings)
   */
  private async handleBookingSearch(query: string, userContext: UserContext): Promise<AIResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: userContext.tenantId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    return {
      type: 'search',
      message: `حجوزات اليوم: ${bookings.length} حجز`,
      data: bookings.map(b => ({
        id: b.id,
        customer: b.customer?.fullName,
        vehicle: b.vehicle?.licensePlate,
        status: b.status,
        scheduledTime: b.scheduledTime,
      })),
    };
  }

  /**
   * Handle summary query
   */
  private async handleSummaryQuery(query: string, userContext: UserContext): Promise<AIResponse> {
    const dateRange = this.extractDateRange(query);
    
    const [sales, bookings, inventory] = await Promise.all([
      analyticsService.getSalesAnalytics(userContext.tenantId, userContext.branchId || 'all', dateRange),
      analyticsService.getBookingAnalytics(userContext.tenantId, userContext.branchId || 'all', dateRange),
      analyticsService.getInventoryAnalytics(userContext.tenantId, userContext.branchId || 'all'),
    ]);

    return {
      type: 'analytics',
      message: `ملخص الأداء:\n- المبيعات: ${this.formatCurrency(sales.totalSales)}\n- الحجوزات: ${bookings.totalBookings}\n- قيمة المخزون: ${this.formatCurrency(inventory.inventoryValue)}`,
      data: { sales, bookings, inventory },
      chartSuggestion: null,
    };
  }

  /**
   * Handle anomaly detection
   */
  private async handleAnomalyDetection(userContext: UserContext): Promise<AIResponse> {
    const insights: string[] = [];
    const warnings: string[] = [];

    // Check low stock items
    const inventory = await analyticsService.getInventoryAnalytics(userContext.tenantId, userContext.branchId || 'all');
    if (inventory.lowStockItems.length > 0) {
      warnings.push(`${inventory.lowStockItems.length} قطعة منخفضة المخزون`);
    }

    // Check booking cancellations
    const dateRange = { dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), dateTo: new Date() };
    const bookings = await analyticsService.getBookingAnalytics(userContext.tenantId, userContext.branchId || 'all', dateRange);
    const cancelledBookings = bookings.bookingsByStatus.find(b => b.status === 'CANCELLED');
    if (cancelledBookings && cancelledBookings.count > 5) {
      warnings.push(`ارتفاع معدل إلغاء الحجوزات: ${cancelledBookings.count} إلغاء`);
    }

    if (warnings.length === 0) {
      return {
        type: 'insight',
        message: 'لا توجد مشاكل ملحوظة حالياً',
        severity: 'success',
      };
    }

    return {
      type: 'insight',
      message: 'تم اكتشاف المشاكل التالية:\n' + warnings.map(w => `- ${w}`).join('\n'),
      severity: 'warning',
      data: { warnings },
    };
  }

  /**
   * Extract date range from query
   */
  private extractDateRange(query: string): { dateFrom: Date; dateTo: Date } {
    const now = new Date();
    
    if (query.includes('اليوم')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { dateFrom: today, dateTo: now };
    }
    
    if (query.includes('الأسبوع') || query.includes('أسبوع')) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return { dateFrom: weekAgo, dateTo: now };
    }
    
    if (query.includes('الشهر') || query.includes('شهر')) {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return { dateFrom: monthAgo, dateTo: now };
    }

    // Default: last 30 days
    const defaultRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return { dateFrom: defaultRange, dateTo: now };
  }

  /**
   * Format currency
   */
  private formatCurrency(value: number): string {
    return `${value.toFixed(0)} ل.س`;
  }
}

export default new AiService();
