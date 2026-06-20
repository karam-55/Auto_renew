# ⚠️ IMPORTANT: NO EMAILS ALLOWED

## STRICT RULE

**NO EMAIL FIELDS OR FUNCTIONALITY IN GARAGE GO 2.0**

This project does NOT use emails for any purpose. All communication happens via:
- Phone numbers
- WhatsApp
- In-app notifications
- SMS (if needed)

## What is FORBIDDEN

❌ Email fields in database models
❌ Email validation
❌ Email sending functionality
❌ Email notifications
❌ Email authentication
❌ Email recovery
❌ Email marketing
❌ Any email-related features

## What is ALLOWED

✅ Phone numbers for contact
✅ WhatsApp for notifications
✅ In-app notifications (Socket.io)
✅ SMS for critical alerts
✅ Username for authentication

## Database Models

All models use PHONE instead of EMAIL:
- User: phone (required)
- Customer: phone (required, unique)
- Supplier: phone (required)
- Employee: phone (required)
- CompanySettings: phone (optional)

## Authentication

Authentication uses:
- Username + Password
- Phone number (optional for verification)
- JWT tokens

## Notifications

Notifications use:
- In-app (Socket.io)
- WhatsApp API
- SMS (optional)

## Reminder for All Agents/Developers

**ALWAYS REMEMBER: NO EMAILS IN GARAGE GO 2.0**

This rule applies to:
- Database schema design
- API development
- Frontend forms
- Authentication systems
- Notification systems
- Any future features

If you see any email field or functionality, REMOVE IT immediately.

---

**Last Updated:** 2026-05-25
**Project:** Garage Go 2.0
