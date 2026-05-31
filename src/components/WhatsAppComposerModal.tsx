import { useState, useMemo } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { formatMobileForDisplay } from '../lib/constants';
import type { Guest, WeddingEvent } from '../lib/db';
import type { WhatsAppSender } from './SelectSenderModal';

// Message templates for different wedding functions
const MESSAGE_TEMPLATES = {
  greetings: 'Dear {guestName},\n\nWe are delighted to invite you to our wedding celebration! Your presence is essential to make this special day even more memorable.',
  rsvpLink: 'Please confirm your attendance by clicking on the link below:\n\n{rsvpLink}',
  arrival: 'Welcome! Please provide your arrival details including date, time, and preferred pickup location. Click here to update: https://yourweddingsite.com/arrival',
  departure: 'Thank you for celebrating with us! Please share your departure details so we can assist with drop-off arrangements. Update here: https://yourweddingsite.com/departure',
};

interface WhatsAppComposerModalProps {
  guest: Guest;
  event: WeddingEvent;
  sender: WhatsAppSender;
  isOpen: boolean;
  onClose: () => void;
  onCompose: (message: string) => void;
}

type ChipType = 'greetings' | 'rsvpLink' | 'arrival' | 'departure';

const CHIPS: { type: ChipType; label: string; icon: string }[] = [
  { type: 'greetings', label: 'Greetings', icon: '👋' },
  { type: 'rsvpLink', label: 'RSVP Link', icon: '📋' },
  { type: 'arrival', label: 'Arrivals', icon: '✈️' },
  { type: 'departure', label: 'Departures', icon: '🚗' },
];

export default function WhatsAppComposerModal({
  guest,
  event,
  sender,
  isOpen,
  onClose,
  onCompose,
}: WhatsAppComposerModalProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  if (!isOpen) return null;

  const generateRsvpUrl = (): string => {
    // For HashRouter, build URL with hash-based routing
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}#/rsvp/guest/${event.rsvpToken}`;
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    if (template) {
      setMessageText(template);
    } else {
      setMessageText('');
    }
  };

  const handleChipClick = (chipType: ChipType) => {
    const chipContent = MESSAGE_TEMPLATES[chipType];
    if (messageText) {
      setMessageText(messageText + '\n\n' + chipContent);
    } else {
      setMessageText(chipContent);
    }
  };

  const handleSend = () => {
    if (messageText.trim()) {
      onCompose(messageText);
    }
  };

  const handleClose = () => {
    setMessageText('');
    setSelectedTemplate('');
    onClose();
  };

  // Process message to show variables replaced
  const previewMessage = useMemo(() => {
    return messageText
      .replace('{guestName}', guest.name)
      .replace('{rsvpLink}', generateRsvpUrl());
  }, [messageText, guest, event]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Compose Message
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-4">
              {/* Recipient Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Recipient:</p>
                <p className="text-green-800 font-semibold text-sm">{guest.name}</p>
                <p className="text-green-700 text-xs mt-1">
                  {formatMobileForDisplay(guest.mobile, guest.countryCode || 'IN')}
                </p>
              </div>

              {/* Sender Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Sender:</p>
                <p className="text-blue-800 font-semibold text-sm">{sender.name}</p>
                <p className="text-blue-700 text-xs mt-1">{sender.phoneNumber}</p>
              </div>

              {/* Template Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Choose a template...</option>
                  <option value={MESSAGE_TEMPLATES.greetings}>Greeting Message</option>
                  <option value={MESSAGE_TEMPLATES.rsvpLink}>RSVP Link</option>
                  <option value={MESSAGE_TEMPLATES.arrival}>Arrival Details</option>
                  <option value={MESSAGE_TEMPLATES.departure}>Departure Details</option>
                </select>
              </div>

              {/* Quick Action Chips */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
                <div className="space-y-2">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip.type}
                      onClick={() => handleChipClick(chip.type)}
                      className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Message Editor and Preview */}
            <div className="lg:col-span-2 space-y-4">
              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type or select a template to start composing..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {messageText.length > 0 && `${messageText.length} characters`}
                </p>
              </div>

              {/* Mobile Preview */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 max-h-64 overflow-y-auto">
                  {/* WhatsApp-style Chat */}
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center gap-3 text-white">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{guest.name}</p>
                        <p className="text-xs text-green-100">Online</p>
                      </div>
                    </div>

                    {/* Chat Body */}
                    <div className="p-3 min-h-20 max-h-48 overflow-y-auto bg-gray-50">
                      {previewMessage ? (
                        <div className="flex justify-end">
                          <div className="bg-green-500 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-xs text-sm break-words whitespace-pre-wrap">
                            {previewMessage}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs italic text-center py-8">
                          Message preview will appear here
                        </p>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-white px-3 py-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type a message"
                        disabled
                        className="flex-1 text-xs text-gray-400 px-2 py-1 rounded-full bg-gray-100"
                      />
                      <button disabled className="text-gray-300 text-lg">
                        📎
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Next: Send
          </button>
        </div>
      </div>
    </div>
  );
}
