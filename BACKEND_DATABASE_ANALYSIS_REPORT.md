# تقرير تحليل Backend وقاعدة البيانات الشامل
**التاريخ:** 12 يونيو 2026  
**المشروع:** AUTO_Renew - Auto Garage Management System

---

## 📋 ملخص تنفيذي

### البنية التقنية
- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL مع Prisma ORM
- **Auth:** JWT-based authentication
- **Real-time:** Socket.IO
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API)

### الإحصائيات
- **عدد Models في قاعدة البيانات:** 70+ model
- **عدد Modules في Backend:** 60+ module
- **عدد API Endpoints:** 200+ endpoint
- **عدد Enums:** 40+ enum

---

## 🗄️ قاعدة البيانات (Prisma Schema)

### الكيانات الأساسية (Core Entities)

#### 1. **Tenant** (المستأجر)
- الوصف: Multi-tenancy support
- العلاقات: يرتبط بجميع الكيانات الأخرى
- الحقول: id, name, nameAr, nameEn, domain, logoUrl, isActive

#### 2. **User** (المستخدمين)
- الوصف: نظام المستخدمين والمصادقة
- الأدوار (UserRole): OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT, MECHANIC, SALES, CASHIER, HR_MANAGER
- الحقول: id, tenantId, fullName, username, passwordHash, phone, role, isActive, failedLoginAttempts, lockedUntil
- العلاقات: AuditLog, CashRegister, Employee, JournalEntries, MechanicAssignments, PartSuggestions, PushNotificationToken, TaskAssignment

#### 3. **Customer** (العملاء)
- الوصف: إدارة العملاء
- الحقول: id, tenantId, fullName, phone, address, notes, isActive, city, isVip, loyaltyPoints
- العلاقات: Bookings, Invoices, Vehicles, CustomerMemberships, LoyaltyPointTransactions, CustomerWallet

#### 4. **Vehicle** (المركبات)
- الوصف: إدارة المركبات
- الحقول: id, tenantId, customerId, categoryId, make, model, year, licensePlate, vin, publicCarId, currentKm, lastServiceDate, nextServiceDate, color
- العلاقات: Bookings, Attachments, PreventiveMaintenanceLogs, InspectionChecklists, Issues, MileageLogs, Histories, Faults, Attachments, Recommendations

#### 5. **Booking** (الحجوزات)
- الوصف: إدارة حجوزات الخدمات
- الحالات (BookingStatus): PENDING, IN_PROGRESS, WAITING_PARTS, READY, DELIVERED, CANCELLED, CONFIRMED, COMPLETED, NO_SHOW
- الحقول: id, tenantId, branchId, customerId, vehicleId, status, publicToken, notes, estimatedCompletionDate, actualCompletionDate, scheduledDate, scheduledTime, priority
- العلاقات: Customer, Vehicle, Branch, BookingExtraCharges, BookingServices, ElectronicSignature, Invoices, MechanicAssignments, PartSuggestions, Reviews, Tasks, Schedules

#### 6. **Service** (الخدمات)
- الوصف: الخدمات المقدمة
- الحقول: id, tenantId, categoryId, name, nameAr, nameEn, description, priceSYP, priceUSD, estimatedDurationMinutes, isActive, basePrice, duration
- العلاقات: BookingServices, InvoiceItems, MaintenancePackageItems, ServiceParts, Schedules

#### 7. **Part** (قطع الغيار)
- الوصف: إدارة قطع الغيار
- الحقول: id, tenantId, partNumber, name, nameAr, nameEn, categoryId, supplierId, description, costSYP, costUSD, sellingPriceSYP, sellingPriceUSD, quantity, minQuantity, location, isActive
- العلاقات: GRNLines, InventoryCountItems, InventoryTransactions, InvoiceItems, MaintenancePackageItems, ServiceParts, TransferItems, PurchaseOrderItems

#### 8. **Invoice** (الفواتير)
- الوصف: إدارة الفواتير
- الحالات (InvoiceStatus): DRAFT, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED, ISSUED
- الحقول: id, tenantId, branchId, customerId, bookingId, invoiceNumber, invoiceDate, dueDate, subtotalSYP, subtotalUSD, taxSYP, taxUSD, discountSYP, discountUSD, loyaltyPointsEarned, loyaltyPointsRedeemed, totalSYP, totalUSD, paidSYP, paidUSD, status
- العلاقات: Booking, Branch, Customer, InstallmentPlan, TaxRate, Items, Payments

#### 9. **Payment** (المدفوعات)
- الوصف: إدارة المدفوعات
- طرق الدفع (PaymentMethod): CASH, BANK_TRANSFER, CREDIT_CARD, CHECK
- الحقول: id, tenantId, invoiceId, amountSYP, amountUSD, paymentDate, paymentMethod, reference, notes, cashRegisterSessionId, customerId, supplierId
- العلاقات: Invoice, CashRegisterSession

---

### المحاسبة والمالية (Accounting & Finance)

#### 10. **Account** (دليل الحسابات)
- الوصف: Chart of Accounts
- أنواع الحسابات (AccountType): ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- الحقول: id, tenantId, code, nameAr, nameEn, parentId, accountType, balanceSYP, balanceUSD, isActive
- العلاقات: Parent, Children, JournalLines

#### 11. **JournalEntry** (القيود اليومية)
- الوصف: إدارة القيود المحاسبية
- الحالات (JournalEntryStatus): DRAFT, POSTED, CANCELLED
- الحقول: id, tenantId, entryDate, reference, description, isReversing, reversingDate, isReversed, fiscalPeriodId, sourceType, sourceId, createdById, approvedById, approvedAt, status
- العلاقات: ApprovedBy, CreatedBy, FiscalPeriod, Lines

