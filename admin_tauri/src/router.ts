import { AuthService } from './services/auth'
import { ApiClient } from './api/client'
import { LoginScreen } from './screens/login'
import { DashboardScreen } from './screens/dashboard'
import { BookingsScreen } from './screens/bookings'
import { BookingWizardScreen } from './screens/booking-wizard'
import { BookingTicketScreen } from './screens/booking-ticket'
import { BookingPrintTicketScreen } from './screens/booking-print-ticket'
import { InvoicesScreen } from './screens/invoices'
import { InvoiceDetailScreen } from './screens/invoice-detail'
import { ManualInvoiceScreen } from './screens/manual-invoice'
import { PaymentScreen } from './screens/payment'
import { InvoicePrintScreen } from './screens/invoice-print'
import { PosScreen } from './screens/pos'
import { InventoryScreen } from './screens/inventory'
import { WarehousesScreen } from './screens/warehouses'
import { SuppliersScreen } from './screens/suppliers'
import { PurchaseOrdersScreen } from './screens/purchase-orders'
import { BranchesScreen } from './screens/branches'
import { AccountingScreen } from './screens/accounting'
import { ChartOfAccountsScreen } from './screens/chart-of-accounts'
import { JournalEntriesScreen } from './screens/journal-entries'
import { GeneralLedgerScreen } from './screens/general-ledger'
import { TrialBalanceScreen } from './screens/trial-balance'
import { BalanceSheetScreen } from './screens/balance-sheet'
import { IncomeStatementScreen } from './screens/income-statement'
import { CashFlowScreen } from './screens/cash-flow'
import { CustomersScreen } from './screens/customers'
import { CustomerDetailScreen } from './screens/customer-detail'
import { DealersScreen } from './screens/dealers'
import { LoyaltyScreen } from './screens/loyalty'
import { HrScreen } from './screens/hr'
import { EmployeeFormScreen } from './screens/employee-form'
import { DepartmentsScreen } from './screens/departments'
import { ReportsScreen } from './screens/reports'
import { RevenueReportScreen } from './screens/revenue-report'
import { InventoryReportScreen } from './screens/inventory-report'
import { CustomerReportScreen } from './screens/customer-report'
import { BookingReportScreen } from './screens/booking-report'
import { AnalyticsScreen } from './screens/analytics'
import { NotificationsScreen } from './screens/notifications'
import { DocumentsScreen } from './screens/documents'
import { AdminScreen } from './screens/admin'
import { UsersScreen } from './screens/users'
import { RolesScreen } from './screens/roles'
import { AuditScreen } from './screens/audit'
import { SettingsScreen } from './screens/settings'
import { SetupWizardScreen } from './screens/setup-wizard'
import { WorkshopMapScreen } from './screens/workshop-map'
import { ServicesScreen } from './screens/services'
import { CostCentersScreen } from './screens/cost-centers'
import { AssetsScreen } from './screens/assets'

export class Router {
  private container: HTMLElement | null = null
  private auth: AuthService
  private api: ApiClient
  private currentPath: string = ''

  constructor(auth: AuthService, api: ApiClient) {
    this.auth = auth
    this.api = api
  }

  init(container: HTMLElement) {
    console.log('[DEBUG] Router init start')
    this.container = container
    let hash = window.location.hash.slice(1) || '/'
    if (!hash.startsWith('/')) hash = '/' + hash
    console.log('[DEBUG] Initial hash:', hash)
    this.navigate(hash, true)
    window.addEventListener('hashchange', () => {
      console.log('[DEBUG] Hash changed:', window.location.hash)
      let h = window.location.hash.slice(1) || '/'
      if (!h.startsWith('/')) h = '/' + h
      this.navigate(h, true)
    })
    console.log('[DEBUG] Router init done')
  }

  navigate(path: string, fromHashChange: boolean = false) {
    if (!path.startsWith('/')) path = '/' + path
    console.log('[DEBUG] navigate:', path, 'fromHashChange:', fromHashChange)
    if (!this.container) return
    if (path === this.currentPath && !fromHashChange) return
    this.currentPath = path

    if (!this.auth.isAuthenticated() && path !== '/login') {
      console.log('[DEBUG] Not authenticated, redirect to login')
      path = '/login'
      window.location.hash = '#login'
      return
    }
    if (this.auth.isAuthenticated() && path === '/login') {
      path = '/'
      window.location.hash = '#'
      return
    }

    // Update hash to match path (triggers hashchange which calls navigate again)
    if (!fromHashChange) {
      const targetHash = '#' + path
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash
        return
      }
    }

