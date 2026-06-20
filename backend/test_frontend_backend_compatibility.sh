#!/bin/bash

# Frontend-Backend Compatibility Test Script for Garage Go 2.0
# This script tests the backend APIs to ensure they work correctly for frontend integration

BASE_URL="http://localhost:8080/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test results
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing${NC}: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        print_result 0 "$description (HTTP $http_code)"
        echo "Response: $body" | head -c 200
        echo ""
        return 0
    else
        print_result 1 "$description (HTTP $http_code)"
        echo "Error Response: $body"
        return 1
    fi
}

echo "=========================================="
echo "Frontend-Backend Compatibility Test"
echo "Garage Go 2.0"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "=== 1. Health Check ==="
test_endpoint "GET" "/health" "" "Backend Health Check"
echo ""

# Test 2: Authentication
echo "=== 2. Authentication ==="
echo "Testing login with default credentials..."
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123","tenantId":"default"}')

if echo "$login_response" | grep -q "accessToken"; then
    TOKEN=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    print_result 0 "Admin Login Successful"
    echo "Token obtained: ${TOKEN:0:20}..."
else
    print_result 1 "Admin Login Failed"
    echo "Response: $login_response"
fi
echo ""

# Test 3: Dashboard Stats
echo "=== 3. Dashboard Statistics ==="
test_endpoint "GET" "/bookings/dashboard-stats" "" "Dashboard Statistics"
echo ""

# Test 4: Customers CRUD
echo "=== 4. Customers Management ==="
test_endpoint "GET" "/customers" "" "Get Customers List"

# Create a test customer
test_customer_data='{"fullName":"Test Customer","phone":"0999123456","address":"Test Address","city":"Damascus","isActive":true}'
test_endpoint "POST" "/customers" "$test_customer_data" "Create Customer"
echo ""

# Test 5: Vehicles
echo "=== 5. Vehicles Management ==="
test_endpoint "GET" "/vehicles" "" "Get Vehicles List"
echo ""

# Test 6: Services
echo "=== 6. Services Management ==="
test_endpoint "GET" "/services" "" "Get Services List"
echo ""

# Test 7: Bookings
echo "=== 7. Bookings Management ==="
test_endpoint "GET" "/bookings" "" "Get Bookings List"
echo ""

# Test 8: Inventory
echo "=== 8. Inventory Management ==="
test_endpoint "GET" "/parts" "" "Get Parts List"
test_endpoint "GET" "/suppliers" "" "Get Suppliers List"
echo ""

# Test 9: Accounting
echo "=== 9. Accounting Module ==="
test_endpoint "GET" "/accounts" "" "Get Chart of Accounts"
test_endpoint "GET" "/journal-entries" "" "Get Journal Entries"
test_endpoint "GET" "/invoices" "" "Get Invoices List"
echo ""

# Test 10: HR Module
echo "=== 10. HR Module ==="
test_endpoint "GET" "/hr/employees" "" "Get Employees List"
test_endpoint "GET" "/hr/departments" "" "Get Departments List"
test_endpoint "GET" "/hr/shifts" "" "Get Shifts List"
echo ""

# Test 11: Phase 6 Features
echo "=== 11. Phase 6 Advanced Features ==="
test_endpoint "GET" "/loyalty/rewards" "" "Get Loyalty Rewards"
test_endpoint "GET" "/maintenance/templates" "" "Get Maintenance Templates"
test_endpoint "GET" "/inventory-count/sessions" "" "Get Inventory Count Sessions"
test_endpoint "GET" "/reports/advanced/revenue" "" "Get Revenue Report"
test_endpoint "GET" "/reports/advanced/inventory" "" "Get Inventory Report"
test_endpoint "GET" "/reports/advanced/mechanic-performance" "" "Get Mechanic Performance Report"
test_endpoint "GET" "/reports/advanced/financial" "" "Get Financial Report"
test_endpoint "GET" "/reports/advanced/customer-insights" "" "Get Customer Insights Report"
echo ""

# Test 12: NO EMAILS Verification
echo "=== 12. NO EMAILS Compliance Check ==="
echo "Checking Customer model for email field..."
# This would typically be checked in the frontend, but we can verify the API doesn't require email
test_endpoint "POST" "/customers" '{"fullName":"No Email Test","phone":"0999888777","address":"Test"}' "Create Customer Without Email"
echo ""

# Final Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo "Success Rate: $(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"
echo "=========================================="

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Backend is ready for frontend integration.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