#### 12. **JournalLine** (بنود القيود)
- الوصف: بنود القيود المحاسبية
- الحقول: id, entryId, accountId, accountName, debitSYP, debitUSD, creditSYP, creditUSD, description, sourceType, sourceId
- العلاقات: Account, Entry

#### 13. **FiscalPeriod** (الفترات المالية)
- الوصف: إدارة الفترات المالية
- الحالات (FiscalPeriodStatus): ACTIVE, CLOSED, PENDING
- الحقول: id, tenantId, name, startDate, endDate, isClosed, status
- العلاقات: JournalEntries

#### 14. **Currency** (العملات)
- الوصف: إدارة العملات
- الحقول: id, code, name, symbol, isActive, decimalPlaces, isDefault, nameAr, nameEn, tenantId
- العلاقات: ExchangeRatesFrom, ExchangeRatesTo

#### 15. **ExchangeRate** (أسعار الصرف)
- الوصف: إدارة أسعار الصرف
- الحقول: id, fromCurrencyId, toCurrencyId, rate, effectiveDate, isActive, tenantId
- العلاقات: FromCurrency, ToCurrency

#### 16. **TaxRate** (معدلات الضريبة)
- الوصف: إدارة معدلات الضريبة
- الحقول: id, tenantId, name, rate, appliesTo, isActive
- العلاقات: Invoices

#### 17. **Cheque** (الشيكات)
- الوصف: إدارة الشيكات
- أنواع الشيكات (ChequeType): RECEIVED, ISSUED
- حالات الشيكات (ChequeStatus): PENDING, DEPOSITED, CLEARED, BOUNCED, CANCELLED, DELAYED
- الحقول: id, tenantId, chequeNumber, bankName, branchName, amountSYP, amountUSD, chequeDate, dueDate, type, status, issuerName, receiverName, invoiceId, notes, bouncedAt, bouncedReason, clearedAt, accountNumber, bankBranch, currency, customerId, paymentId, supplierId
- العلاقات: Transactions

#### 18. **Expense** (المصروفات)
- الوصف: إدارة المصروفات
- الحقول: id, tenantId, category, description, amountSYP, amountUSD, expenseDate, paymentMethod, reference, notes, approvedBy, approvedAt, isRecurring, recurringFrequency

---

### الموارد البشرية (HR)

#### 19. **Employee** (الموظفين)
- الوصف: إدارة الموظفين
- أنواع العقود (ContractType): FULL_TIME, PART_TIME, CONTRACT, TEMPORARY
- حالات الموظف (EmployeeStatus): ACTIVE, ON_LEAVE, TERMINATED
- الحقول: id, tenantId, branchId, userId, roleId, phone, address, departmentId, position, hireDate, salarySYP, salaryUSD, hourlyRate, contractType, emergencyContact, employeeCode, fullNameAr, fullNameEn, idNumber, status, lastLoginAt, lastLoginIp
- العلاقات: Department, Branch, Branches, User, PayrollRecords, Schedules, Role

#### 20. **Department** (الأقسام)
- الوصف: إدارة الأقسام
- الحقول: id, tenantId, nameAr, nameEn, managerId, isActive, description
- العلاقات: Employees

#### 21. **Attendance** (الحضور والانصراف)
- الوصف: إدارة الحضور والانصراف
- الحقول: id, employeeId, date, checkIn, checkOut, hoursWorked, notes, shiftId, tenantId
- العلاقات: Employee

#### 22. **Shift** (الورديات)
- الوصف: إدارة الورديات
- الحقول: id, tenantId, startTime, endTime, isActive, nameAr, nameEn

#### 23. **PayrollRecord** (سجلات الرواتب)
- الوصف: إدارة الرواتب
- حالات الرواتب (PayrollStatus): DRAFT, APPROVED, PAID, CANCELLED
- الحقول: id, employeeId, periodStart, periodEnd, basicSalarySYP, basicSalaryUSD, overtimeSYP, overtimeUSD, bonusesSYP, bonusesUSD, deductionsSYP, deductionsUSD, netSalarySYP, netSalaryUSD, status, paidAt, notes, tenantId
- العلاقات: Employee

#### 24. **Role** (الأدوار)
- الوصف: إدارة الأدوار والصلاحيات
- الحقول: id, tenantId, name, description
- العلاقات: Employees, Permissions

#### 25. **Permission** (الصلاحيات)
- الوصف: إدارة الصلاحيات
- الحقول: id, key, description
- العلاقات: Roles

#### 26. **RolePermission** (صلاحيات الأدوار)
- الوصف: ربط الأدوار بالصلاحيات
- الحقول: id, roleId, permissionId
- العلاقات: Role, Permission

---

### المخزون (Inventory)

#### 27. **Warehouse** (المستودعات)
- الوصف: إدارة المستودعات
- حالات المستودعات (WarehouseStatus): ACTIVE, INACTIVE, MAINTENANCE
- الحقول: id, tenantId, branchId, name, isPrimary, address, capacity, code, managerId, phone, status
- العلاقات: Manager, Branch, GRNs, InventoryTransactions, InventoryCounts, FromTransfers, ToTransfers

#### 28. **PartCategory** (فئات قطع الغيار)
- الوصف: تصنيف قطع الغيار
- الحقول: id, tenantId, name, nameAr, nameEn, parentId, color, description, icon
- العلاقات: Parts, Parent, Children

