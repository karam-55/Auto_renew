# Manual API Testing Script for Garage Go 2.0
# This script will test each API endpoint manually and log results

$BASE_URL = "http://localhost:8080/api"
$TEST_RESULTS = @()
$TOKEN = ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Manual API Testing - Garage Go 2.0" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to test and log results
function Test-API {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = ""
    )
    
    Write-Host "Testing: $TestName" -ForegroundColor Yellow
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    if ($TOKEN) {
        $headers['Authorization'] = "Bearer $TOKEN"
    }
    
    $startTime = Get-Date
    $success = $false
    $errorMessage = ""
    $response = ""
    $statusCode = 0
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Get -Headers $headers -ErrorAction Stop
            $statusCode = 200
        } elseif ($Method -eq "POST") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Post -Headers $headers -Body $Body -ErrorAction Stop
            $statusCode = 200
        } elseif ($Method -eq "PUT") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Put -Headers $headers -Body $Body -ErrorAction Stop
            $statusCode = 200
        } elseif ($Method -eq "DELETE") {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method Delete -Headers $headers -ErrorAction Stop
            $statusCode = 200
        }
        
        $success = $true
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
    } catch {
        $success = $false
        $errorMessage = $_.Exception.Message
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ FAILED (HTTP $statusCode)" -ForegroundColor Red
        Write-Host "Error: $errorMessage" -ForegroundColor Red
    }
    
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    
    $TEST_RESULTS += [PSCustomObject]@{
        TestName = $TestName
        Method = $Method
        Endpoint = $Endpoint
        Success = $success
        StatusCode = $statusCode
        Duration = $duration
        ErrorMessage = $errorMessage
    }
    
    Write-Host ""
    return $success
}

# 1. Health Check
Write-Host "=== 1. Health Check ===" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Health Check: SUCCESS" -ForegroundColor Green
    Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Gray
    $TEST_RESULTS += [PSCustomObject]@{
        TestName = "Health Check"
        Method = "GET"
        Endpoint = "/health"
        Success = $true
        StatusCode = 200
        Duration = 0
        ErrorMessage = ""
    }
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $TEST_RESULTS += [PSCustomObject]@{
        TestName = "Health Check"
        Method = "GET"
        Endpoint = "/health"
        Success = $false
        StatusCode = 0
        Duration = 0
        ErrorMessage = $_.Exception.Message
    }
}
Write-Host ""

# 2. Authentication
Write-Host "=== 2. Authentication ===" -ForegroundColor Cyan
$loginData = @{
    username = "admin"
    password = "admin123"
    tenantId = "default"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Headers @{'Content-Type'='application/json'} -Body $loginData -ErrorAction Stop
    $TOKEN = $loginResponse.tokens.accessToken
    Write-Host "✅ Login: SUCCESS" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.fullName) ($($loginResponse.user.role))" -ForegroundColor Gray
    Write-Host "Token: $($TOKEN.Substring(0,30))..." -ForegroundColor Gray
    $TEST_RESULTS += [PSCustomObject]@{
        TestName = "Admin Login"
        Method = "POST"
        Endpoint = "/auth/login"
        Success = $true
        StatusCode = 200
        Duration = 0
        ErrorMessage = ""
    }
} catch {
    Write-Host "❌ Login: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $TEST_RESULTS += [PSCustomObject]@{
        TestName = "Admin Login"
        Method = "POST"
        Endpoint = "/auth/login"
        Success = $false
        StatusCode = 0
        Duration = 0
        ErrorMessage = $_.Exception.Message
    }
}
Write-Host ""

# 3. Dashboard
Write-Host "=== 3. Dashboard ===" -ForegroundColor Cyan
Test-API -TestName "Dashboard Statistics" -Method "GET" -Endpoint "/bookings/dashboard-stats"
Write-Host ""

# 4. Customers
Write-Host "=== 4. Customers ===" -ForegroundColor Cyan
Test-API -TestName "Get Customers" -Method "GET" -Endpoint "/customers"

$customerData = @{
    fullName = "Test Customer QA"
    phone = "0999888777"
    address = "Test Address"
    city = "Damascus"
    isActive = $true
} | ConvertTo-Json
Test-API -TestName "Create Customer (No Email)" -Method "POST" -Endpoint "/customers" -Body $customerData
Write-Host ""

# 5. Vehicles
Write-Host "=== 5. Vehicles ===" -ForegroundColor Cyan
Test-API -TestName "Get Vehicles" -Method "GET" -Endpoint "/vehicles"
Write-Host ""

# 6. Services
Write-Host "=== 6. Services ===" -ForegroundColor Cyan
Test-API -TestName "Get Services" -Method "GET" -Endpoint "/services"
Write-Host ""

