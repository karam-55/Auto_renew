$base = "http://178.105.209.59"

Write-Host "Logging in..."
$login = '{"username":"owner","password":"owner123","tenantId":"default"}'
$tokenResp = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body $login
$token = $tokenResp.tokens.accessToken
$headers = @{
    "Authorization" = "Bearer $token"
    "x-tenant-id" = "default"
    "Content-Type" = "application/json"
}
Write-Host "Token obtained"

Write-Host "Getting customer..."
$custResp = Invoke-RestMethod -Uri "$base/api/customers?limit=1" -Method GET -Headers $headers
$customerId = $custResp.data[0].id
Write-Host "Customer: $customerId"

Write-Host "Getting vehicle..."
$vehResp = Invoke-RestMethod -Uri "$base/api/vehicles?limit=1" -Method GET -Headers $headers
$vehicleId = $vehResp.data[0].id
Write-Host "Vehicle: $vehicleId"

$statuses = @(
    "PENDING","CONFIRMED","IN_PROGRESS","WAITING_PARTS","READY",
    "INVOICED","PAID","DELIVERED","COMPLETED","CANCELLED","NO_SHOW","NO_INVOICE_REQUIRED"
)

Write-Host "Creating 50 bookings..."
for ($i = 1; $i -le 50; $i++) {
    $status = $statuses[($i - 1) % $statuses.Count]
    $date = (Get-Date).AddDays(($i % 14) - 7).ToString("yyyy-MM-dd")
    $body = @{
        customerId = $customerId
        vehicleId = $vehicleId
        scheduledDate = $date
        scheduledTime = "09:00"
        status = $status
        notes = "Test booking #$i"
        paymentMethod = "CASH"
    } | ConvertTo-Json -Depth 2

    try {
        $resp = Invoke-RestMethod -Uri "$base/api/bookings" -Method POST -Headers $headers -Body $body
        Write-Host "OK Booking $i : $($resp.data.id) Status=$status"
    } catch {
        Write-Host "FAIL Booking $i : $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host "Done!"
