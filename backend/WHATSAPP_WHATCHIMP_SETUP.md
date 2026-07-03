# WhatChimp WhatsApp Setup Guide for Garage Go

## Overview

WhatChimp is a Meta Business Solution Provider (BSP) that connects your WhatsApp Business Account to Garage Go. Unlike the direct Meta API, WhatChimp's REST API does **NOT** support sending template messages directly. Instead, it uses **Bot Flows** to trigger pre-approved WhatsApp templates.

## How It Works

1. You create **Bot Flows** in the WhatChimp Dashboard for each notification type
2. Each Bot Flow contains a "Send Template" node with an approved WhatsApp template
3. Garage Go triggers the Bot Flow via API when a notification needs to be sent
4. WhatChimp sends the template message on your behalf

## Step 1: Create Bot Flows in WhatChimp Dashboard

### 1.1 Log in to WhatChimp

Go to: https://app.whatchimp.com

### 1.2 Navigate to Bot Manager

From the left sidebar: **Bot Manager** → **Create New Flow**

### 1.3 Create a Bot Flow for Each Notification Type

You need to create **6 Bot Flows** (one for each notification type):

| Bot Flow Name | Purpose | Required Custom Fields |
|---------------|---------|----------------------|
| `welcome` | New customer welcome | `customer_name`, `garage_name` |
| `booking_confirmation` | Booking confirmed | `customer_name`, `garage_name`, `booking_id`, `vehicle_info`, `scheduled_date` |
| `booking_status_update` | Status changed | `customer_name`, `garage_name`, `booking_id`, `status_text`, `vehicle_info` |
| `invoice_new` | New invoice | `customer_name`, `garage_name`, `invoice_number`, `total_amount`, `due_date` |
| `payment_received` | Payment received | `customer_name`, `garage_name`, `invoice_number`, `total_amount` |
| `warranty_new` | Warranty created | `customer_name`, `garage_name`, `warranty_number`, `expiry_date` |

### 1.4 Bot Flow Structure

Each Bot Flow should look like this:

```
[Start] → [Send Template Message] → [End]
```

**In the "Send Template Message" node:**
1. Select your approved WhatsApp template from Meta
2. For variable placeholders (e.g., `{{1}}`, `{{2}}`), use WhatChimp Custom Fields:
   - Set `{{1}}` → `{{customer_name}}`
   - Set `{{2}}` → `{{garage_name}}`
   - etc.

> **Important:** WhatChimp automatically pulls Custom Field values from the subscriber's profile when the Bot Flow runs.

### 1.5 Get the Bot Flow Unique ID

After saving each Bot Flow:

1. Go back to **Bot Manager**
2. Find your Bot Flow
3. Click on it to open
4. Look for the **Flow ID** (usually displayed at the top or in settings)
5. Copy this ID - you will need it for the `.env` file

The Flow ID looks like: `flow_abc123xyz` or a similar unique string.

## Step 2: Create Custom Fields

Before Bot Flows can use variables, you must create the Custom Fields in WhatChimp:

1. Go to **Subscriber Manager** → **Custom Fields**
2. Create these fields (exact names as shown):

| Field Name | Type | Description |
|------------|------|-------------|
| `customer_name` | Text | Customer's full name |
| `garage_name` | Text | Garage name |
| `booking_id` | Text | Booking reference number |
| `vehicle_info` | Text | Vehicle make and model |
| `scheduled_date` | Text | Appointment date |
| `status_text` | Text | Booking status in Arabic |
| `invoice_number` | Text | Invoice reference number |
| `total_amount` | Text | Total amount (formatted) |
| `due_date` | Text | Invoice due date |
| `warranty_number` | Text | Warranty reference number |
| `expiry_date` | Text | Warranty expiry date |

> **Case Sensitive:** Use exactly these field names in your Bot Flows.

## Step 3: Configure Environment Variables

Update your `.env` file with the Bot Flow IDs:

