import prisma from '../config/database';

interface CompanySettings {
  id: string;
  tenantId: string;
  companyName: string;
  companyNameAr?: string;
  companyNameEn?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  taxNumber?: string;
  defaultCurrencyId?: string;
  autoUpdatePurchasePrice: boolean;
  overheadPercentage: number;
  enableWhatsAppNotifications: boolean;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappBusinessAccountId?: string;
  whatsappBusinessNumber?: string;
  membershipScope: string;
  membershipAutoRenew: boolean;
  timezone: string;
  currency: string;
  exchangeRate: number;
  taxRate: number;
  dateFormat: string;
  timeFormat: string;
  primaryColor: string;
  secondaryColor: string;
  sidebarStyle: string;
  loginBackgroundUrl?: string;
  autoAssignTechnician: boolean;
  defaultBookingDuration: number;
  allowOnlineBooking: boolean;
  autoGenerateInvoiceNumber: boolean;
  invoicePrefix: string;
  invoiceFooterNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicSettings {
  companyName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  primaryColor: string;
  secondaryColor: string;
}

// Simple in-memory cache
const settingsCache = new Map<string, { data: CompanySettings; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class SettingsService {
  /**
   * Get full settings for a tenant with caching
   */
  private getDefaultSettings(tenantId: string): CompanySettings {
    return {
      id: '',
      tenantId,
      companyName: '',
      autoUpdatePurchasePrice: true,
      overheadPercentage: 0.1,
      enableWhatsAppNotifications: true,
      membershipScope: 'GLOBAL',
      membershipAutoRenew: false,
      timezone: 'UTC',
      currency: 'USD',
      exchangeRate: 15000,
      taxRate: 0,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      primaryColor: '#1976D2',
      secondaryColor: '#FF5722',
      sidebarStyle: 'LIGHT',
      autoAssignTechnician: false,
      defaultBookingDuration: 60,
      allowOnlineBooking: false,
      autoGenerateInvoiceNumber: true,
      invoicePrefix: 'INV',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getSettings(tenantId: string): Promise<CompanySettings> {
    // Check cache
    const cached = settingsCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Fetch from database
    const settings = await prisma.companySettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      const defaults = this.getDefaultSettings(tenantId);
      settingsCache.set(tenantId, { data: defaults, timestamp: Date.now() });
      return defaults;
    }

    // Cache the result - convert Decimal to number
    const settingsWithNumbers = {
      ...settings,
      overheadPercentage: Number((settings as any).overheadPercentage || 0),
      exchangeRate: Number((settings as any).exchangeRate || 15000),
      taxRate: Number((settings as any).taxRate || 0),
    };
    settingsCache.set(tenantId, { data: settingsWithNumbers as CompanySettings, timestamp: Date.now() });

    return settingsWithNumbers as CompanySettings;
  }

  /**
   * Update settings with validation
   */
  async updateSettings(tenantId: string, partialSettings: Partial<CompanySettings>): Promise<CompanySettings> {
    // Validate settings
    this.validateSettings(partialSettings);

    // Upsert in database (create if missing, update if exists)
    const updatedSettings = await prisma.companySettings.upsert({
      where: { tenantId },
      update: partialSettings,
      create: {
        tenantId,
        companyName: partialSettings.companyName || '',
        currency: partialSettings.currency || 'USD',
        exchangeRate: partialSettings.exchangeRate ?? 15000,
        timezone: partialSettings.timezone || 'UTC',
        taxRate: partialSettings.taxRate ?? 0,
        dateFormat: partialSettings.dateFormat || 'DD/MM/YYYY',
        timeFormat: partialSettings.timeFormat || '24h',
        primaryColor: partialSettings.primaryColor || '#1976D2',
        secondaryColor: partialSettings.secondaryColor || '#FF5722',
        sidebarStyle: partialSettings.sidebarStyle || 'LIGHT',
        membershipScope: partialSettings.membershipScope || 'GLOBAL',
        autoUpdatePurchasePrice: partialSettings.autoUpdatePurchasePrice ?? true,
        overheadPercentage: partialSettings.overheadPercentage ?? 0.1,
        enableWhatsAppNotifications: partialSettings.enableWhatsAppNotifications ?? true,
        membershipAutoRenew: partialSettings.membershipAutoRenew ?? false,
        autoAssignTechnician: partialSettings.autoAssignTechnician ?? false,
        defaultBookingDuration: partialSettings.defaultBookingDuration ?? 60,
        allowOnlineBooking: partialSettings.allowOnlineBooking ?? false,
        autoGenerateInvoiceNumber: partialSettings.autoGenerateInvoiceNumber ?? true,
        invoicePrefix: partialSettings.invoicePrefix || 'INV',
        ...partialSettings,
      },
    });

    // Invalidate cache
    settingsCache.delete(tenantId);

    // Convert Decimal to number
    return { ...updatedSettings, overheadPercentage: Number((updatedSettings as any).overheadPercentage || 0), exchangeRate: Number((updatedSettings as any).exchangeRate || 15000), taxRate: Number((updatedSettings as any).taxRate || 0) } as CompanySettings;
  }

  /**
   * Get public-safe settings (no sensitive data)
   */
  async getPublicSettings(tenantId: string): Promise<PublicSettings> {
    const settings = await this.getSettings(tenantId);

    return {
      companyName: settings.companyName,
      logoUrl: settings.logoUrl,
      address: settings.address,
      phone: settings.phone,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    };
  }

  /**
   * Validate settings values
   */
  private validateSettings(settings: Partial<CompanySettings>): void {
    // Validate exchangeRate
    if (settings.exchangeRate !== undefined) {
      if (typeof settings.exchangeRate !== 'number' || settings.exchangeRate <= 0) {
        throw new Error('exchangeRate must be a positive number');
      }
    }

    // Validate taxRate
    if (settings.taxRate !== undefined) {
      if (typeof settings.taxRate !== 'number' || settings.taxRate < 0) {
        throw new Error('taxRate must be a non-negative number');
      }
    }

    // Validate timezone
    if (settings.timezone !== undefined) {
      const validTimezones = [
        'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai',
        'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
      ];
      if (!validTimezones.includes(settings.timezone)) {
        throw new Error(`Invalid timezone: ${settings.timezone}`);
      }
    }

    // Validate currency
    if (settings.currency !== undefined) {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'SYP', 'AED', 'SAR'];
      if (!validCurrencies.includes(settings.currency)) {
        throw new Error(`Invalid currency: ${settings.currency}`);
      }
    }

    // Validate dateFormat
    if (settings.dateFormat !== undefined) {
      const validDateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
      if (!validDateFormats.includes(settings.dateFormat)) {
        throw new Error(`Invalid dateFormat: ${settings.dateFormat}`);
      }
    }

    // Validate timeFormat
    if (settings.timeFormat !== undefined) {
      const validTimeFormats = ['24h', '12h'];
      if (!validTimeFormats.includes(settings.timeFormat)) {
        throw new Error(`Invalid timeFormat: ${settings.timeFormat}`);
      }
    }

    // Validate sidebarStyle
    if (settings.sidebarStyle !== undefined) {
      const validSidebarStyles = ['LIGHT', 'DARK'];
      if (!validSidebarStyles.includes(settings.sidebarStyle)) {
        throw new Error(`Invalid sidebarStyle: ${settings.sidebarStyle}`);
      }
    }

    // Validate membershipScope
    if (settings.membershipScope !== undefined) {
      const validMembershipScopes = ['GLOBAL', 'BRANCH'];
      if (!validMembershipScopes.includes(settings.membershipScope)) {
        throw new Error(`Invalid membershipScope: ${settings.membershipScope}`);
      }
    }

    // Validate defaultBookingDuration
    if (settings.defaultBookingDuration !== undefined) {
      if (typeof settings.defaultBookingDuration !== 'number' || settings.defaultBookingDuration < 15) {
        throw new Error('defaultBookingDuration must be at least 15 minutes');
      }
    }

    // Validate primaryColor (hex color)
    if (settings.primaryColor !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(settings.primaryColor)) {
        throw new Error('primaryColor must be a valid hex color (e.g., #1976D2)');
      }
    }

    // Validate secondaryColor (hex color)
    if (settings.secondaryColor !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(settings.secondaryColor)) {
        throw new Error('secondaryColor must be a valid hex color (e.g., #FF5722)');
      }
    }
  }

  /**
   * Clear cache for a specific tenant
   */
  clearCache(tenantId: string): void {
    settingsCache.delete(tenantId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    settingsCache.clear();
  }
}

export default new SettingsService();
