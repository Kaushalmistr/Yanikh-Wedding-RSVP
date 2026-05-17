/**
 * Guest Upload with WhatsApp Integration
 * Handles bulk guest upload and WhatsApp message sending
 */

import { sendBulkWhatsAppMessages, generateGuestMessage, type WhatsAppMessage } from './whatsappService';
import { addGuestsBulkWithWhatsApp, getEventById, updateGuestWhatsAppStatus, type Guest } from './db';

export interface GuestUploadResult {
  success: boolean;
  totalGuests: number;
  uploadedGuests: Guest[];
  whatsappResults?: {
    sent: number;
    pending: number;
    failed: number;
    notSent: number;
  };
  errors?: string[];
}

/**
 * Upload guests and send WhatsApp invitations
 * @param guestList - List of guests to upload
 * @param eventId - Event ID
 * @param sendWhatsApp - Whether to send WhatsApp messages (default: true)
 * @returns Promise<GuestUploadResult>
 */
export async function uploadGuestsWithWhatsApp(
  guestList: Omit<Guest, 'id' | 'submittedAt'>[],
  eventId: string,
  sendWhatsApp: boolean = true
): Promise<GuestUploadResult> {
  try {
    // Add guests to database
    const uploadedGuests = addGuestsBulkWithWhatsApp(guestList, eventId, sendWhatsApp);
    
    if (!sendWhatsApp) {
      return {
        success: true,
        totalGuests: uploadedGuests.length,
        uploadedGuests,
      };
    }
    
    // Get event details for message template
    const event = getEventById(eventId);
    if (!event) {
      return {
        success: false,
        totalGuests: 0,
        uploadedGuests: [],
        errors: ['Event not found'],
      };
    }
    
    // Prepare WhatsApp messages
    const whatsappMessages: WhatsAppMessage[] = uploadedGuests.map(guest => {
      // Get functions the guest is attending
      const attendingFunctions = Object.entries(guest.functionAttendance)
        .filter(([_, attending]) => attending === 'Yes')
        .map(([funcName]) => funcName);
      
      const message = generateGuestMessage(
        guest.name,
        `${event.groomName} & ${event.brideName}`,
        new Date(event.weddingDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        event.venue,
        attendingFunctions
      );
      
      return {
        to: guest.mobile,
        message,
        eventName: `${event.groomName} & ${event.brideName}`,
        guestName: guest.name,
      };
    });
    
    // Send WhatsApp messages
    console.log(`📱 Sending WhatsApp messages to ${whatsappMessages.length} guests...`);
    const whatsappResponses = await sendBulkWhatsAppMessages(whatsappMessages);
    
    // Update guest WhatsApp statuses
    let sent = 0;
    let pending = 0;
    let failed = 0;
    let notSent = 0;
    
    whatsappResponses.forEach((response, index) => {
      const guest = uploadedGuests[index];
      updateGuestWhatsAppStatus(guest.id, response.status, new Date().toISOString());
      
      if (response.status === 'Success') sent++;
      else if (response.status === 'Pending') pending++;
      else if (response.status === 'Failed') failed++;
      else notSent++;
    });
    
    console.log(`✅ WhatsApp messages sent: ${sent}, Pending: ${pending}, Failed: ${failed}`);
    
    return {
      success: true,
      totalGuests: uploadedGuests.length,
      uploadedGuests,
      whatsappResults: {
        sent,
        pending,
        failed,
        notSent,
      },
    };
  } catch (error) {
    console.error('Error uploading guests with WhatsApp:', error);
    return {
      success: false,
      totalGuests: 0,
      uploadedGuests: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Retry sending WhatsApp message to specific guests
 * @param guestIds - Array of guest IDs
 * @param eventId - Event ID
 * @returns Promise with retry results
 */
export async function retryWhatsAppForGuests(
  guestIds: string[],
  eventId: string
): Promise<{ success: number; failed: number }> {
  const event = getEventById(eventId);
  if (!event) {
    return { success: 0, failed: guestIds.length };
  }
  
  let success = 0;
  let failed = 0;
  
  // Note: In a real implementation, you'd fetch the guests from DB
  // For now, this is a placeholder
  console.log(`Retrying WhatsApp for ${guestIds.length} guests...`);
  
  return { success, failed };
}
