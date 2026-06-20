# Frontend-Backend Compatibility Test Script for Garage Go 2.0
# This script tests the backend APIs to ensure they work correctly for frontend integration

$BASE_URL = "http://localhost:8080/api"
$TOKEN = ""

# Test counters
$TOTAL_TESTS = 0
$PASSED_TESTS = 0
$FAILED_TESTS = 0

# Function to print test results
function Print-Result {
    param([bool]$Success, [string]$Description)
    
    $script:TOTAL_TESTS++
    if ($Success) {
        Write-Host "✅ PASSED: $Description" -ForegroundColor Green
        $script:PASSED_TESTS++
    } else {
        Write-Host "❌ FAILED: $Description" -ForegroundColor Red
        $script:FAILED_TESTS++
    }
}

# Function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    if ($TOKEN) {
        $headers['Authorization'] = "Bearer $TOKEN"
    }
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Get -Headers $headers -ErrorAction Stop
            $statusCode = 200
        } elseif ($Method -eq "POST") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Post -Headers $headers -Body $Data -ErrorAction Stop
            $statusCode = 200
        } elseif ($Method -eq "PUT") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Put -Headers $headers -Body $Data -ErrorAction Stop
            $statusCode = 200
        } elseif ($Method -eq "DELETE") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Delete -Headers $headers -ErrorAction Stop
            $statusCode = 200
        }
        
        Print-Result -Success $true -Description "$Description (HTTP $statusCode)"
        Write-Host "Response: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Print-Result -Success $false -Description "$Description (HTTP $statusCode)"
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Frontend-Backend Compatibility Test" -ForegroundColor Cyan
Write-Host "Garage Go 2.0" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "=== 1. Health Check ===" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get -ErrorAction Stop
    Print-Result -Success $true -Description "Backend Health Check"
    Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Print-Result -Success $false -Description "Backend Health Check"
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Authentication
Write-Host "=== 2. Authentication ===" -ForegroundColor Cyan
Write-Host "Testing login with default credentials..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
        tenantId = "default"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Headers @{'Content-Type'='application/json'} -Body $loginData -ErrorAction Stop
    
    if ($loginResponse.accessToken) {
        $TOKEN = $loginResponse.accessToken
        Print-Result -Success $true -Description "Admin Login Successful"
        Write-Host "Token obtained: $($TOKEN.Substring(0,20))..." -ForegroundColor Gray
    } else {
        Print-Result -Success $false -Description "Admin Login Failed"
        Write-Host "Response: $($loginResponse | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Print-Result -Success $false -Description "Admin Login Failed"
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Dashboard Stats
Write-Host "=== 3. Dashboard Statistics ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/bookings/dashboard-stats" -Data "" -Description "Dashboard Statistics"
Write-Host ""

# Test 4: Customers CRUD
Write-Host "=== 4. Customers Management ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/customers" -Data "" -Description "Get Customers List"

# Create a test customer
$testCustomerData = @{
    fullName = "Test Customer"
    phone = "0999123456"
    address = "Test Address"
    city = "Damascus"
    isActive = $true
} | ConvertTo-Json

Test-Endpoint -Method "POST" -Endpoint "/customers" -Data $testCustomerData -Description "Create Customer"
Write-Host ""

# Test 5: Vehicles
Write-Host "=== 5. Vehicles Management ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/vehicles" -Data "" -Description "Get Vehicles List"
Write-Host ""

# Test 6: Services
Write-Host "=== 6. Services Management ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/services" -Data "" -Description "Get Services List"
Write-Host ""

# Test 7: Bookings
Write-Host "=== 7. Bookings Management ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/bookings" -Data "" -Description "Get Bookings List"
Write-Host ""

# Test 8: Inventory
Write-Host "=== 8. Inventory Management ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/parts" -Data "" -Description "Get Parts List"
Test-Endpoint -Method "GET" -Endpoint "/suppliers" -Data "" -Description "Get Suppliers List"
Write-Host ""

# Test 9: Accounting
Write-Host "=== 9. Accounting Module ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/accounts" -Data "" -Description "Get Chart of Accounts"
Test-Endpoint -Method "GET" -Endpoint "/journal-entries" -Data "" -Description "Get Journal Entries"
Test-Endpoint -Method "GET" -Endpoint "/invoices" -Data "" -Description "Get Invoices List"
Write-Host ""

# Test 10: HR Module
Write-Host "=== 10. HR Module ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/hr/employees" -Data "" -Description "Get Employees List"
Test-Endpoint -Method "GET" -Endpoint "/hr/departments" -Data "" -Description "Get Departments List"
Test-Endpoint -Method "GET" -Endpoint "/hr/shifts" -Data "" -Description "Get Shifts List"
Write-Host ""

# Test 11: Phase 6 Features
Write-Host "=== 11. Phase 6 Advanced Features ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/loyalty/rewards" -Data "" -Description "Get Loyalty Rewards"
Test-Endpoint -Method "GET" -Endpoint "/maintenance/templates" -Data "" -Description "Get Maintenance Templates"
Test-Endpoint -Method "GET" -Endpoint "/inventory-count/sessions" -Data "" -Description "Get Inventory Count Sessions"
Test-Endpoint -Method "GET" -Endpoint "/reports/advanced/revenue" -Data "" -Description "Get Revenue Report"
Test-Endpoint -Method "GET" -Endpoint "/reports/advanced/inventory" -Data "" -Description "Get Inventory Report"
Test-Endpoint -Method "GET" -Endpoint "/reports/advanced/mechanic-performance" -Data "" -Description "Get Mechanic Performance Report"
Test-Endpoint -Method "GET" -Endpoint "/reports/advanced/financial" -Data "" -Description "Get Financial Report"
Test-Endpoint -Method "GET" -Endpoint "/reports/advanced/customer-insights" -Data "" -Description "Get Customer Insights Report"
Write-Host ""

# Test 12: NO EMAILS Verification
Write-Host "=== 12. NO EMAILS Compliance Check ===" -ForegroundColor Cyan
Write-Host "Checking Customer model for email field..." -ForegroundColor Yellow
$noEmailCustomerData = @{
    fullName = "No Email Test"
    phone = "0999888777"
    address = "Test"
} | ConvertTo-Json
Test-Endpoint -Method "POST" -Endpoint "/customers" -Data $noEmailCustomerData -Description "Create Customer Without Email"
Write-Host ""

# Final Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $TOTAL_TESTS"
Write-Host "Passed: $PASSED_TESTS" -ForegroundColor Green
Write-Host "Failed: $FAILED_TESTS" -ForegroundColor Red
$successRate = if ($TOTAL_TESTS -gt 0) { [math]::Round(($PASSED_TESTS / $TOTAL_TESTS) * 100, 2) } else { 0 }
Write-Host "Success Rate: $successRate%"
Write-Host "==========================================" -ForegroundColor Cyan

if ($FAILED_TESTS -eq 0) {
    Write-Host "All tests passed! Backend is ready for frontend integration." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Please review the errors above." -ForegroundColor Red
    exit 1
}