#### 29. **Supplier** (الموردين)
- الوصف: إدارة الموردين
- حالات الموردين (SupplierStatus): ACTIVE, INACTIVE, BLOCKED
- الحقول: id, tenantId, name, phone, address, balance, contactPerson, contactPhone, creditLimit, notes, paymentTerms, status, taxId, isActive
- العلاقات: GRNs, Parts, PurchaseOrders, InventoryTransactions

#### 30. **InventoryTransaction** (حركات المخزون)
- الوصف: إدارة حركات المخزون
- أنواع الحركات (TransactionType): PURCHASE, SALE, ADJUSTMENT, TRANSFER, RETURN, CONSUMPTION, STOCK_IN, STOCK_OUT
- الحقول: id, tenantId, branchId, partId, warehouseId, supplierId, type, quantity, costSYP, costUSD, reference, notes, invoiceId, createdBy, createdAt
- العلاقات: Part, Warehouse, Branch, Supplier

#### 31. **PurchaseOrder** (أوامر الشراء)
- الوصف: إدارة أوامر الشراء
- حالات الأوامر (OrderStatus): PENDING, APPROVED, RECEIVED, CANCELLED
- الحقول: id, tenantId, branchId, supplierId, orderNumber, orderDate, totalSYP, totalUSD, status, approvedBy, approvedAt, notes
- العلاقات: Branch, Supplier, GRNs, Items

#### 32. **PurchaseOrderItem** (بنود أوامر الشراء)
- الوصف: بنود أوامر الشراء
- الحقول: id, purchaseOrderId, partId, quantity, costSYP, costUSD, totalSYP, totalUSD, receivedQty
- العلاقات: Part, PurchaseOrder

#### 33. **GoodsReceiptNote** (إيصالات استلام البضائع)
- الوصف: إدارة إيصالات استلام البضائع
- حالات GRN (GRNStatus): DRAFT, PENDING, COMPLETED, CANCELLED
- الحقول: id, tenantId, purchaseOrderId, grnNumber, receivedDate, receivedBy, notes, status, supplierId, warehouseId
- العلاقات: PurchaseOrder, Supplier, Warehouse, Lines

#### 34. **GoodsReceiptNoteLine** (بنود إيصالات الاستلام)
- الوصف: بنود إيصالات الاستلام
- الحقول: id, grnId, partId, orderedQuantity, receivedQuantity, damagedQuantity, unitCost, totalCost
- العلاقات: GRN, Part

#### 35. **InventoryTransfer** (نقل المخزون)
- الوصف: إدارة نقل المخزون بين المستودعات
- حالات النقل (TransferStatus): REQUESTED, APPROVED, SHIPPED, RECEIVED, CANCELLED
- الحقول: id, tenantId, branchId, fromWarehouseId, toWarehouseId, status, notes
- العلاقات: Branch, FromWarehouse, ToWarehouse, Items

#### 36. **InventoryTransferItem** (بنود نقل المخزون)
- الوصف: بنود نقل المخزون
- الحقول: id, transferId, partId, quantity
- العلاقات: Transfer, Part

#### 37. **InventoryCount** (جرد المخزون)
- الوصف: إدارة جرد المخزون
- أنواع الجرد (CountType): REGULAR, SURPRISE, PARTIAL, FULL
- حالات الجرد (CountStatus): SCHEDULED, IN_PROGRESS, COMPLETED, APPROVED, CANCELLED
- الحقول: id, tenantId, countNumber, countType, warehouseId, scheduledDate, actualDate, status, countedBy, approvedBy, approvedAt, notes
- العلاقات: Warehouse, Counter, Approver, Items, Adjustments

#### 38. **InventoryCountItem** (بنود جرد المخزون)
- الوصف: بنود جرد المخزون
- الحقول: id, countId, partId, expectedQty, actualQty, varianceQty, unitCostSYP, unitCostUSD, varianceSYP, varianceUSD, notes
- العلاقات: Count, Part

#### 39. **InventoryCountAdjustment** (تعديلات جرد المخزون)
- الوصف: تعديلات جرد المخزون
- أنواع التعديل (AdjustmentType): INCREASE, DECREASE
- الحقول: id, tenantId, countId, partId, adjustmentType, quantity, costSYP, costUSD, reason, approvedBy, approvedAt
- العلاقات: Count, Part

---

### الصيانة (Maintenance)

#### 40. **PreventiveMaintenanceTemplate** (قوالب الصيانة الوقائية)
- الوصف: قوالب الصيانة الوقائية
- الحقول: id, tenantId, name, nameAr, nameEn, description, intervalKm, intervalMonths, priorityKm, priorityMonths, maxDelayKm, maxDelayMonths, isActive
- العلاقات: Packages, Logs

#### 41. **PreventiveMaintenanceLog** (سجلات الصيانة الوقائية)
- الوصف: سجلات الصيانة الوقائية
- حالات الصيانة (MaintenanceStatus): SCHEDULED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED
- الحقول: id, tenantId, templateId, vehicleId, scheduledKm, scheduledDate, actualKm, actualDate, status, isDelayed, delayReason, notes
- العلاقات: Template, Vehicle, Attachments

#### 42. **MaintenancePackage** (باقات الصيانة)
- الوصف: باقات الصيانة
- الحقول: id, tenantId, templateId, name, nameAr, nameEn, description, totalSYP, totalUSD, isActive
- العلاقات: Template, Items

#### 43. **MaintenancePackageItem** (بنود باقات الصيانة)
- الوصف: بنود باقات الصيانة
- الحقول: id, packageId, partId, serviceId, quantity, priceSYP, priceUSD
- العلاقات: Package, Part, Service

---

### الولاء والعضويات (Loyalty & Memberships)