    this.container.innerHTML = ''
    const screen = this.createScreen(path)
    this.container.appendChild(screen.render())
  }

  private createScreen(path: string) {
    // Exact matches first
    switch (path) {
      case '/login': return new LoginScreen(this.auth, this.api, this)
      case '/':
      case '/dashboard': return new DashboardScreen(this.auth, this.api, this)
      case '/bookings': return new BookingsScreen(this.auth, this.api, this)
      case '/bookings/new': return new BookingWizardScreen(this.auth, this.api, this, 'new')
      case '/bookings/existing': return new BookingWizardScreen(this.auth, this.api, this, 'registered')
      case '/invoices': return new InvoicesScreen(this.auth, this.api, this)
      case '/invoices/new': {
        const hash = window.location.hash
        const qIndex = hash.indexOf('?')
        const queryString = qIndex > -1 ? hash.slice(qIndex + 1) : ''
        const params = new URLSearchParams(queryString)
        const type = params.get('type') === 'booking' ? 'booking' : 'manual'
        return new ManualInvoiceScreen(this.auth, this.api, this, type)
      }
      case '/pos': return new PosScreen(this.auth, this.api, this)
      case '/inventory': return new InventoryScreen(this.auth, this.api, this)
      case '/inventory/warehouses': return new WarehousesScreen(this.auth, this.api, this)
      case '/inventory/suppliers': return new SuppliersScreen(this.auth, this.api, this)
      case '/inventory/purchase-orders': return new PurchaseOrdersScreen(this.auth, this.api, this)
      case '/branches': return new BranchesScreen(this.auth, this.api, this)
      case '/accounting': return new AccountingScreen(this.auth, this.api, this)
      case '/accounting/chart-of-accounts': return new ChartOfAccountsScreen(this.auth, this.api, this)
      case '/accounting/journal-entries': return new JournalEntriesScreen(this.auth, this.api, this)
      case '/accounting/general-ledger': return new GeneralLedgerScreen(this.auth, this.api, this)
      case '/accounting/trial-balance': return new TrialBalanceScreen(this.auth, this.api, this)
      case '/accounting/balance-sheet': return new BalanceSheetScreen(this.auth, this.api, this)
      case '/accounting/income-statement': return new IncomeStatementScreen(this.auth, this.api, this)
      case '/accounting/cash-flow': return new CashFlowScreen(this.auth, this.api, this)
      case '/customers': return new CustomersScreen(this.auth, this.api, this)
      case '/dealers': return new DealersScreen(this.auth, this.api, this)
      case '/loyalty': return new LoyaltyScreen(this.auth, this.api, this)
      case '/hr': return new HrScreen(this.auth, this.api, this)
      case '/hr/employees/new': return new EmployeeFormScreen(this.auth, this.api, this, null)
      case '/departments': return new DepartmentsScreen(this.auth, this.api, this)
      case '/reports': return new ReportsScreen(this.auth, this.api, this)
      case '/reports/revenue': return new RevenueReportScreen(this.auth, this.api, this)
      case '/reports/inventory': return new InventoryReportScreen(this.auth, this.api, this)
      case '/reports/customers': return new CustomerReportScreen(this.auth, this.api, this)
      case '/reports/bookings': return new BookingReportScreen(this.auth, this.api, this)
      case '/analytics': return new AnalyticsScreen(this.auth, this.api, this)
      case '/notifications': return new NotificationsScreen(this.auth, this.api, this)
      case '/documents': return new DocumentsScreen(this.auth, this.api, this)
      case '/admin': return new AdminScreen(this.auth, this.api, this)
      case '/admin/users': return new UsersScreen(this.auth, this.api, this)
      case '/admin/roles': return new RolesScreen(this.auth, this.api, this)
      case '/admin/audit': return new AuditScreen(this.auth, this.api, this)
      case '/admin/settings': return new SettingsScreen(this.auth, this.api, this)
      case '/admin/setup': return new SetupWizardScreen(this.auth, this.api, this)
      case '/workshop-map': return new WorkshopMapScreen(this.auth, this.api, this)
      case '/services': return new ServicesScreen(this.auth, this.api, this)
      case '/cost-centers': return new CostCentersScreen(this.auth, this.api, this)
      case '/assets': return new AssetsScreen(this.auth, this.api, this)
    }
    // Dynamic routes
    if (path.startsWith('/bookings/ticket/')) return new BookingTicketScreen(this.auth, this.api, this, path.split('/').pop()!)
    if (path.startsWith('/bookings/print/')) return new BookingPrintTicketScreen(this.auth, this.api, this, path.split('/').pop()!)
    if (path.startsWith('/invoices/print/')) return new InvoicePrintScreen(this.auth, this.api, this, path.split('/').pop()!)
    if (path.startsWith('/invoices/')) return new InvoiceDetailScreen(this.auth, this.api, this, path.split('/').pop()!)
    if (path.startsWith('/payments/new')) {
      const hash = window.location.hash
      const qIndex = hash.indexOf('?')
      const queryString = qIndex > -1 ? hash.slice(qIndex + 1) : ''
      const params = new URLSearchParams(queryString)
      return new PaymentScreen(this.auth, this.api, this, params.get('invoiceId') || undefined)
    }
    if (path.startsWith('/hr/employees/')) return new EmployeeFormScreen(this.auth, this.api, this, path.split('/').pop()!)
    if (path.startsWith('/customers/')) return new CustomerDetailScreen(this.auth, this.api, this, path.split('/').pop()!)
    if (path.startsWith('/dealers/')) return new DealersScreen(this.auth, this.api, this)
    // Fallback
    return new DashboardScreen(this.auth, this.api, this)
  }
}

export interface Screen {
  render(): HTMLElement
}
