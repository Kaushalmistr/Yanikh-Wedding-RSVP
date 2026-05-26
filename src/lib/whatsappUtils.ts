/**
 * WhatsApp Direct Messaging Utilities
 *
 * Handles WhatsApp Web/App integration for sending direct messages.
 * Uses wa.me URL scheme for client-side messaging.
 *
 * This implementation is designed to be modular and upgradeable:
 * - Phase 1 (Current): WhatsApp Web URL scheme (client-side)
 * - Phase 2 (Future): WhatsApp Business API (server-side)
 * - Phase 3 (Future): Template management and bulk sending
 */

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
