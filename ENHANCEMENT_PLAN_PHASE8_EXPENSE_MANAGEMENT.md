# خطة تنفيذ المرحلة الثامنة: Expense Management
## إدارة المصروفات

---

## 1. تحليل المتطلبات

### 1.1 المتطلبات الوظيفية
- **Expense Categorization**: تصنيف المصروفات
- **Approval Workflows**: سير عمل الموافقات
- **Receipt Scanning**: مسح الإيصالات
- **Mileage Tracking**: تتبع المسافات
- **Per Diem Calculations**: حساب البدلات اليومية
- **Expense Reports**: تقارير المصروفات
- **Budget Tracking**: تتبع الميزانية
- **Reimbursement**: استرداد المصروفات

### 1.2 المتطلبات غير الوظيفية (NFR)
- **Accuracy**: 100% دقة الحسابات
- **Performance**: Processing < 5 seconds
- **Scalability**: دعم آلاف المصروفات
- **Audit Trail**: Complete logging
- **Security**: Role-based access
- **Multi-tenant**: Tenant isolation

---

## 2. اختيار التقنيات

### 2.1 Backend Architecture
```
Expense Management Microservice Architecture
├── Expense Service
│   ├── Expense Creation
│   ├── Expense Categorization
│   ├── Expense Validation
│   └── Expense Reporting
├── Approval Workflow Service
│   ├── Workflow Definition
│   ├── Approval Routing
│   ├── Notification
│   └── Escalation
├── Receipt Service
│   ├── OCR Processing
│   ├── Image Storage
│   ├── Data Extraction
│   └── Validation
├── Mileage Service
│   ├── Mileage Tracking
│   ├── Rate Calculation
│   ├── Route Optimization
│   └── Reimbursement
└── Reimbursement Service
    ├── Reimbursement Calculation
    ├── Payment Processing
    ├── Tax Calculation
    └── Reporting
```

### 2.2 Technology Stack

#### OCR & Receipt Processing
- **OCR**: Tesseract.js / Google Vision API
- **Image Processing**: Sharp / ImageMagick
- **Storage**: AWS S3 / Azure Blob
- **Extraction**: Custom ML model

#### Mileage Tracking
- **GPS**: Geolocation API
- **Maps**: Google Maps API
- **Calculation**: Custom engine
- **Validation**: Address validation

#### Approval Workflow
- **Workflow Engine**: Custom / Camunda
- **Notifications**: Email / In-app
- **Escalation**: Time-based
- **Audit**: Complete logging

### 2.3 Database Schema
ملاحظة: استخدام السكيما الحالية من schema.prisma

الجداول الموجودة في السكيما الحالية ذات الصلة بإدارة المصروفات:
- **Employee**: موجود في schema.prisma
  - id, tenantId, userId, phone, address, departmentId, position, hireDate, salarySYP, etc.

- **Department**: موجود في schema.prisma
  - id, tenantId, nameAr, nameEn, managerId, isActive, description, etc.

- **Attachment**: موجود في schema.prisma
  - id, tenantId, entityType, entityId, fileName, fileUrl, fileSize, mimeType, uploadedBy, etc.

- **AuditLog**: موجود في schema.prisma
  - id, userId, action, entityType, entityId, changes, ipAddress, userAgent, isUndo, undoOfId, createdAt