```env
# WhatChimp API Credentials
WHATCHIMP_ENABLED="true"
WHATCHIMP_API_KEY="21423|Uv04zwkkoX2fOevTwbsfdappJRlbicTdT4o4Ypl4e195e91d"
WHATCHIMP_PHONE_NUMBER_ID="110123460793905"

# WhatChimp Bot Flow IDs (from Bot Manager)
WHATCHIMP_BOT_FLOW_WELCOME="flow_welcome_xxx"
WHATCHIMP_BOT_FLOW_BOOKING_CONFIRMATION="flow_booking_xxx"
WHATCHIMP_BOT_FLOW_BOOKING_STATUS_UPDATE="flow_status_xxx"
WHATCHIMP_BOT_FLOW_INVOICE_NEW="flow_invoice_xxx"
WHATCHIMP_BOT_FLOW_PAYMENT_RECEIVED="flow_payment_xxx"
WHATCHIMP_BOT_FLOW_WARRANTY_NEW="flow_warranty_xxx"
```

> If a Bot Flow ID is empty, Garage Go will fall back to sending a free-form text message (which only works within 24 hours of the customer's last message).

## Step 4: Deploy to Production

After updating `.env` on the server, restart the backend:

```bash
cd /opt/garage_go
docker-compose -f deploy/docker-compose.prod.yml up -d backend
```

## Step 5: Test

### 5.1 Test the API connection:

```bash
curl -X POST "https://app.whatchimp.com/api/v1/whatsapp/template/list" \
  -d "apiToken=YOUR_API_KEY" \
  -d "phone_number_id=YOUR_PHONE_NUMBER_ID"
```

You should see a list of your approved templates.

### 5.2 Test sending a message:

Make a booking in Garage Go and check if:
1. The subscriber is created in WhatChimp (Subscriber Manager)
2. Custom fields are populated
3. The Bot Flow is triggered
4. WhatsApp message is delivered

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Subscriber limit exceeded" | Free plan limit | Upgrade WhatChimp plan or clean old subscribers |
| "WhatsApp account not found" | Wrong `phone_number_id` | Verify ID in WhatChimp Dashboard → WhatsApp |
| Template not sent | Bot Flow ID missing | Add Flow ID to `.env` |
| Variables not filled | Custom Fields mismatch | Ensure exact field names in Bot Flow and Custom Fields |
| Message not delivered | Outside 24h + no Bot Flow | Always configure Bot Flow IDs for template messages |
| "API access blocked" (Meta) | Token expired/restricted | Use WhatChimp Bot Flows instead of Meta direct API |

## Fallback Behavior

If Bot Flows are not configured, Garage Go will:

1. **Try WhatChimp Bot Flow** (if Flow ID exists)
2. **Fall back to free-form text** (if no Flow ID - only works within 24h window)

For transactional messages (bookings, invoices, warranties), **Bot Flows are required** because new customers have not messaged within 24 hours.

## API Reference

WhatChimp Official Endpoints used by Garage Go:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/whatsapp/send` | POST | Free-form text message (24h window only) |
| `/api/v1/whatsapp/send/file` | POST | Send PDF/image/document |
| `/api/v1/whatsapp/trigger-bot` | POST | Trigger Bot Flow (template messages) |
| `/api/v1/whatsapp/subscriber/create` | POST | Create subscriber |
| `/api/v1/whatsapp/subscriber/chat/assign-custom-fields` | POST | Set subscriber custom fields |
| `/api/v1/whatsapp/template/list` | GET/POST | List approved templates |

## Important Notes

1. **WhatChimp API Token** is NOT the same as Meta Access Token. Get it from your WhatChimp Dashboard.
2. **Phone Number Format**: Must include country code but NO `+` sign (e.g., `963933857557` not `+963933857557`)
3. **Custom Fields are Case Sensitive**: `customer_name` != `Customer_Name`
4. **Bot Flows must be Active** in WhatChimp Dashboard to be triggered
