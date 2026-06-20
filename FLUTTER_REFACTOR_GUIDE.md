# Flutter Frontend Refactoring Guide
## Phase 6: Unified Error Handling & BaseRepository Pattern

**Status:** Core infrastructure complete | **flutter analyze:** 0 errors

---

## What Was Implemented

### 1. ApiErrorHandler (`core/networking/api_error_handler.dart`)
Centralized error handling with Arabic user-friendly messages:
- `network` - "لا يوجد اتصال بالإنترنت"
- `timeout` - "انتهى وقت الاتصال بالخادم"
- `server` - "الخادم غير متاح حالياً"
- `unauthorized` - "انتهت صلاحية الجلسة"
- `forbidden` - "ليس لديك صلاحية"
- `notFound` - "المورد المطلوب غير موجود"

### 2. Enhanced DioClient (`core/networking/dio_client.dart`)
- **Retry Interceptor**: 3 retries with exponential backoff + jitter
- **Separate Refresh Dio**: Prevents infinite loops
- **Conditional Debug Logging**: Only in `kDebugMode`
- **Shorter Timeouts**: 15s web / 20s desktop

### 3. BaseRepository (`core/networking/base_repository.dart`)
Provides two helper methods:
```dart
// For GET/POST/PUT that return data
executeApiCall<T>({
  required Future<Response> Function() call,
  required T Function(dynamic) parser,
  String errorCode = 'API_ERROR',
  String errorMessage = 'حدث خطأ في الاتصال',
  int? expectedStatusCode = 200,
})

// For DELETE that returns void
executeVoidCall({
  required Future<Response> Function() call,
  String errorCode = 'API_ERROR',
  String errorMessage = 'حدث خطأ في الاتصال',
  int? expectedStatusCode = 200,
})
```

### 4. Refactored Repositories (4/28 done)
- ✅ `BookingRepository` - Full refactor with executeApiCall
- ✅ `AuthRepository` - Full refactor with executeApiCall
- ✅ `CustomerRepository` - Partial refactor (complex list parsing kept)
- ✅ `VehicleRepository` - Partial refactor (debugPrint kept, delete uses executeVoidCall)

---

## Migration Guide for Remaining 24 Repositories

### Step 1: Add Import
Add to every repository file:
```dart
import '../../../../core/networking/base_repository.dart';
```

### Step 2: Extend BaseRepository
Change:
```dart
class InvoiceRepository {
```
To:
```dart
class InvoiceRepository extends BaseRepository {
```

### Step 3A: Simple GET/POST/PUT Method
**Before:**
```dart
Future<ApiResponse<InvoiceModel>> getInvoiceById(String id) async {
  try {
    final response = await _dioClient.get('/api/invoices/$id');
    if (response.statusCode == 200) {
      final apiResponse = ApiResponse<InvoiceModel>.fromJson(
        response.data,
        (data) => InvoiceModel.fromJson(data),
      );
      return apiResponse;
    } else {
      return ApiResponse<InvoiceModel>(
        success: false,
        error: ApiError(code: 'GET_INVOICE_FAILED', message: 'Failed'),
      );
    }
  } catch (e) {
    return ApiResponse<InvoiceModel>(
      success: false,
      error: ApiError(code: 'NETWORK_ERROR', message: e.toString()),
    );
  }
}
```

**After:**
```dart
Future<ApiResponse<InvoiceModel>> getInvoiceById(String id) async {
  return executeApiCall(
    call: () => _dioClient.get('/api/invoices/$id'),
    parser: (data) => InvoiceModel.fromJson(data),
    errorCode: 'GET_INVOICE_FAILED',
    errorMessage: 'فشل في تحميل الفاتورة',
  );
}
```

### Step 3B: DELETE Method
**Before:**
```dart
Future<ApiResponse<void>> deleteInvoice(String id) async {
  try {
    final response = await _dioClient.delete('/api/invoices/$id');
    if (response.statusCode == 200) {
      return ApiResponse<void>(success: true);
    } else {
      return ApiResponse<void>(
        success: false,
        error: ApiError(code: 'DELETE_FAILED', message: 'Failed'),
      );
    }
  } catch (e) { ... }
}
```

**After:**
```dart
Future<ApiResponse<void>> deleteInvoice(String id) async {
  return executeVoidCall(
    call: () => _dioClient.delete('/api/invoices/$id'),
    errorCode: 'DELETE_INVOICE_FAILED',
    errorMessage: 'فشل في حذف الفاتورة',
  );
}
```

### Step 3C: POST with 201 Status
**Before:**
```dart
if (response.statusCode == 201) { ... }
```

**After:**
```dart
return executeApiCall(
  call: () => _dioClient.post('/api/invoices', data: request.toJson()),
  parser: (data) => InvoiceModel.fromJson(data),
  errorCode: 'CREATE_INVOICE_FAILED',
  errorMessage: 'فشل في إنشاء الفاتورة',
  expectedStatusCode: 201,  // <-- Add this
);
```

### Step 3D: Query Parameters with Null Filtering
**Before:**
```dart
queryParameters: {
  'page': page,
  if (search != null) 'search': search,
  if (status != null) 'status': status,
},
```

**After:**
```dart
queryParameters: buildQueryParams({
  'page': page,
  'search': search,
  'status': status,
}),
```
`buildQueryParams()` automatically removes null values.

---

## Remaining Repositories to Convert (24 files)

Run this command to see all remaining:
```bash
cd flutter_admin
find lib/features -name "*repository.dart" | sort
```

### Priority 1 (High usage):
1. `features/invoices/data/repositories/invoice_repository.dart`
2. `features/payments/data/repositories/payment_repository.dart`
3. `features/inventory/data/repositories/inventory_repository.dart`
4. `features/inventory/data/repositories/part_repository.dart`
5. `features/services/data/repositories/service_repository.dart`

### Priority 2:
6. `features/accounting/data/repositories/accounting_advanced_repository.dart`
7. `features/finance/data/repositories/finance_repository.dart`
8. `features/hr/data/repositories/hr_advanced_repository.dart`
9. `features/hr/data/repositories/employee_repository.dart`
10. `features/notifications/data/repositories/notifications_repository.dart`

### Priority 3:
11-24. All remaining repositories in branches, reports, memberships, workshop, vehicles sub-repos, admin, dashboard, analytics, ai

---

## Verification

After converting each repository, run:
```bash
flutter analyze lib/features/YOUR_FEATURE
```

Full project check:
```bash
flutter analyze
```

Target: **0 errors**

---

## Benefits of This Refactoring

| Before | After |
|--------|-------|
| 30-60 lines per method | 5-10 lines per method |
| Generic `e.toString()` errors | Arabic user-friendly messages |
| Duplicated try/catch in every repo | Single point in BaseRepository |
| No retry logic | Automatic 3 retries with backoff |
| No timeout differentiation | Web 15s / Desktop 20s |
| Debug prints always on | Only in kDebugMode |