#### 44. **LoyaltyPoint** (نقاط الولاء)
- الوصف: إدارة نقاط الولاء
- الحقول: id, tenantId, customerId, points, invoiceId, reason, createdAt

#### 45. **LoyaltyReward** (مكافآت الولاء)
- الوصف: إدارة مكافآت الولاء
- أنواع المكافآت (RewardType): PERCENTAGE, FIXED_AMOUNT, FREE_SERVICE
- الحقول: id, tenantId, name, nameAr, nameEn, description, pointsRequired, discountType, discountValue, isActive

#### 46. **LoyaltyPointTransaction** (معاملات نقاط الولاء)
- الوصف: معاملات نقاط الولاء
- أنواع المعاملات (PointTransactionType): EARNED, REDEEMED
- مصادر المعاملات (PointTransactionSource): INVOICE, MEMBERSHIP, MANUAL
- الحقول: id, tenantId, customerId, points, type, source, reference, createdAt
- العلاقات: Tenant, Customer

#### 47. **MembershipPlan** (خطط العضوية)
- الوصف: إدارة خطط العضوية
- الحقول: id, tenantId, name, nameAr, nameEn, description, descriptionAr, descriptionEn, price, durationDays, includedServices, includedVisits, discountPercentage, isActive
- العلاقات: Tenant, CustomerMemberships

#### 48. **CustomerMembership** (عضويات العملاء)
- الوصف: إدارة عضويات العملاء
- حالات العضوية (MembershipStatus): ACTIVE, EXPIRED, CANCELLED
- الحقول: id, tenantId, branchId, customerId, membershipPlanId, startDate, endDate, remainingVisits, status
- العلاقات: Tenant, Branch, Customer, MembershipPlan

#### 49. **CustomerWallet** (محفظة العميل)
- الوصف: إدارة محفظة العميل
- الحقول: id, tenantId, customerId, balance, updatedAt
- العلاقات: Tenant, Customer

---

### التقارير والتصدير (Reports & Exports)

#### 50. **Report** (التقارير)
- الوصف: إدارة التقارير
- الحقول: id, tenantId, name, nameAr, description, reportType, format, status, parameters, generatedBy, fileUrl, fileSize, errorMessage, createdAt, completedAt

#### 51. **DataExport** (تصدير البيانات)
- الوصف: إدارة تصدير البيانات
- الحقول: id, tenantId, name, entityType, format, status, filters, fileUrl, fileSize, recordCount, errorMessage, requestedBy, createdAt, completedAt

---

### الإشعارات والاتصال (Notifications & Communication)

#### 52. **Notification** (الإشعارات)
- الوصف: إدارة الإشعارات
- أنواع الإشعارات (NotificationType): BOOKING_CREATED, BOOKING_UPDATED, BOOKING_COMPLETED, PAYMENT_RECEIVED, INVOICE_SENT, INVENTORY_LOW, PAYROLL_READY, SYSTEM
- الحقول: id, tenantId, userId, title, titleAr, titleEn, body, bodyAr, bodyEn, type, isRead, readAt, createdAt

#### 53. **NotificationRule** (قواعد الإشعارات)
- الوصف: إدارة قواعد الإشعارات
- الحقول: id, tenantId, name, nameAr, eventType, channels, isActive, conditions, createdAt, updatedAt

#### 54. **WhatsAppMessage** (رسائل واتساب)
- الوصف: إدارة رسائل واتساب
- حالات الرسائل (MessageStatus): PENDING, SENT, DELIVERED, FAILED
- الحقول: id, tenantId, phoneNumber, message, status, sentAt, deliveredAt, error, createdAt, updatedAt

#### 55. **PushNotificationToken** (رموز الإشعارات)
- الوصف: إدارة رموز الإشعارات
- الحقول: id, tenantId, userId, token, platform, isActive, lastUsedAt, createdAt, updatedAt
- العلاقات: User

#### 56. **FCMToken** (رموز FCM)
- الوصف: إدارة رموز Firebase Cloud Messaging
- الحقول: id, tenantId, userId, token, deviceType, isActive, createdAt, updatedAt

---

### الفروع والمواقع (Branches & Locations)

#### 57. **Branch** (الفروع)
- الوصف: إدارة الفروع
- الحقول: id, tenantId, name, nameAr, nameEn, address, phone, isActive
- العلاقات: Warehouses, Employees, EmployeeBranches, Bookings, Invoices, InventoryTransactions, PurchaseOrders, Schedules, CustomerMemberships, InventoryTransfers, AuditLogs

---

### الجدولة والمهام (Scheduling & Tasks)

#### 58. **TechnicianSchedule** (جدولة الفنيين)
- الوصف: إدارة جدولة الفنيين
- حالات الجدولة (ScheduleStatus): SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- الحقول: id, tenantId, branchId, technicianId, bookingId, serviceId, startTime, endTime, status, notes
- العلاقات: Technician, Booking, Service, Tenant, Branch

#### 59. **Task** (المهام)
- الوصف: إدارة المهام
- أولويات المهام (TaskPriority): LOW, MEDIUM, HIGH, URGENT
- حالات المهام (TaskStatus): PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- الحقول: id, tenantId, title, description, priority, status, dueDate, entityType, entityId, createdAt, bookingId
- العلاقات: Booking, Assignments

#### 60. **TaskAssignment** (تعيين المهام)
- الوصف: تعيين المهام للمستخدمين
- الحقول: id, taskId, userId, assignedAt, completedAt
- العلاقات: Task, User

#### 61. **TimeSlot** (الفترات الزمنية)
- الوصف: إدارة الفترات الزمنية للحجز
- الحقول: id, tenantId, dayOfWeek, startTime, endTime, isActive, createdAt, updatedAt

