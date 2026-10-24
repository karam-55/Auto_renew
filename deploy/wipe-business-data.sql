-- Wipe all business/operational data while preserving:
--   tenants, users/roles, branches, initial-setup defaults
--   (chart of accounts, currencies, fiscal period, services,
--    categories, cost centers, asset categories, sequences).
DO $$
DECLARE
  keep_list text[] := ARRAY[
    '_prisma_migrations','_sovereign_control',
    'Tenant','CompanySettings','User','Role','Permission','RolePermission','Branch','EmployeeBranch',
    'Account','AccountPostingMap','Currency','ExchangeRate','FiscalPeriod','TaxRate',
    'AssetCategory','CostCenter','CostCenterAllocation',
    'PartCategory','ServiceCategory','Service','ServicePart','ServiceCostDetail',
    'InvoiceNumberSequence','PurchaseOrderNumberSequence','GoodsReceiptNoteNumberSequence',
    'ExtraChargeType','MembershipPlan','LoyaltyReward','Promotion','PromotionCondition',
    'VehicleCategory','VehicleBrand','VehicleModel','MaintenancePackage','MaintenancePackageItem',
    'NotificationRule','Department','Shift','TimeSlot','CashRegister',
    'Employee','Warehouse'
  ];
  t text;
  trunc_list text := '';
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND NOT (tablename = ANY(keep_list))
  LOOP
    trunc_list := trunc_list || format('%I, ', t);
  END LOOP;
  IF trunc_list <> '' THEN
    trunc_list := left(trunc_list, length(trunc_list)-2);
    EXECUTE 'TRUNCATE TABLE ' || trunc_list || ' RESTART IDENTITY CASCADE';
    RAISE NOTICE 'Truncated: %', trunc_list;
  END IF;
END $$;

-- NOTE: number sequences are intentionally NOT reset so previously issued
-- invoice/PO numbers are never reused after the wipe.
