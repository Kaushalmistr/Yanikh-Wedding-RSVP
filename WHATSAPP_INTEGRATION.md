# WhatsApp Integration Documentation

## Overview

This Wedding RSVP system includes WhatsApp messaging integration that sends messages to guests directly via the **WhatsApp Business Cloud API** (Meta). Messages are sent automatically — no manual interaction required.

## Architecture

```
┌─────────────┐       ┌──────────────────────────┐       ┌─────────────────────┐
│  React App  │──POST──▶  Supabase Edge Function  │──POST──▶  Meta Graph API    │
│  (Browser)  │       │  /send-whatsapp          │       │  WhatsApp Cloud API │
│             │◀─JSON──│  (holds access token)    │◀─JSON──│  v21.0/messages    │
└─────────────┘       └──────────────────────────┘       └─────────────────────┘
```

The access token **never** reaches the browser. The Supabase Edge Function acts as a secure proxy.

## Features

✅ **Automatic Message Sending** — Messages sent via WhatsApp Business API without manual Send  
✅ **Fallback to WhatsApp Web** — Falls back to wa.me links if API is not configured  
✅ **Template Messages** — Support for pre-approved message templates (required for first contact)  
✅ **Free-form Text Messages** — For conversations within the 24-hour reply window  
✅ **Error Handling** — Graceful error handling with fallback option  
✅ **Status Tracking** — Track delivery status (Success, Pending, Failed, Not Sent)  
✅ **Secure** — API tokens stored as Supabase secrets, never exposed to the client  

## Setup Guide

### Prerequisites