#### 62. **AppointmentLog** (سجل المواعيد)
- الوصف: إدارة سجل المواعيد
- حالات المواعيد (AppointmentStatus): SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
- الحقول: id, tenantId, bookingId, scheduledAt, actualStart, actualEnd, status, rescheduledFrom, rescheduledTo, reminderSent, createdAt, updatedAt
- العلاقات: Booking

---

### الضمانات والتقييمات (Warranty & Reviews)

#### 63. **Warranty** (الضمانات)
- الوصف: إدارة الضمانات
- أنواع الضمانات (WarrantyType): SERVICE, PART, BOTH
- الحقول: id, tenantId, entityType, entityId, warrantyType, durationMonths, durationKm, startDate, endDate, isActive
- العلاقات: Claims

#### 64. **WarrantyClaim** (مطالبات الضمان)
- الوصف: إدارة مطالبات الضمان
- حالات المطالبات (WarrantyClaimStatus): PENDING, APPROVED, REJECTED, COMPLETED
- الحقول: id, tenantId, warrantyId, bookingId, description, status, approvedBy, approvedAt, rejectedReason, createdAt, updatedAt
- العلاقات: Warranty

#### 65. **Review** (التقييمات)
- الوصف: إدارة تقييمات الحجوزات
- الحقول: id, tenantId, bookingId, customerId, rating, comment, createdAt
- العلاقات: Booking

#### 66. **MechanicRating** (تقييمات الفنيين)
- الوصف: إدارة تقييمات الفنيين
- الحقول: id, tenantId, mechanicUserId, bookingId, rating, comment, createdAt

---

### الإضافات والمرفقات (Extras & Attachments)

#### 67. **ExtraChargeType** (أنواع الرسوم الإضافية)
- الوصف: إدارة أنواع الرسوم الإضافية
- الحقول: id, tenantId, name, nameAr, nameEn, description, priceSYP, priceUSD, requiresApproval, isActive
- العلاقات: BookingExtraCharges

#### 68. **BookingExtraCharge** (الرسوم الإضافية للحجوزات)
- الوصف: إدارة الرسوم الإضافية للحجوزات
- الحقول: id, tenantId, bookingId, extraChargeTypeId, priceSYP, priceUSD, approvedBy, approvedAt, createdAt
- العلاقات: Booking, ExtraChargeType

#### 69. **Attachment** (المرفقات)
- الوصف: إدارة المرفقات
- أنواع المرفقات (AttachmentType): IMAGE, DOCUMENT
- الحقول: id, tenantId, entityType, entityId, fileName, fileUrl, fileSize, mimeType, uploadedBy, createdAt, vehicleId, bookingId, partId, invoiceId, preventiveMaintenanceLogId
- العلاقات: Booking, Invoice, Part, PreventiveMaintenanceLog, Vehicle

#### 70. **Note** (الملاحظات)
- الوصف: إدارة الملاحظات
- الحقول: id, tenantId, entityType, entityId, content, createdBy, isPrivate, createdAt, updatedAt

---

### التقنيات والمركبات (Vehicle Tech)

#### 71. **VehicleHistory** (تاريخ المركبة)
- الوصف: إدارة تاريخ المركبة
- أنواع التاريخ (VehicleHistoryType): SERVICE, PART_CONSUMPTION, FAULT, NOTE
- الحقول: id, tenantId, vehicleId, invoiceId, serviceId, technicianId, description, type, createdAt
- العلاقات: Vehicle

#### 72. **VehicleFault** (أعطال المركبة)
- الوصف: إدارة أعطال المركبة
- خطورة الأعطال (FaultSeverity): LOW, MEDIUM, HIGH
- حالات الأعطال (FaultStatus): OPEN, RESOLVED
- الحقول: id, tenantId, vehicleId, title, description, severity, status, createdAt, resolvedAt
- العلاقات: Vehicle

#### 73. **VehicleAttachment** (مرفقات المركبة)
- الوصف: إدارة مرفقات المركبة
- الحقول: id, tenantId, vehicleId, fileUrl, type, description, createdAt
- العلاقات: Vehicle

#### 74. **VehicleRecommendation** (توصيات المركبة)
- الوصف: إدارة توصيات المركبة
- حالات التوصيات (RecommendationStatus): PENDING, DONE
- الحقول: id, tenantId, vehicleId, title, description, dueMileage, dueDate, status, createdAt
- العلاقات: Vehicle

#### 75. **VehicleMileageLog** (سجل عداد الكيلومترات)
- الوصف: إدارة سجل عداد الكيلومترات
- أنواع السجل (MileageType): ENTRY, EXIT, MAINTENANCE
- الحقول: id, tenantId, vehicleId, km, loggedAt, loggedBy, type
- العلاقات: Vehicle

#### 76. **VehicleIssue** (مشاكل المركبة)
- الوصف: إدارة مشاكل المركبة
- حالات المشاكل (IssueStatus): OPEN, IN_PROGRESS, RESOLVED, CLOSED
- الحقول: id, tenantId, vehicleId, description, reportedBy, reportedAt, status, resolvedAt, resolvedBy
- العلاقات: Vehicle

#### 77. **VehicleInspectionChecklist** (قائمة فحص المركبة)
- الوصف: إدارة قائمة فحص المركبة
- الحقول: id, tenantId, vehicleId, bookingId, inspectionDate, inspectedBy, brakes, oil, tires, battery, lights, fluids, notes, createdAt
- العلاقات: Vehicle

---

### الأقساط والتمويل (Installments)

