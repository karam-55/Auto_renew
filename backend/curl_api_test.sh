#!/bin/bash

# Manual API Testing using curl for Garage Go 2.0
echo "=========================================="
echo "Manual API Testing - Garage Go 2.0"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8080/api"
TOKEN=""

# Test counter
TOTAL=0
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN")
        else
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data")
        else
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "✅ PASSED (HTTP $http_code)"
        echo "Response: $body" | head -c 300
        echo ""
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAILED (HTTP $http_code)"
        echo "Error: $body"
        echo ""
        FAILED=$((FAILED + 1))
    fi
}

# 1. Health Check
echo "=== 1. Health Check ==="
health_response=$(curl -s "http://localhost:8080/health")
if echo "$health_response" | grep -q "ok"; then
    echo "✅ Health Check: PASSED"
    echo "Response: $health_response"
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
else
    echo "❌ Health Check: FAILED"
    echo "Response: $health_response"
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
fi
echo ""

# 2. Authentication
echo "=== 2. Authentication ==="
echo "Testing login as owner for full permissions..."
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"owner","password":"owner123","tenantId":"default"}')

if echo "$login_response" | grep -q "accessToken"; then
    TOKEN=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "✅ Login: PASSED"
    echo "Token: ${TOKEN:0:30}..."
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
else
    echo "❌ Login: FAILED"
    echo "Response: $login_response"
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
fi
echo ""

# 3. Dashboard
echo "=== 3. Dashboard ==="
test_endpoint "GET" "/bookings/dashboard-stats" "" "Dashboard Statistics"
echo ""

# 4. Customers
echo "=== 4. Customers ==="
test_endpoint "GET" "/customers" "" "Get Customers"
test_endpoint "POST" "/customers" '{"fullName":"Test QA Customer 2","phone":"0999888666","address":"Test","city":"Damascus","isActive":true}' "Create Customer (No Email)"
echo ""

# 5. Vehicles
echo "=== 5. Vehicles ==="
test_endpoint "GET" "/vehicles" "" "Get Vehicles"
echo ""

# 6. Services
echo "=== 6. Services ==="
test_endpoint "GET" "/services" "" "Get Services"
echo ""

# 7. Bookings
echo "=== 7. Bookings ==="
test_endpoint "GET" "/bookings" "" "Get Bookings"
echo ""

# 8. Inventory
echo "=== 8. Inventory ==="
test_endpoint "GET" "/parts" "" "Get Parts"
test_endpoint "GET" "/suppliers" "" "Get Suppliers"
echo ""

# 9. Accounting
echo "=== 9. Accounting ==="
test_endpoint "GET" "/accounts" "" "Get Chart of Accounts"
test_endpoint "GET" "/journal-entries" "" "Get Journal Entries"
test_endpoint "GET" "/invoices" "" "Get Invoices"
echo ""

# 10. HR
echo "=== 10. HR ==="
test_endpoint "GET" "/hr/employees" "" "Get Employees"
test_endpoint "GET" "/hr/departments" "" "Get Departments"
test_endpoint "GET" "/hr/shifts" "" "Get Shifts"
echo ""

# 11. Phase 6 Features
echo "=== 11. Phase 6 Features ==="
test_endpoint "GET" "/loyalty/rewards" "" "Get Loyalty Rewards"
test_endpoint "GET" "/maintenance/templates" "" "Get Maintenance Templates"
test_endpoint "GET" "/inventory-count" "" "Get Inventory Count Sessions"
test_endpoint "GET" "/reports/advanced/revenue" "" "Get Revenue Report"
test_endpoint "GET" "/reports/advanced/inventory" "" "Get Inventory Report"
test_endpoint "GET" "/reports/advanced/mechanic-performance" "" "Get Mechanic Performance"
test_endpoint "GET" "/reports/advanced/financial" "" "Get Financial Report"
test_endpoint "GET" "/reports/advanced/customer-insights" "" "Get Customer Insights"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
if [ $TOTAL -gt 0 ]; then
    success_rate=$((PASSED * 100 / TOTAL))
    echo "Success Rate: $success_rate%"
fi
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed! Backend is ready for frontend integration."
    exit 0
else
    echo "⚠️  Some tests failed. Please review the errors above."
    exit 1
fi
