/**
 * WhatsApp Messaging Utilities
 *
 * Handles WhatsApp messaging via two methods:
 * - Phase 1: WhatsApp Web URL scheme (client-side, manual send)
 * - Phase 2 (Current): WhatsApp Business Cloud API via Supabase Edge Function (auto-send)
 *
 * The API method sends messages automatically without user intervention.
 * Falls back to the wa.me URL scheme if the API is not configured.
 */

import { supabase } from './supabase';

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * Check if WhatsApp Business API is enabled
 * Set VITE_WHATSAPP_API_ENABLED=true in .env to enable
 */
export function isWhatsAppAPIEnabled(): boolean {
  return import.meta.env.VITE_WHATSAPP_API_ENABLED === 'true';
}

// ─── WhatsApp Business Cloud API (Auto-Send) ────────────────────────────────

export interface WhatsAppAPIResponse {
  success: boolean;
  messageId?: string;
  contactWaId?: string;
  error?: string;
  errorCode?: number;
  details?: unknown;
}

/**
 * Send a WhatsApp message via the Business Cloud API (Supabase Edge Function).
 * The message is sent automatically — no manual interaction required.
 *
 * @param phoneNumber - Phone number in international format (e.g., +919876543210 or 919876543210)
 * @param message - Message text to send
 * @returns Promise<WhatsAppAPIResponse>
 *
 * @example
 * const result = await sendWhatsAppViaAPI('+919876543210', 'Hello!');
 * if (result.success) {
 *   console.log('Sent!', result.messageId);
 * }
 */
export async function sendWhatsAppViaAPI(
  phoneNumber: string,
  message: string
): Promise<WhatsAppAPIResponse> {
  try {
    // Clean the phone number — keep only digits
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 7) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    if (!message.trim()) {
      return {
        success: false,
        error: 'Message cannot be empty',
      };
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: cleanPhone,
        message: message,
        type: 'text',
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to call WhatsApp API',
      };
    }

    // The Edge Function returns a JSON body
    return data as WhatsAppAPIResponse;
  } catch (error) {
    console.error('Error sending WhatsApp via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send a template-based WhatsApp message via the Business Cloud API.
 * Templates are required for first-contact outreach (e.g., wedding invitations).
 *
 * @param phoneNumber - Phone number in international format
 * @param templateName - Pre-approved template name from Meta Business Manager
 * @param languageCode - Template language code (default: 'en_US')
 * @param components - Template component parameters (for variable substitution)
 * @returns Promise<WhatsAppAPIResponse>
 */
export async function sendWhatsAppTemplate(
  phoneNumber: string,
  templateName: string,
  languageCode: string = 'en_US',
  components?: Array<{
    type: string;
    parameters: Array<{ type: string; text?: string }>;
  }>
): Promise<WhatsAppAPIResponse> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: cleanPhone,
        templateName,
        languageCode,
        components,
        type: 'template',
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to call WhatsApp API',
      };
    }

    return data as WhatsAppAPIResponse;
  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ─── WhatsApp Web URL Scheme (Fallback) ─────────────────────────────────────

/**
 * Generate WhatsApp Web link with prefilled message
 * @param phoneNumber - Phone number in international format (e.g., +919876543210 or 919876543210)
 * @param message - Message text to prefill
 * @returns WhatsApp Web URL
 *
 * Example:
 * generateWhatsAppWebLink('+919876543210', 'Hello World')
 * => 'https://wa.me/919876543210?text=Hello%20World'
 */
export function generateWhatsAppWebLink(phoneNumber: string, message: string): string {
  // Remove any non-digit characters and + prefix from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // URL encode the message
  const encodedMessage = encodeURIComponent(message);

  // Generate wa.me link
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp Web/App with prefilled message in a new window
 * @param phoneNumber - Phone number in international format
 * @param message - Message text to prefill
 * @param target - Window target (default: '_blank')
 *
 * Note: The browser/device will handle which app opens:
 * - Desktop: Opens WhatsApp Web if browser supports it
 * - Mobile: Opens WhatsApp app if installed
 */
export function openWhatsAppWeb(
  phoneNumber: string,
  message: string,
  target: string = '_blank'
): void {
  try {
    const url = generateWhatsAppWebLink(phoneNumber, message);
    window.open(url, target);
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    throw new Error('Failed to open WhatsApp. Please try again.');
  }
}

/**
 * Validate phone number format for WhatsApp
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidWhatsAppNumber(phoneNumber: string): boolean {
  // Must have at least 7 digits (minimum valid phone number)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return cleanPhone.length >= 7 && cleanPhone.length <= 15;
}
