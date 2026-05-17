# WhatsApp Integration Documentation

## Overview

This Wedding RSVP system now includes WhatsApp messaging integration that automatically sends wedding invitations to guests when they are uploaded to the system.

## Features

✅ **Automatic WhatsApp Messaging** - Send invitations when uploading guest lists  
✅ **Status Tracking** - Track delivery status (Success, Pending, Failed, Not Sent)  
✅ **Number Validation** - Check if phone numbers are on WhatsApp  
✅ **Custom Message Templates** - Personalized messages with event details  
✅ **Bulk Messaging** - Send to multiple guests at once  
✅ **Status Column** - View WhatsApp delivery status in guest list table  

## Guest List Table - WhatsApp Status Column

The guest list table now includes a **"WhatsApp Status"** column with the following indicators:

| Status | Display | Description |
|--------|---------|-------------|
| **Success** | ✓ Sent (Green) | Message delivered successfully |
| **Pending** | ⏳ Pending (Yellow) | Number not on WhatsApp or awaiting delivery |
| **Failed** | ✗ Failed (Red) | Failed to send message |
| **Not Sent** | — Not Sent (Gray) | Message not sent yet |

## How It Works

### 1. Guest Upload Flow

When you upload a guest list (CSV/Excel):

1. Guests are added to the database
2. System checks if phone numbers are on WhatsApp
3. WhatsApp invitations are sent to valid numbers
4. Status is updated for each guest
5. Results are displayed in the guest list table

### 2. Message Template

Each guest receives a personalized message like this:

```
🎊 *Wedding Invitation* 🎊

Dear [Guest Name],

You're cordially invited to [Bride & Groom Names]!

📅 Date: [Wedding Date]
📍 Venue: [Venue Location]

📋 Functions you're invited to:
• Mehendi
• Sangeet
• Wedding Ceremony

Please confirm your attendance by filling out the RSVP form.

We look forward to celebrating with you! 💒✨

With warm regards,
The [Couple Name] Family
```

## Implementation Details

### Current Implementation (Mock)

The current implementation uses **mock WhatsApp API calls** for demonstration purposes:

- ✅ Simulates message sending with realistic delays
- ✅ 80% of numbers are assumed to be on WhatsApp
- ✅ 90% success rate for message delivery
- ✅ Tracks all statuses properly

### Production Integration

For **production deployment**, integrate with one of these services:

#### Option 1: Twilio WhatsApp API (Recommended)

```typescript
// Example implementation in src/lib/whatsappService.ts

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(data: WhatsAppMessage) {
  try {
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
      to: `whatsapp:${data.to}`,
      body: data.message,
    });
    
    return {
      success: true,
      status: 'Success',
      messageId: message.sid,
    };
  } catch (error) {
    return {
      success: false,
      status: 'Failed',
      error: error.message,
    };
  }
}
```

**Setup Steps:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get WhatsApp API access
3. Add credentials to `.env` file:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```
4. Replace mock implementation in `src/lib/whatsappService.ts`

#### Option 2: WhatsApp Business API

Contact Meta to get WhatsApp Business API access:
- [WhatsApp Business Platform](https://business.whatsapp.com/)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)

#### Option 3: Other Providers

- **MessageBird** - https://messagebird.com/
- **Vonage** - https://www.vonage.com/
- **Plivo** - https://www.plivo.com/

## Usage

### Using the Upload Service

```typescript
import { uploadGuestsWithWhatsApp } from './lib/guestUploadService';

// Upload guests with WhatsApp messaging
const result = await uploadGuestsWithWhatsApp(
  guestList,
  eventId,
  true // sendWhatsApp = true
);

console.log('Upload Results:', result);
// {
//   success: true,
//   totalGuests: 50,
//   uploadedGuests: [...],
//   whatsappResults: {
//     sent: 40,
//     pending: 5,
//     failed: 3,
//     notSent: 2
//   }
// }
```

### Updating Guest WhatsApp Status

```typescript
import { updateGuestWhatsAppStatus } from './lib/db';