#### 78. **InstallmentPlan** (خطط الأقساط)
- الوصف: إدارة خطط الأقساط
- حالات الخطط (InstallmentStatus): ACTIVE, COMPLETED, CANCELLED, DEFAULTED
- تكرار الدفع (PaymentFrequency): WEEKLY, BI_WEEKLY, MONTHLY, QUARTERLY
- الحقول: id, tenantId, customerId, invoiceId, totalAmountSYP, totalAmountUSD, downPaymentSYP, downPaymentUSD, numberOfPayments, interestRate, paymentFrequency, startDate, status, createdBy, currency, downPaymentPaidSYP, downPaymentPaidUSD, endDate, interestAmountSYP, interestAmountUSD, notes, planNumber, remainingAmountSYP, remainingAmountUSD, supplierId
- العلاقات: Invoice, Installments

#### 79. **Installment** (الأقساط)
- الوصف: إدارة الأقساط
- حالات الأقساط (InstallmentPaymentStatus): PENDING, PAID, OVERDUE, CANCELLED
- الحقول: id, installmentPlanId, sequenceNumber, dueDate, amountSYP, amountUSD, paidSYP, paidUSD, status, paidAt, reminderSentAt
- العلاقات: InstallmentPlan

---

### الترويج والكوبونات (Promotions & Coupons)

#### 80. **Promotion** (العروض الترويجية)
- الوصف: إدارة العروض الترويجية
- أنواع العروض (PromotionType): PERCENTAGE, FIXED_AMOUNT, FREE_SERVICE, FREE_PART
- الحقول: id, tenantId, name, nameAr, nameEn, description, couponCode, discountType, discountValue, startDate, endDate, isActive
- العلاقات: Usages, Conditions

#### 81. **PromotionCondition** (شروط العروض)
- الوصف: إدارة شروط العروض
- أنواع الشروط (ConditionType): MINIMUM_AMOUNT, CUSTOMER_TYPE, FIRST_PURCHASE, SPECIAL_OCCASION, VEHICLE_TYPE, SERVICE_TYPE
- الحقول: id, promotionId, conditionType, value, createdAt
- العلاقات: Promotion

#### 82. **CouponUsage** (استخدام الكوبونات)
- الوصف: إدارة استخدام الكوبونات
- الحقول: id, promotionId, customerId, invoiceId, discountSYP, discountUSD, usedAt
- العلاقات: Invoice, Promotion

---

### التدقيق والمراجعة (Audit)

#### 83. **AuditLog** (سجل التدقيق)
- الوصف: إدارة سجل التدقيق
- الحقول: id, userId, branchId, action, entity, entityId, before, after, ipAddress, userAgent, isUndo, undoOfId, createdAt
- العلاقات: User, Branch, UndoOf, UndoActions

---

### الصندوق النقدي (Cash Register)

#### 84. **CashRegister** (الصندوق النقدي)
- الوصف: إدارة الصناديق النقدية
- الحقول: id, tenantId, name, cashierUserId, balanceSYP, balanceUSD, isActive, createdAt, updatedAt
- العلاقات: Cashier, Sessions

#### 85. **CashRegisterSession** (جلسات الصندوق النقدي)
- الوصف: إدارة جلسات الصندوق النقدي
- حالات الجلسات (SessionStatus): OPEN, CLOSED
- الحقول: id, tenantId, cashRegisterId, cashierUserId, openingBalanceSYP, openingBalanceUSD, closingBalanceSYP, closingBalanceUSD, openedAt, closedAt, status, notes
- العلاقات: CashRegister, Cashier, Payments

---

### التوقيع الإلكتروني (Electronic Signature)

#### 86. **ElectronicSignature** (التوقيع الإلكتروني)
- الوصف: إدارة التوقيع الإلكتروني
- الحقول: id, tenantId, bookingId, customerId, signatureData, signedAt, ipAddress, userAgent
- العلاقات: Booking

---

### الإعدادات (Settings)

#### 87. **CompanySettings** (إعدادات الشركة)
- الوصف: إدارة إعدادات الشركة
- الحقول: id, tenantId, companyName, companyNameAr, companyNameEn, logoUrl, companyLogoUrl, address, companyAddress, phone, companyPhone, taxNumber, defaultCurrencyId, autoUpdatePurchasePrice, overheadPercentage, enableWhatsAppNotifications, whatsappPhoneNumberId, whatsappAccessToken, whatsappBusinessAccountId, whatsappBusinessNumber, membershipScope, membershipAutoRenew, timezone, currency, taxRate, dateFormat, timeFormat, primaryColor, secondaryColor, sidebarStyle, loginBackgroundUrl, autoAssignTechnician, defaultBookingDuration, allowOnlineBooking, autoGenerateInvoiceNumber, invoicePrefix, invoiceFooterNote
- العلاقات: Tenant

---

### الفئات (Categories)

#### 88. **VehicleCategory** (فئات المركبات)
- الوصف: إدارة فئات المركبات
- الحقول: id, tenantId, name, nameAr, nameEn, description, isActive
- العلاقات: Vehicles, Tenant

#### 89. **ServiceCategory** (فئات الخدمات)
- الوصف: إدارة فئات الخدمات
- الحقول: id, tenantId, name, nameAr, nameEn, description, isActive
- العلاقات: Services, Tenant

---

### التعيينات والمقترحات (Assignments & Suggestions)

#### 90. **MechanicAssignment** (تعيين الفنيين)
- الوصف: إدارة تعيين الفنيين للحجوزات
- حالات التعيين (AssignmentStatus): ASSIGNED, IN_PROGRESS, WAITING_PARTS, READY, DELIVERED
- الحقول: id, bookingId, mechanicUserId, status, notes, assignedAt, updatedAt
- العلاقات: Booking, Mechanic