# 7. Bookings
Write-Host "=== 7. Bookings ===" -ForegroundColor Cyan
Test-API -TestName "Get Bookings" -Method "GET" -Endpoint "/bookings"
Write-Host ""

# 8. Inventory
Write-Host "=== 8. Inventory ===" -ForegroundColor Cyan
Test-API -TestName "Get Parts" -Method "GET" -Endpoint "/parts"
Test-API -TestName "Get Suppliers" -Method "GET" -Endpoint "/suppliers"
Write-Host ""

# 9. Accounting
Write-Host "=== 9. Accounting ===" -ForegroundColor Cyan
Test-API -TestName "Get Chart of Accounts" -Method "GET" -Endpoint "/accounts"
Test-API -TestName "Get Journal Entries" -Method "GET" -Endpoint "/journal-entries"
Test-API -TestName "Get Invoices" -Method "GET" -Endpoint "/invoices"
Write-Host ""

# 10. HR
Write-Host "=== 10. HR Module ===" -ForegroundColor Cyan
Test-API -TestName "Get Employees" -Method "GET" -Endpoint "/hr/employees"
Test-API -TestName "Get Departments" -Method "GET" -Endpoint "/hr/departments"
Test-API -TestName "Get Shifts" -Method "GET" -Endpoint "/hr/shifts"
Write-Host ""

# 11. Phase 6 Features
Write-Host "=== 11. Phase 6 Features ===" -ForegroundColor Cyan
Test-API -TestName "Get Loyalty Rewards" -Method "GET" -Endpoint "/loyalty/rewards"
Test-API -TestName "Get Maintenance Templates" -Method "GET" -Endpoint "/maintenance/templates"
Test-API -TestName "Get Inventory Count Sessions" -Method "GET" -Endpoint "/inventory-count/sessions"
Test-API -TestName "Get Revenue Report" -Method "GET" -Endpoint "/reports/advanced/revenue"
Test-API -TestName "Get Inventory Report" -Method "GET" -Endpoint "/reports/advanced/inventory"
Test-API -TestName "Get Mechanic Performance" -Method "GET" -Endpoint "/reports/advanced/mechanic-performance"
Test-API -TestName "Get Financial Report" -Method "GET" -Endpoint "/reports/advanced/financial"
Test-API -TestName "Get Customer Insights" -Method "GET" -Endpoint "/reports/advanced/customer-insights"
Write-Host ""

# 12. Socket.io Connection Test
Write-Host "=== 12. Socket.io Connection ===" -ForegroundColor Cyan
Write-Host "Socket.io runs on port 8080 - testing availability..." -ForegroundColor Yellow
try {
    $socketTest = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue
    if ($socketTest.TcpTestSucceeded) {
        Write-Host "✅ Socket.io Port Available: SUCCESS" -ForegroundColor Green
        $TEST_RESULTS += [PSCustomObject]@{
            TestName = "Socket.io Port"
            Method = "TCP"
            Endpoint = "localhost:8080"
            Success = $true
            StatusCode = 200
            Duration = 0
            ErrorMessage = ""
        }
    } else {
        Write-Host "❌ Socket.io Port: FAILED" -ForegroundColor Red
        $TEST_RESULTS += [PSCustomObject]@{
            TestName = "Socket.io Port"
            Method = "TCP"
            Endpoint = "localhost:8080"
            Success = $false
            StatusCode = 0
            Duration = 0
            ErrorMessage = "Port not available"
        }
    }
} catch {
    Write-Host "❌ Socket.io Port: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $TEST_RESULTS += [PSCustomObject]@{
        TestName = "Socket.io Port"
        Method = "TCP"
        Endpoint = "localhost:8080"
        Success = $false
        StatusCode = 0
        Duration = 0
        ErrorMessage = $_.Exception.Message
    }
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$totalTests = $TEST_RESULTS.Count
$passedTests = ($TEST_RESULTS | Where-Object { $_.Success -eq $true }).Count
$failedTests = ($TEST_RESULTS | Where-Object { $_.Success -eq $false }).Count
$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total Tests: $totalTests"
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $successRate%"
Write-Host "==========================================" -ForegroundColor Cyan

# Export results to CSV
$TEST_RESULTS | Export-Csv -Path "backend_test_results.csv" -NoTypeInformation
Write-Host "Results exported to backend_test_results.csv" -ForegroundColor Yellow

# Display failed tests
if ($failedTests -gt 0) {
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Red
    $TEST_RESULTS | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "- $($_.TestName): $($_.ErrorMessage)" -ForegroundColor Red
    }
}

if ($failedTests -eq 0) {
    Write-Host ""
    Write-Host "🎉 All tests passed! Backend is ready for frontend integration." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Please review the errors above." -ForegroundColor Yellow
}