// Update status after sending
updateGuestWhatsAppStatus(
  guestId,
  'Success', // or 'Pending', 'Failed', 'Not Sent'
  new Date().toISOString()
);
```

### Customizing Message Template

Edit the `generateGuestMessage` function in `src/lib/whatsappService.ts`:

```typescript
export function generateGuestMessage(
  guestName: string,
  eventName: string,
  eventDate: string,
  venue: string,
  functions: string[]
): string {
  // Customize your message template here
  return `Your custom message...`;
}
```

## API Reference

### WhatsApp Service (`src/lib/whatsappService.ts`)

#### `sendWhatsAppMessage(data: WhatsAppMessage)`
Send a single WhatsApp message.

**Parameters:**
- `data.to` - Phone number in international format (+919876543210)
- `data.message` - Message content
- `data.eventName` - Optional event name
- `data.guestName` - Optional guest name

**Returns:** `Promise<WhatsAppResponse>`

#### `sendBulkWhatsAppMessages(messages: WhatsAppMessage[])`
Send messages to multiple recipients.

**Returns:** `Promise<Array<WhatsAppResponse>>`

#### `formatPhoneNumber(mobile: string, countryCode?: string)`
Format phone number to international format.

**Returns:** `string` (e.g., +919876543210)

#### `isNumberOnWhatsApp(phoneNumber: string)`
Check if a number is on WhatsApp.

**Returns:** `Promise<boolean>`

### Guest Upload Service (`src/lib/guestUploadService.ts`)

#### `uploadGuestsWithWhatsApp(guestList, eventId, sendWhatsApp?)`
Upload guests and send WhatsApp invitations.

**Parameters:**
- `guestList` - Array of guests to upload
- `eventId` - Event ID
- `sendWhatsApp` - Whether to send WhatsApp messages (default: true)

**Returns:** `Promise<GuestUploadResult>`

### Database Functions (`src/lib/db.ts`)

#### `updateGuestWhatsAppStatus(guestId, status, sentAt?)`
Update WhatsApp delivery status for a guest.

#### `addGuestsBulkWithWhatsApp(guestList, eventId, sendWhatsApp?)`
Add guests in bulk with WhatsApp support.

## Testing

### Mock Mode (Current)

The current implementation is in **mock mode** - it simulates WhatsApp API calls without actually sending messages. Perfect for development and testing!

To test:
1. Upload a guest list via the UI
2. Check the "WhatsApp Status" column in the guest list table
3. View browser console for mock message logs

### Production Testing

Before going live:
1. ✅ Test with real WhatsApp numbers
2. ✅ Verify message delivery
3. ✅ Check rate limits and quotas
4. ✅ Test error handling
5. ✅ Verify status updates

## Rate Limiting

Be mindful of WhatsApp API rate limits:

- **Twilio**: 
  - 1 message per second (free tier)
  - Higher limits available on paid plans
- **WhatsApp Business API**:
  - Tier-based messaging limits
  - Starts at 1,000 messages/day

Add delays between messages in bulk sending (already implemented with 300ms delay).

## Troubleshooting

### Messages not sending?

1. **Check phone number format** - Must be in international format (+91...)
2. **Verify API credentials** - Check your .env file
3. **Check API quota** - Ensure you haven't hit rate limits
4. **Review logs** - Check browser/server console for errors

### Status showing "Pending"?

This means:
- Number is not on WhatsApp, OR
- Message is queued for delivery

### Status showing "Failed"?

This can happen due to:
- Invalid phone number
- API errors
- Network issues
- Number blocked by WhatsApp

## Security Considerations

🔒 **Best Practices:**

1. **Never commit API keys** - Use environment variables
2. **Validate phone numbers** - Before sending messages
3. **Rate limiting** - Prevent API abuse
4. **User consent** - Ensure guests have opted in for messages
5. **GDPR compliance** - Handle phone numbers securely

## Costs

### Twilio WhatsApp Pricing (as of 2024)

- **Conversation-based pricing**: $0.005 - $0.05 per conversation
- **Free trial**: $15 credit to test
- **Volume discounts**: Available for high-volume senders

### Other Providers

Check current pricing on respective provider websites.

## Support

For WhatsApp integration issues:
- Twilio Support: https://support.twilio.com/
- WhatsApp Business: https://business.whatsapp.com/support

## Future Enhancements

Potential improvements:
- [ ] Retry failed messages automatically
- [ ] Schedule messages for specific times
- [ ] Message templates with rich media (images, PDFs)
- [ ] Delivery receipts and read confirmations
- [ ] Two-way messaging (guest replies)
- [ ] WhatsApp chatbot integration

---

**Happy messaging! 📱💒**
