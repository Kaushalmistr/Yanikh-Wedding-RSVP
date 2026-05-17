/**
 * WhatsApp Service Integration
 * 
 * This service handles WhatsApp messaging for the Wedding RSVP system.
 * Currently using a mock implementation for demonstration.
 * 
 * For production, integrate with:
 * - Twilio WhatsApp API (https://www.twilio.com/whatsapp)
 * - WhatsApp Business API
 * - Other WhatsApp service providers
 */

import { formatMobileForWhatsApp } from './constants';

export interface WhatsAppMessage {
  to: string; // Phone number (e.g., 9876543210)
  countryCode?: string; // Country code (e.g., 'IN', 'US')
  message: string;
  eventName?: string;
  guestName?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  status: 'Success' | 'Failed' | 'Pending';
  messageId?: string;
  error?: string;
}

/**
 * Format phone number to international format
 * @param mobile - Phone number (e.g., 9876543210)
 * @param countryCode - Country code (e.g., 'IN' for India, 'US' for United States)
 * @returns Formatted phone number (e.g., +919876543210)
 * @deprecated Use formatMobileForWhatsApp from constants.ts instead
 */
export function formatPhoneNumber(mobile: string, countryCode: string = 'IN'): string {
  return formatMobileForWhatsApp(mobile, countryCode);
}

/**
 * Check if a phone number is on WhatsApp
 * Note: In production, use WhatsApp Business API to verify
 * @param phoneNumber - Phone number in international format
 * @returns Promise<boolean>
 */
export async function isNumberOnWhatsApp(phoneNumber: string): Promise<boolean> {
  // Mock implementation
  // In production, use WhatsApp Business API or Twilio to verify
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock logic: 80% of numbers are on WhatsApp
  // In production, replace this with actual API call
  return Math.random() > 0.2;
}

/**
 * Send WhatsApp message
 * @param data - WhatsApp message data
 * @returns Promise<WhatsAppResponse>
 */
export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    // Format phone number using country code if provided
    const formattedNumber = data.countryCode 
      ? formatMobileForWhatsApp(data.to, data.countryCode)
      : formatPhoneNumber(data.to); // Fallback to default
    
    // Check if number is on WhatsApp
    const isOnWhatsApp = await isNumberOnWhatsApp(formattedNumber);
    
    if (!isOnWhatsApp) {
      return {
        success: false,
        status: 'Pending',
        error: 'Number not on WhatsApp',
      };
    }
    
    // Mock WhatsApp API call
    // In production, replace this with actual Twilio/WhatsApp API integration
    
    /*
    // Example Twilio Integration:
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio WhatsApp number
      body: data.message,
      to: `whatsapp:${formattedNumber}`
    });
    
    return {
      success: true,
      status: 'Success',
      messageId: message.sid,
    };
    */
    
    // Mock successful send
    console.log(`📱 WhatsApp Mock: Sending message to ${formattedNumber}`);
    console.log(`Message: ${data.message}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success (90% success rate)
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        status: 'Success',
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        status: 'Failed',
        error: 'Failed to deliver message',
      };
    }
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      status: 'Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send bulk WhatsApp messages to multiple guests
 * @param messages - Array of WhatsApp messages
 * @returns Promise with results for each message
 */
export async function sendBulkWhatsAppMessages(
  messages: WhatsAppMessage[]
): Promise<Array<WhatsAppResponse & { to: string; guestName?: string }>> {
  const results = [];
  
  for (const message of messages) {
    const response = await sendWhatsAppMessage(message);
    results.push({
      ...response,
      to: message.to,
      guestName: message.guestName,
    });
    
    // Add small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

/**
 * Generate WhatsApp message template for guest
 * @param guestName - Name of the guest
 * @param eventName - Name of the wedding event
 * @param eventDate - Date of the event
 * @param venue - Venue location
 * @param functions - List of functions guest is attending
 * @returns Formatted message string
 */
export function generateGuestMessage(
  guestName: string,
  eventName: string,
  eventDate: string,
  venue: string,
  functions: string[]
): string {
  const functionsText = functions.length > 0 
    ? `\n\n📋 Functions you're invited to:\n${functions.map(f => `• ${f}`).join('\n')}`
    : '';
  
  return `🎊 *Wedding Invitation* 🎊

Dear ${guestName},

You're cordially invited to ${eventName}!

📅 Date: ${eventDate}
📍 Venue: ${venue}${functionsText}

Please confirm your attendance by filling out the RSVP form.

We look forward to celebrating with you! 💒✨

With warm regards,
The ${eventName} Family`;
}