الجداول الإضافية المقترحة:
```sql
-- Expense Categories Table (جديد)
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    parent_id UUID,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    budget_limit DECIMAL(18, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (parent_id) REFERENCES expense_categories(id),
    UNIQUE(tenant_id, code),
    INDEX idx_tenant_id (tenant_id)
);

-- Expenses Table (جديد)
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    category_id UUID NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    expense_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    reimbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_expense_date (expense_date)
);

-- Expense Receipts Table (جديد)
CREATE TABLE expense_receipts (
    id UUID PRIMARY KEY,
    expense_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    ocr_data JSONB,
    extracted_data JSONB,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    INDEX idx_expense_id (expense_id)
);

-- Approval Workflows Table (جديد)
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_entity_type (entity_type)
);

-- Approval History Table (جديد)
CREATE TABLE approval_history (
    id UUID PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    workflow_id UUID,
    approver_id UUID,
    action VARCHAR(20) NOT NULL,
    comments TEXT,
    actioned_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_entity_id (entity_id),
    INDEX idx_approver_id (approver_id)
);

-- Mileage Logs Table (جديد)
CREATE TABLE mileage_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    expense_id UUID,
    date DATE NOT NULL,
    start_location TEXT,
    end_location TEXT,
    distance DECIMAL(10, 2),
    rate DECIMAL(10, 4),
    amount DECIMAL(18, 2),
    purpose TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_date (date)
);

-- Per Diem Rates Table (جديد)
CREATE TABLE per_diem_rates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    location VARCHAR(255) NOT NULL,
    daily_rate DECIMAL(18, 2) NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_location (location),
    INDEX idx_effective_date (effective_date)
);

-- Reimbursements Table (جديد)
CREATE TABLE reimbursements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    total_amount DECIMAL(18, 2) NOT NULL,
    tax_amount DECIMAL(18, 2) DEFAULT 0,
    net_amount DECIMAL(18, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status)
);
```

---

## 3. تصميم البنية المعمارية

### 3.1 System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Web    │  │  Mobile  │  │  Admin   │  │ Employee │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼────────────┼────────────┼────────────┼──────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                     │
        ┌────────────▼────────────┐
        │   API Gateway / Load    │
        │       Balancer          │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Expense Management     │
        │  Service (Node.js)       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Service Layer          │
        │  ┌──────────────────┐  │
        │  │ Expense Service  │  │
        │  │ Approval Workflow│  │
        │  │ Receipt Service  │  │
        │  │ Mileage Service  │  │
        │  │ Reimbursement    │  │
        │  └──────────────────┘  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  External Services      │
        │  ┌──────────────────┐  │
        │  │ OCR API          │  │
        │  │ Maps API         │  │
        │  │ Storage (S3)     │  │
        │  │ Payment Gateway  │  │
        │  └──────────────────┘  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Data Layer             │
        │  ┌──────────────────┐  │
        │  │ PostgreSQL       │  │
        │  │ Redis            │  │
        │  │ S3 Storage       │  │
        │  └──────────────────┘  │
        └─────────────────────────┘
```

### 3.2 Expense Submission Flow
```
1. Employee creates expense
   ↓
2. Upload receipt (optional)
   ↓
3. OCR processing (if receipt)
   ↓
4. Auto-categorization
   ↓
5. Validation
   ↓
6. Submit for approval
   ↓
7. Workflow routing
   ↓
8. Approval/rejection
   ↓
9. Reimbursement processing
```

### 3.3 Approval Workflow Flow
```
1. Expense submitted
   ↓
2. Load workflow definition
   ↓
3. Route to first approver
   ↓
4. Approver reviews
   ↓
5. Approve or reject
   ↓
6. If approve: next step or complete
   ↓
7. If reject: return to submitter
   ↓
8. Notify all parties
```

### 3.4 Mileage Tracking Flow
```
1. Start trip
   ↓
2. Track GPS location
   ↓
3. End trip
   ↓
4. Calculate distance
   ↓
5. Apply mileage rate
   ↓
6. Create expense entry
   ↓