#### 91. **PartSuggestion** (اقتراحات قطع الغيار)
- الوصف: إدارة اقتراحات قطع الغيار من الفنيين
- أنواع القطع (PartType): ORIGINAL, COMMERCIAL, USED
- حالات الاقتراحات (SuggestionStatus): PENDING_CUSTOMER_APPROVAL, APPROVED, REJECTED
- الحقول: id, bookingId, mechanicUserId, type, description, priceSYP, priceUSD, status, createdAt, updatedAt
- العلاقات: Booking, Mechanic

---

---

## 🔌 API Endpoints

### المصادقة (Authentication)
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/refresh` - تجديد رمز الوصول
- `GET /api/auth/me` - الحصول على المستخدم الحالي
- `POST /api/auth/logout` - تسجيل الخروج

### العملاء (Customers)
- `GET /api/customers` - قائمة العملاء
- `POST /api/customers` - إنشاء عميل جديد
- `GET /api/customers/:id` - الحصول على عميل
- `PUT /api/customers/:id` - تحديث عميل
- `DELETE /api/customers/:id` - حذف عميل

### المركبات (Vehicles)
- `GET /api/vehicles` - قائمة المركبات
- `POST /api/vehicles` - إنشاء مركبة جديدة
- `GET /api/vehicles/:id` - الحصول على مركبة
- `PUT /api/vehicles/:id` - تحديث مركبة
- `DELETE /api/vehicles/:id` - حذف مركبة
- `GET /api/vehicle-categories` - فئات المركبات

### الحجوزات (Bookings)
- `GET /api/bookings` - قائمة الحجوزات
- `POST /api/bookings` - إنشاء حجز جديد
- `GET /api/bookings/:id` - الحصول على حجز
- `PUT /api/bookings/:id` - تحديث حجز
- `DELETE /api/bookings/:id` - حذف حجز
- `PUT /api/bookings/:id/status` - تحديث حالة الحجز

### الخدمات (Services)
- `GET /api/services` - قائمة الخدمات
- `POST /api/services` - إنشاء خدمة جديدة
- `GET /api/services/:id` - الحصول على خدمة
- `PUT /api/services/:id` - تحديث خدمة
- `DELETE /api/services/:id` - حذف خدمة
- `GET /api/service-categories` - فئات الخدمات

### قطع الغيار (Parts)
- `GET /api/parts` - قائمة قطع الغيار
- `POST /api/parts` - إنشاء قطعة غيار جديدة
- `GET /api/parts/:id` - الحصول على قطعة غيار
- `PUT /api/parts/:id` - تحديث قطعة غيار
- `DELETE /api/parts/:id` - حذف قطعة غيار
- `GET /api/part-categories` - فئات قطع الغيار

### الفواتير (Invoices)
- `GET /api/invoices` - قائمة الفواتير
- `POST /api/invoices` - إنشاء فاتورة جديدة
- `GET /api/invoices/:id` - الحصول على فاتورة
- `PUT /api/invoices/:id` - تحديث فاتورة
- `DELETE /api/invoices/:id` - حذف فاتورة
- `POST /api/invoices/:id/payments` - إضافة دفع

### المدفوعات (Payments)
- `GET /api/payments` - قائمة المدفوعات
- `POST /api/payments` - إنشاء دفع جديد
- `GET /api/payments/:id` - الحصول على دفع
- `PUT /api/payments/:id` - تحديث دفع
- `DELETE /api/payments/:id` - حذف دفع

### المحاسبة (Accounting)
- `GET /api/accounts` - دليل الحسابات
- `POST /api/accounts` - إنشاء حساب جديد
- `GET /api/journal-entries` - القيود اليومية
- `POST /api/journal-entries` - إنشاء قيد يومي
- `GET /api/journal-entries/:id` - الحصول على قيد يومي
- `PUT /api/journal-entries/:id` - تحديث قيد يومي
- `DELETE /api/journal-entries/:id` - حذف قيد يومي
- `GET /api/fiscal-periods` - الفترات المالية

### الموارد البشرية (HR)
- `GET /api/employees` - قائمة الموظفين
- `POST /api/employees` - إنشاء موظف جديد
- `GET /api/employees/:id` - الحصول على موظف
- `PUT /api/employees/:id` - تحديث موظف
- `DELETE /api/employees/:id` - حذف موظف
- `GET /api/departments` - الأقسام
- `GET /api/attendance` - الحضور والانصراف
- `GET /api/payroll` - الرواتب
- `GET /api/shifts` - الورديات

### المخزون (Inventory)
- `GET /api/warehouses` - المستودعات
- `POST /api/warehouses` - إنشاء مستودع جديد
- `GET /api/suppliers` - الموردين
- `POST /api/suppliers` - إنشاء مورد جديد
- `GET /api/purchase-orders` - أوامر الشراء
- `POST /api/purchase-orders` - إنشاء أمر شراء
- `GET /api/grn` - إيصالات استلام البضائع
- `GET /api/inventory-transactions` - حركات المخزون
- `GET /api/inventory-count` - جرد المخزون

### التقارير (Reports)
- `GET /api/reports` - التقارير
- `GET /api/reports/advanced` - التقارير المتقدمة
- `GET /api/analytics` - التحليلات
- `GET /api/dashboard` - لوحة التحكم

### الإشعارات (Notifications)
- `GET /api/notifications` - الإشعارات
- `POST /api/notifications/rules` - قواعد الإشعارات

### الصلاحيات (RBAC)
- `GET /api/roles` - الأدوار
- `POST /api/roles` - إنشاء دور جديد
- `GET /api/permissions` - الصلاحيات
- `POST /api/role-permissions` - تعيين صلاحيات للدور

### الإعدادات (Settings)
- `GET /api/branches` - الفروع
- `GET /api/currencies` - العملات
- `GET /api/cheques` - الشيكات
- `GET /api/installments` - الأقساط
- `GET /api/loyalty` - الولاء
- `GET /api/memberships` - العضويات
- `GET /api/expenses` - المصروفات
- `GET /api/maintenance` - الصيانة
- `GET /api/schedule` - الجدولة

### Public API
- `GET /api/public/booking/:token` - تتبع الحجز العام
- `GET /api/public/vehicle/:publicId` - تتبع المركبة العامة

---

## 🔐 نظام المصادقة

### JWT Tokens
- **Access Token:** صالح لمدة 15 دقيقة
- **Refresh Token:** صالح لمدة أطول (للتحديث)
- **Payload:** يحتوي على id, tenantId, role, username

### الأدوار (Roles)
- **OWNER:** المالك - صلاحيات كاملة
- **MANAGER:** المدير - صلاحيات إدارية
- **RECEPTIONIST:** الاستقبال - إدارة الحجوزات والعملاء
- **ACCOUNTANT:** المحاسب - إدارة المحاسبة والفواتير
- **MECHANIC:** الفني - إدارة الحجوزات المسندة
- **SALES:** المبيعات - إدارة المبيعات
- **CASHIER:** الكاشير - إدارة المدفوعات
- **HR_MANAGER:** مدير الموارد البشرية - إدارة الموظفين

### Middleware
- **authenticate:** التحقق من رمز الوصول
- **auditContextMiddleware:** تسجيل سياق التدقيق

---

## 📊 البنية المعمارية

### Clean Architecture
```
backend/src/
├── api/                 # API Routes (Clean Architecture)
├── application/         # Application Layer
├── config/              # Configuration
├── domain/              # Domain Layer
├── infrastructure/      # Infrastructure Layer
├── interfaces/          # Interfaces (HTTP)
├── middleware/          # Express Middleware
├── modules/             # Feature Modules (60+)
├── queues/              # Background Jobs (BullMQ)
├── services/            # Shared Services
├── shared/              # Shared Utilities
├── workers/             # Background Workers
└── server.ts            # Entry Point
```

### Modules Structure
كل module يحتوي على:
- `controller.ts` - معالجة الطلبات
- `service.ts` - منطق الأعمال
- `routes.ts` - تعريف المسارات
- `types.ts` - تعريف الأنواع

---

## 🚀 التشغيل

### أوامر التشغيل
```bash
cd backend
npm install
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Production mode
npm run prisma:studio  # Prisma Studio
npm run prisma:migrate  # Run migrations
npm run prisma:seed  # Seed database
```

### المنفذ (Port)
- **Default:** 8080
- **Environment Variable:** PORT

---

## 📝 الملاحظات الهامة

### 1. Multi-Tenancy
- جميع الكيانات مرتبطة بـ tenantId
- كل tenant معزول تماماً

### 2. العملات
- دعم عملات متعددة (SYP, USD)
- أسعار صرف قابلة للتحديث
- جميع المبالغ في عملتين

### 3. التدقيق
- AuditLog يسجل جميع العمليات
- يدعم Undo/Redo
- تسجيل IP و User Agent

### 4. Real-time
- Socket.IO للتحديثات الفورية
- غرف: tenant:{id}, user:{id}, booking:{token}

### 5. الصلاحيات
- نظام RBAC كامل
- Roles و Permissions
- يمكن تخصيص الصلاحيات لكل دور

### 6. الإشعارات
- دعم قنوات متعددة (Email, WhatsApp, Push)
- قواعد إشعارات قابلة للتخصيص
- FCM للإشعارات على الجوال

---

## 🎯 التوصيات لبناء واجهة الأدمن

### 1. البنية الأساسية
- استخدام Flutter Desktop
- Riverpod لإدارة الحالة
- GoRouter للتنقل
- تصميم متجاوب (Responsive)

### 2. الشاشات الأساسية
- **Dashboard:** لوحة تحكم شاملة
- **Bookings:** إدارة الحجوزات
- **Customers:** إدارة العملاء
- **Vehicles:** إدارة المركبات
- **Invoices:** إدارة الفواتير
- **Payments:** إدارة المدفوعات
- **Inventory:** إدارة المخزون
- **HR:** إدارة الموارد البشرية
- **Accounting:** إدارة المحاسبة
- **Reports:** التقارير والتحليلات

### 3. نظام المصادقة
- JWT token storage
- Auto-refresh tokens
- Role-based access control
- PermissionGuard widget

### 4. التصميم
- 4 themes (app, fantasy, luxury, modern)
- Glassmorphism UI
- Animated transitions
- Empty states
- Loading states
- Error handling

### 5. الأداء
- RepaintBoundary optimization
- Lazy loading
- Caching
- Selective rebuilds

### 6. الميزات المتقدمة
- Real-time updates (Socket.IO client)
- Offline support
- Export to Excel/PDF
- Print invoices
- Barcode/QR scanner

---

## 📌 الخلاصة

الباك End قوي وشامل مع:
- 70+ model في قاعدة البيانات
- 60+ module في الباك اند
- 200+ API endpoint
- نظام مصادقة JWT كامل
- دعم multi-tenancy
- نظام محاسبة كامل
- نظام موارد بشرية كامل
- نظام مخزون كامل
- نظام إشعارات متقدم
- دعم real-time
- نظام صلاحيات RBAC

هذا الباك End جاهز لبناء واجهة أدمن قوية وشاملة.