1. A **Meta Business account** — [business.facebook.com](https://business.facebook.com/)
2. A **Meta Developer account** — [developers.facebook.com](https://developers.facebook.com/)
3. **Supabase project** — Already configured (see `.env`)
4. **Supabase CLI** — For deploying Edge Functions

### Step 1: Create a Meta App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps/)
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details and create
5. Under **"Add Products"**, find **"WhatsApp"** and click **"Set Up"**

### Step 2: Get Your Credentials

From the WhatsApp section in your Meta App dashboard:

1. **Phone Number ID** — Found under WhatsApp > API Setup
2. **Access Token** — Two options:
   - **Temporary token** (expires in 24 hours) — Good for testing
   - **Permanent System User token** (recommended for production):
     1. Go to [Business Settings > System Users](https://business.facebook.com/settings/system-users)
     2. Create a System User with Admin role
     3. Generate a token with `whatsapp_business_messaging` permission

### Step 3: Configure Supabase Secrets

Set the secrets via the Supabase CLI (these are never exposed to the client):

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Set the WhatsApp secrets
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_meta_access_token_here
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

### Step 4: Deploy the Edge Function

```bash
# From the project root directory
supabase functions deploy send-whatsapp
```

### Step 5: Enable in Frontend

In your `.env` file, ensure this is set:

```env
VITE_WHATSAPP_API_ENABLED=true
```

When set to `true`, the WhatsApp Message Modal will use the Business API (auto-send).  
When `false` or missing, it falls back to opening WhatsApp Web (manual send).

### Step 6: Test

1. Start the dev server: `npm run dev`
2. Go to the Guest List
3. Click the WhatsApp send icon (📤) on any guest
4. Type a message and click **"Send Message"**
5. The message should be delivered automatically to the guest's WhatsApp

## Message Types

### Text Messages (Free-form)

Used within the 24-hour customer service window (after a user messages you first):

```typescript
import { sendWhatsAppViaAPI } from './lib/whatsappUtils';

const result = await sendWhatsAppViaAPI('+919876543210', 'Hello!');
if (result.success) {
  console.log('Sent!', result.messageId);
}
```

### Template Messages

Required for first-contact outreach (e.g., sending wedding invitations to guests who haven't messaged you). Templates must be pre-approved in Meta Business Manager.

```typescript
import { sendWhatsAppTemplate } from './lib/whatsappUtils';

const result = await sendWhatsAppTemplate(
  '+919876543210',
  'wedding_invitation',  // template name
  'en_US',               // language
  [{
    type: 'body',
    parameters: [
      { type: 'text', text: 'John' },       // {{1}} Guest name
      { type: 'text', text: 'June 15' },     // {{2}} Date
    ]
  }]
);
```

To create a template:
1. Go to Meta Business Manager > WhatsApp Manager > Message Templates
2. Create a new template with your invitation text
3. Use placeholders like `{{1}}`, `{{2}}` for dynamic content
4. Submit for review (usually approved within minutes)

## WhatsApp Status Column

The guest list table includes a **"WhatsApp Status"** column:

| Status | Display | Description |
|--------|---------|-------------|
| **Success** | ✓ Sent (Green) | Message delivered successfully |
| **Pending** | ⏳ Pending (Yellow) | Awaiting delivery confirmation |
| **Failed** | ✗ Failed (Red) | Failed to send message |
| **Not Sent** | — Not Sent (Gray) | Message not sent yet |

## File Structure

```
src/
├── lib/
│   ├── whatsappUtils.ts       # WhatsApp API + fallback functions
│   ├── whatsappService.ts     # Bulk messaging & templates (mock/production)
│   └── guestUploadService.ts  # Guest upload with WhatsApp integration
├── components/
│   └── WhatsAppMessageModal.tsx  # UI modal for sending messages
supabase/
└── functions/
    └── send-whatsapp/
        └── index.ts           # Edge Function (secure API proxy)
```

## Environment Variables

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_WHATSAPP_API_ENABLED` | Enable WhatsApp Business API | `false` |
| `VITE_SUPABASE_URL` | Supabase project URL | Required |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | Required |

### Supabase Secrets (server-side only)

| Secret | Description |
|--------|-------------|
| `WHATSAPP_ACCESS_TOKEN` | Meta System User access token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID |

## Rate Limiting

WhatsApp Business API rate limits:

| Tier | Unique Contacts/Day | How to Upgrade |
|------|---------------------|----------------|
| Tier 1 (New) | 1,000 | Send 2x current limit in 7 days |
| Tier 2 | 10,000 | Send 2x current limit in 7 days |
| Tier 3 | 100,000 | Send 2x current limit in 7 days |
| Tier 4 | Unlimited | Automatic after Tier 3 |

## Pricing

WhatsApp Business API uses conversation-based pricing:

- **Utility conversations**: ~$0.005–$0.02
- **Marketing conversations**: ~$0.02–$0.08
- **Service conversations** (user-initiated): Free (first 1,000/month)

Check current pricing at [Meta's pricing page](https://developers.facebook.com/docs/whatsapp/pricing/).

## Troubleshooting

### "WhatsApp API is not configured"

→ Set the Supabase secrets:
```bash
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_token
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

### "Failed to send WhatsApp message" (Error 131030)

→ You're trying to send a free-form text to a number that hasn't messaged you first. Use a **template message** instead.

### "Invalid phone number" 

→ Ensure the number is in international format without the `+` prefix (e.g., `919876543210`).

### Edge Function not found (404)

→ Deploy the function:
```bash
supabase functions deploy send-whatsapp
```

### Messages not being received

1. Check the phone number is registered on WhatsApp
2. Verify your access token hasn't expired
3. Check Supabase Edge Function logs: `supabase functions logs send-whatsapp`
4. Check Meta's WhatsApp Manager for delivery status

## Security

🔒 **Best Practices:**

1. **Access token is server-side only** — Stored as Supabase secret, never in `.env` or client code
2. **CORS configured** — Edge Function only accepts POST requests
3. **Input validation** — Phone numbers and messages validated before API call
4. **Error messages sanitized** — Internal API errors not leaked to the client
5. **Never commit secrets** — Use `supabase secrets set` for sensitive values

---

**Happy messaging! 📱💒**