7. Submit for approval
```

---

## 4. خطة التنفيذ التفصيلية

### 4.1 Phase 8.1: Expense System (Week 1-2)
**المهام:**
1. Expense Service
   - Implement expense creation
   - Add expense categorization
   - Implement validation
   - Add expense reporting

2. Expense UI
   - Create expense creation UI
   - Add expense list view
   - Implement expense details
   - Add expense reports

3. Testing
   - Unit tests
   - Integration tests
   - Validation tests
   - Reporting tests

**المخرجات:**
- Expense service ready
- Expense UI ready
- Fully tested

### 4.2 Phase 8.2: Approval Workflow (Week 3)
**المهام:**
1. Workflow Service
   - Implement workflow engine
   - Add workflow definition
   - Implement approval routing
   - Add escalation logic

2. Workflow UI
   - Create workflow builder UI
   - Add approval queue view
   - Implement approval interface
   - Add workflow history

3. Testing
   - Unit tests
   - Integration tests
   - Workflow tests
   - Escalation tests

**المخرجات:**
- Workflow service ready
- Workflow UI ready
- Fully tested

### 4.3 Phase 8.3: Receipt Scanning (Week 4)
**المهام:**
1. Receipt Service
   - Implement OCR processing
   - Add image storage
   - Implement data extraction
   - Add validation

2. Receipt UI
   - Create receipt upload UI
   - Add OCR preview
   - Implement data editing
   - Add receipt gallery

3. Testing
   - Unit tests
   - Integration tests
   - OCR accuracy tests
   - Image processing tests

**المخرجات:**
- Receipt service ready
- Receipt UI ready
- Fully tested

### 4.4 Phase 8.4: Mileage Tracking (Week 5)
**المهام:**
1. Mileage Service
   - Implement GPS tracking
   - Add distance calculation
   - Implement rate application
   - Add route optimization

2. Mileage UI
   - Create mileage tracking UI
   - Add map integration
   - Implement trip history
   - Add mileage reports

3. Testing
   - Unit tests
   - Integration tests
   - GPS accuracy tests
   - Calculation tests

**المخرجات:**
- Mileage service ready
- Mileage UI ready
- Fully tested

### 4.5 Phase 8.5: Per Diem & Reimbursement (Week 6)
**المهام:**
1. Per Diem Service
   - Implement rate management
   - Add per diem calculation
   - Implement location-based rates
   - Add reporting

2. Reimbursement Service
   - Implement reimbursement calculation
   - Add tax calculation
   - Implement payment processing
   - Add reporting

3. UI Implementation
   - Create per diem management UI
   - Add reimbursement processing UI
   - Implement payment tracking
   - Add reports

**المخرجات:**
- Per diem service ready
- Reimbursement service ready
- UI implemented

### 4.6 Phase 8.6: Testing & Documentation (Week 7-8)
**المهام:**
1. Comprehensive Testing
   - End-to-end tests
   - Integration tests
   - Performance tests
   - Security tests

2. Documentation
   - User documentation
   - Developer documentation
   - Policy documentation
   - Troubleshooting guide

3. Training
   - User training materials
   - Admin training materials
   - Video tutorials
   - FAQ

**المخرجات:**
- Fully tested system
- Complete documentation
- Training materials

---

## 5. معايير النجاح

### 5.1 Technical Metrics
- **Processing Time**: < 5 seconds
- **OCR Accuracy**: > 90%
- **GPS Accuracy**: < 10 meters
- **Approval Time**: < 24 hours

### 5.2 Business Metrics
- **Expense Accuracy**: > 95%
- **Approval Rate**: > 90%
- **Reimbursement Time**: < 7 days
- **User Satisfaction**: > 4.5/5

### 5.3 User Experience Metrics
- **Submission Time**: < 2 minutes
- **Receipt Upload Success**: > 95%
- **Mobile Usage**: > 60%
- **Error Rate**: < 2%

---

## 6. المخاطر والتحديات

### 6.1 Technical Risks
- **OCR Accuracy**: Mitigation - Manual review option
- **GPS Accuracy**: Mitigation - Manual entry
- **Image Storage**: Mitigation - Compression & cleanup
- **Workflow Complexity**: Mitigation - Simple templates

### 6.2 Business Risks
- **Policy Violations**: Mitigation - Validation rules
- **Fraud**: Mitigation - Approval workflow
- **Budget Overrun**: Mitigation - Budget tracking
- **User Adoption**: Mitigation - Training & support

---

## 7. المتطلبات الأمنية

### 7.1 Security Measures
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete logging
- **Data Encryption**: At rest & in transit
- **Receipt Security**: Encrypted storage
- **Approval Security**: Multi-factor for large amounts

### 7.2 Compliance
- **Tax Compliance**: Expense tax rules
- **Audit Requirements**: Full audit trail
- **Data Privacy**: PII protection
- **Policy Compliance**: Company policies

---

## 8. خطة الاختبار

### 8.1 Unit Tests
- Expense calculation tests
- OCR processing tests
- Mileage calculation tests
- Reimbursement tests

### 8.2 Integration Tests
- API integration tests
- OCR API integration tests
- Maps API integration tests
- Payment gateway integration tests

### 8.3 Accuracy Tests
- OCR accuracy tests
- GPS accuracy tests
- Calculation accuracy tests
- Reporting accuracy tests

### 8.4 Workflow Tests
- Approval workflow tests
- Escalation tests
- Notification tests
- Audit trail tests

---

## 9. خطة النشر

### 9.1 Stages
1. **Development**: Local environment
2. **Staging**: Pre-production with test data
3. **Canary**: 10% of employees
4. **Production**: Full rollout

### 9.2 Migration Strategy
- Data validation
- Policy setup
- Workflow configuration
- User training
- Rollback plan

---

## 10. الصيانة والتحسين المستمر

### 10.1 Monitoring
- Expense monitoring
- Approval monitoring
- OCR accuracy monitoring
- Reimbursement monitoring

### 10.2 Maintenance
- Rate updates
- Policy updates
- Workflow updates
- OCR model updates

### 10.3 Updates
- Feature enhancements
- Performance improvements
- User feedback integration
- Policy changes

---

## 11. الميزانية التقديرية

### 11.1 Development Costs
- Backend Development: 8 weeks × 2 developers
- Frontend Development: 6 weeks × 1 developer
- Mobile Development: 4 weeks × 1 developer
- Testing: 4 weeks × 1 QA
- Project Management: 8 weeks × 0.5 PM

### 11.2 Infrastructure Costs
- Servers: $300/month
- Database: $200/month
- Redis: $100/month
- S3 Storage: $150/month

### 11.3 API Costs
- OCR API: Variable
- Maps API: Variable
- Storage: $0.023/GB/month

---

## 12. الجدول الزمني

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2  | Expense System | Expense Service, UI, Testing |
| 3    | Approval Workflow | Workflow Service, UI, Testing |
| 4    | Receipt Scanning | Receipt Service, UI, Testing |
| 5    | Mileage Tracking | Mileage Service, UI, Testing |
| 6    | Per Diem & Reimbursement | Per Diem, Reimbursement, UI |
| 7-8  | Testing & Documentation | Comprehensive Tests, Documentation, Training |

**Total Duration**: 8 weeks

---

## 13. الفريق المطلوب

### 13.1 Development Team
- Backend Developer (Node.js) × 2
- Frontend Developer (React/Flutter) × 1
- Mobile Developer (Flutter) × 1

### 13.2 QA Team
- QA Engineer × 1
- Mobile Tester × 0.5

### 13.3 Management
- Project Manager × 0.5
- Product Manager × 0.5

---

## 14. الخلاصة

هذه الخطة توفر إطار عمل شامل لتنفيذ نظام إدارة المصروفات احترافي يتضمن:
- تصنيف المصروفات
- سير عمل الموافقات
- مسح الإيصالات
- تتبع المسافات
- حساب البدلات اليومية
- استرداد المصروفات
- تتبع الميزانية
- دقة عالية

الخطة مصممة لتكون سهلة الاستخدام وفعالة في إدارة المصروفات.
