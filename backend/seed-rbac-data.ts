import prisma from './src/config/database';

/**
 * Seed default permissions and roles for RBAC system
 * Run with: npx ts-node seed-rbac-data.ts
 */

const PERMISSIONS = [
  { key: 'view_reports', description: 'View all reports' },
  { key: 'manage_inventory', description: 'Manage inventory and stock' },
  { key: 'manage_bookings', description: 'Manage bookings and appointments' },
  { key: 'manage_invoices', description: 'Manage invoices and payments' },
  { key: 'manage_memberships', description: 'Manage customer memberships' },
  { key: 'manage_customers', description: 'Manage customer records' },
  { key: 'manage_employees', description: 'Manage employee records' },
  { key: 'manage_branches', description: 'Manage branches' },
  { key: 'manage_warehouses', description: 'Manage warehouses' },
  { key: 'manage_transfers', description: 'Manage inventory transfers' },
  { key: 'view_profitability', description: 'View profitability reports' },
  { key: 'view_analytics', description: 'View analytics dashboard' },
  { key: 'use_ai_assistant', description: 'Use AI assistant' },
  { key: 'manage_roles', description: 'Manage roles and permissions' },
  { key: 'view_schedule', description: 'View technician schedule' },
  { key: 'update_schedule_status', description: 'Update schedule status' },
  { key: 'view_vehicle_history', description: 'View vehicle service history' },
  { key: 'view_inventory_reports', description: 'View inventory reports' },
  { key: 'view_sales_reports', description: 'View sales reports' },
  { key: 'manage_services', description: 'Manage services' },
  { key: 'manage_suppliers', description: 'Manage suppliers' },
  { key: 'manage_purchase_orders', description: 'Manage purchase orders' },
  { key: 'view_audit_logs', description: 'View audit logs' },
  { key: 'manage_settings', description: 'Manage system settings' },
];

const ROLE_PERMISSIONS = {
  ADMIN: PERMISSIONS.map((p) => p.key), // All permissions

  MANAGER: [
    'view_reports',
    'view_profitability',
    'manage_bookings',
    'manage_invoices',
    'manage_customers',
    'manage_memberships',
    'manage_inventory',
    'view_analytics',
    'use_ai_assistant',
    'view_schedule',
    'view_vehicle_history',
    'manage_services',
    'manage_settings',
  ],

  TECHNICIAN: [
    'view_schedule',
    'update_schedule_status',
    'view_vehicle_history',
  ],

  INVENTORY: [
    'manage_inventory',
    'manage_transfers',
    'manage_warehouses',
    'view_inventory_reports',
    'manage_suppliers',
    'manage_purchase_orders',
  ],

  ACCOUNTANT: [
    'manage_invoices',
    'view_profitability',
    'view_sales_reports',
    'view_reports',
  ],

  RECEPTION: [
    'manage_bookings',
    'manage_customers',
    'view_invoices',
    'view_schedule',
    'view_vehicle_history',
  ],
};

async function seedRBAC() {
  console.log('Starting RBAC seed...');

  // Get the first tenant (for seeding purposes)
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('No tenant found. Please create a tenant first.');
    return;
  }

  console.log(`Using tenant: ${tenant.name}`);

  // Create permissions
  console.log('Creating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }
  console.log(`Created ${PERMISSIONS.length} permissions`);

  // Create roles and assign permissions
  console.log('Creating roles and assigning permissions...');
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: roleName,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: roleName,
        description: `${roleName} role`,
      },
    });

    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Create role permissions
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`Created role ${roleName} with ${permissions.length} permissions`);
  }

  console.log('RBAC seed completed successfully!');
}

seedRBAC()
  .catch((e) => {
    console.error('Error seeding RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
