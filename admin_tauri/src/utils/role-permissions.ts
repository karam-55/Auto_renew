/**
 * Role-based access control for the admin UI.
 * Maps user roles to accessible routes and UI features.
 */

export type UserRole = 'ADMIN' | 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'MECHANIC' | 'ACCOUNTANT' | 'SALES' | 'CASHIER' | 'HR_MANAGER' | string

/**
 * Routes accessible by each role.
 * ADMIN and OWNER get everything implicitly.
 */
const ROLE_ROUTES: Record<string, string[]> = {
  MANAGER: [
    '/dashboard', '/bookings', '/bookings/new', '/bookings/existing',
    '/invoices', '/pos', '/services', '/inventory', '/inventory/warehouses',
    '/inventory/suppliers', '/inventory/purchase-orders', '/customers', '/dealers',
    '/loyalty', '/accounting', '/accounting/chart-of-accounts', '/accounting/journal-entries',
    '/accounting/general-ledger', '/accounting/trial-balance', '/accounting/balance-sheet',
    '/accounting/income-statement', '/accounting/cash-flow', '/cost-centers', '/assets',
    '/hr', '/workshop-map', '/reports', '/reports/revenue', '/reports/inventory',
    '/reports/customers', '/reports/bookings', '/analytics', '/branches', '/notifications',
    '/documents', '/admin', '/admin/settings', '/admin/setup',
  ],
  RECEPTIONIST: [
    '/dashboard', '/bookings', '/bookings/new', '/bookings/existing',
    '/invoices', '/pos', '/services', '/inventory', '/customers', '/dealers',
    '/loyalty', '/notifications', '/workshop-map',
  ],
  MECHANIC: [
    '/dashboard', '/bookings', '/services', '/inventory', '/workshop-map', '/notifications',
  ],
  ACCOUNTANT: [
    '/dashboard', '/invoices', '/accounting', '/accounting/chart-of-accounts',
    '/accounting/journal-entries', '/accounting/general-ledger', '/accounting/trial-balance',
    '/accounting/balance-sheet', '/accounting/income-statement', '/accounting/cash-flow',
    '/cost-centers', '/assets', '/reports', '/reports/revenue', '/analytics',
    '/customers', '/suppliers', '/notifications',
  ],
  SALES: [
    '/dashboard', '/bookings', '/bookings/new', '/bookings/existing',
    '/pos', '/customers', '/dealers', '/loyalty', '/services', '/notifications',
  ],
  CASHIER: [
    '/dashboard', '/pos', '/invoices', '/payments/new', '/customers', '/notifications',
  ],
  HR_MANAGER: [
    '/dashboard', '/hr', '/departments', '/employees', '/notifications',
  ],
}

/**
 * Check if a role has access to a given route.
 * ADMIN and OWNER always have access.
 */
export function canAccess(role: string | undefined, route: string): boolean {
  if (!role) return false
  const upperRole = role.toUpperCase()
  if (upperRole === 'ADMIN' || upperRole === 'OWNER') return true

  const allowedRoutes = ROLE_ROUTES[upperRole]
  if (!allowedRoutes) return false

  // Exact match
  if (allowedRoutes.includes(route)) return true

  // Check parent routes (e.g. /bookings/ticket/123 should match /bookings)
  return allowedRoutes.some((r) => route.startsWith(r + '/') || route === r)
}

/**
 * Filter menu items based on role.
 */
export function filterMenuByRole(role: string | undefined, menuGroups: Array<{ label: string; items: Array<{ route: string; label: string; icon: string }> }>) {
  if (!role) return []
  const upperRole = role.toUpperCase()
  if (upperRole === 'ADMIN' || upperRole === 'OWNER') return menuGroups

  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(role, item.route)),
    }))
    .filter((group) => group.items.length > 0)
}

/**
 * UI feature permissions (beyond route access).
 */
export const UI_PERMISSIONS = {
  DELETE_BOOKING: ['ADMIN', 'OWNER', 'MANAGER'],
  DELETE_INVOICE: ['ADMIN', 'OWNER', 'MANAGER'],
  DELETE_CUSTOMER: ['ADMIN', 'OWNER', 'MANAGER'],
  BULK_OPERATIONS: ['ADMIN', 'OWNER', 'MANAGER'],
  EXPORT_DATA: ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'],
  MANAGE_USERS: ['ADMIN', 'OWNER'],
  MANAGE_ROLES: ['ADMIN', 'OWNER'],
  MANAGE_SETTINGS: ['ADMIN', 'OWNER', 'MANAGER'],
  VIEW_ANALYTICS: ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'],
  CREATE_INVOICE: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'CASHIER'],
  CREATE_BOOKING: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES'],
  EDIT_BOOKING: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES'],
  ASSIGN_MECHANIC: ['ADMIN', 'OWNER', 'MANAGER'],
} as const

export function hasUiPermission(role: string | undefined, permission: keyof typeof UI_PERMISSIONS): boolean {
  if (!role) return false
  const upperRole = role.toUpperCase()
  if (upperRole === 'ADMIN' || upperRole === 'OWNER') return true
  const allowed = UI_PERMISSIONS[permission]
  return allowed.includes(upperRole as any)
}
