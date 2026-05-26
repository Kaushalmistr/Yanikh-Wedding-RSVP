import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { formatMobileForDisplay } from '../lib/constants';
import { openWhatsAppWeb, isValidWhatsAppNumber } from '../lib/whatsappUtils';
import { formatMobileForWhatsApp } from '../lib/constants';
import type { Guest } from '../lib/db';

interface WhatsAppMessageModalProps {
  guest: Guest;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppMessageModal({
  guest,
  isOpen,
  onClose,
}: WhatsAppMessageModalProps) {
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    setError('');

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

    try {
      setIsOpening(true);
      openWhatsAppWeb(formattedPhone, messageText);

      // Close modal after a short delay to allow the window to open
      setTimeout(() => {
        onClose();
        setMessageText('');
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open WhatsApp');
      setIsOpening(false);
    }
  };

  const handleClose = () => {
    setMessageText('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-6 h-6" />
            WhatsApp Message
          </h2>
          <button
            onClick={handleClose}
            disabled={isOpening}
            className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

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
              disabled={isOpening}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {messageText.length > 0 && `${messageText.length} characters`}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>💡 Tip:</strong> The message will open WhatsApp Web or the WhatsApp app on your device.
              You'll be able to review and edit the message before sending.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={handleClose}
            disabled={isOpening}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSendMessage}
            disabled={isOpening || !messageText.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOpening ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Opening...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send on WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
