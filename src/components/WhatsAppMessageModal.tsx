import { useState, useEffect } from 'react';
import { Send, X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatMobileForDisplay } from '../lib/constants';
import {
  isWhatsAppAPIEnabled,
  sendWhatsAppViaAPI,
  openWhatsAppWeb,
  isValidWhatsAppNumber,
  replacePlaceholders,
} from '../lib/whatsappUtils';
import { formatMobileForWhatsApp } from '../lib/constants';
import type { Guest } from '../lib/db';
import type { WhatsAppSender } from './SelectSenderModal';

interface WhatsAppMessageModalProps {
  guest: Guest;
  sender: WhatsAppSender;
  isOpen: boolean;
  onClose: () => void;
  onMessageSent?: (guestId: string, success: boolean) => void;
  initialMessage?: string;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error' | 'fallback';

export default function WhatsAppMessageModal({
  guest,
  sender,
  isOpen,
  onClose,
  onMessageSent,
  initialMessage = '',
}: WhatsAppMessageModalProps) {
  const [messageText, setMessageText] = useState(initialMessage);
  const [error, setError] = useState('');
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const apiEnabled = isWhatsAppAPIEnabled();

  // Update message when initialMessage changes (e.g., from composer modal)
  useEffect(() => {
    if (isOpen && initialMessage) {
      setMessageText(initialMessage);
    }
  }, [isOpen, initialMessage]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    setError('');
    setStatusMessage('');

    // Validate message
    if (!messageText.trim()) {
      setError('Please enter a message');
      return;
    }

    // Format phone number
    const formattedPhone = formatMobileForWhatsApp(
      guest.mobile,
      guest.countryCode || 'IN'
    );

    // Validate phone number
    if (!isValidWhatsAppNumber(formattedPhone)) {
      setError('Invalid phone number format');
      return;
    }

    // Replace dynamic placeholders with actual guest information
    const processedMessage = replacePlaceholders(
      messageText,
      guest.name,
      guest.id
    );

    if (apiEnabled) {
      // ── WhatsApp Business API (auto-send) ──
      try {
        setSendStatus('sending');

        const result = await sendWhatsAppViaAPI(formattedPhone, processedMessage);

        if (result.success) {
          setSendStatus('success');
          setStatusMessage(`Message delivered! (ID: ${result.messageId?.slice(0, 12)}...)`);
          onMessageSent?.(guest.id, true);

          // Auto-close after 2 seconds
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else {
          setSendStatus('error');
          setError(result.error || 'Failed to send message');
          setStatusMessage('');
          onMessageSent?.(guest.id, false);
        }
      } catch (err) {
        setSendStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to send WhatsApp message');
        onMessageSent?.(guest.id, false);
      }
    } else {
      // ── Fallback: Open WhatsApp Web with prefilled message ──
      try {
        setSendStatus('fallback');
        openWhatsAppWeb(formattedPhone, processedMessage);
        setStatusMessage('WhatsApp Web opened — press Send in WhatsApp to deliver.');

        // Close modal after a short delay to allow the window to open
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (err) {
        setSendStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to open WhatsApp');
      }
    }
  };

  const handleClose = () => {
    setMessageText('');
    setError('');
    setSendStatus('idle');
    setStatusMessage('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const isBusy = sendStatus === 'sending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-6 h-6" />
            WhatsApp Message
            {apiEnabled && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">
                Auto-Send
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            disabled={isBusy}
            className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Success Banner */}
          {sendStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Message sent successfully!</p>
                <p className="text-green-700 text-sm mt-0.5">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Failed to send</p>
                <p className="text-red-700 text-sm mt-0.5">{error}</p>
                {apiEnabled && (
                  <button
                    onClick={() => {
                      // Fallback to wa.me
                      const formattedPhone = formatMobileForWhatsApp(
                        guest.mobile,
                        guest.countryCode || 'IN'
                      );
                      const processedMsg = replacePlaceholders(messageText, guest.name, guest.id);
                      openWhatsAppWeb(formattedPhone, processedMsg);
                      setStatusMessage('Opened WhatsApp Web as fallback.');
                      setSendStatus('fallback');
                      setError('');
                    }}
                    className="mt-2 text-sm text-red-700 underline hover:text-red-900 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in WhatsApp Web instead
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Fallback Status */}
          {sendStatus === 'fallback' && statusMessage && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <p className="text-blue-700 text-sm">{statusMessage}</p>
            </div>
          )}

          {/* Guest and Sender Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Guest Info */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-2">
                Sending to:
              </p>
              <div className="space-y-1">
                <p className="text-green-800 font-semibold">{guest.name}</p>
                <p className="text-green-700 text-sm">
                  📱 {formatMobileForDisplay(guest.mobile, guest.countryCode || 'IN')}
                </p>
                {guest.email && (
                  <p className="text-green-700 text-sm">
                    📧 {guest.email}
                  </p>
                )}
              </div>
            </div>

            {/* Sender Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Sending via:
              </p>
              <div className="space-y-1">
                <p className="text-blue-800 font-semibold">{sender.name}</p>
                <p className="text-blue-700 text-sm">
                  📱 {sender.phoneNumber}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {sender.status}
                </span>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              rows={8}
              disabled={isBusy || sendStatus === 'success'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {messageText.length > 0 && `${messageText.length} characters`}
            </p>
          </div>

          {/* Info Box */}
          <div className={`rounded-lg p-3 border ${apiEnabled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-xs ${apiEnabled ? 'text-green-700' : 'text-blue-700'}`}>
              {apiEnabled ? (
                <>
                  <strong>✅ WhatsApp Business API enabled</strong> — Your message will be sent
                  automatically. The guest will receive it directly on WhatsApp without any manual steps.
                </>
              ) : (
                <>
                  <strong>💡 Tip:</strong> This will open WhatsApp Web (or the app on mobile) with your message prefilled.
                  You'll need to press <strong>Enter</strong> or click <strong>Send</strong> in WhatsApp to deliver the message — this is a WhatsApp security requirement.
                  <br />
                  <span className="mt-1 block text-blue-600">
                    To enable auto-send, configure the WhatsApp Business API. See WHATSAPP_INTEGRATION.md for details.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={handleClose}
            disabled={isBusy}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendStatus === 'success' ? 'Close' : 'Cancel'}
          </button>
          {sendStatus !== 'success' && (
            <button
              onClick={handleSendMessage}
              disabled={isBusy || !messageText.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {apiEnabled ? 'Send Message' : 'Send on WhatsApp'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
