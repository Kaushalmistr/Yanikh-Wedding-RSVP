import { useState, useEffect } from 'react';
import { X, CheckCircle, Smartphone, QrCode } from 'lucide-react';

export interface WhatsAppSender {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'Connected' | 'Disconnected';
}

interface SelectSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSender: (sender: WhatsAppSender) => void;
}

export default function SelectSenderModal({
  isOpen,
  onClose,
  onSelectSender,
}: SelectSenderModalProps) {
  // Senders list with local state to handle connection persistence
  const [senders, setSenders] = useState<WhatsAppSender[]>(() => {
    const senderName = import.meta.env.VITE_WHATSAPP_SENDER_NAME || 'Planorama';
    const rawNumber = import.meta.env.VITE_WHATSAPP_SENDER_NUMBER || '9820191916';
    
    // Format number nicely
    const cleanNum = rawNumber.replace(/\D/g, '');
    const formattedNumber = cleanNum.length === 10 ? `+91 ${cleanNum}` : `+${cleanNum}`;

    return [
      {
        id: 'primary',
        name: senderName.charAt(0).toUpperCase() + senderName.slice(1),
        phoneNumber: formattedNumber,
        status: 'Connected',
      },
      {
        id: 'secondary',
        name: 'Secondary Account',
        phoneNumber: 'Link a secondary device',
        status: 'Disconnected',
      },
    ];
  });

  const [showPairingUI, setShowPairingUI] = useState(false);
  const [pairingSenderId, setPairingSenderId] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState<'scan' | 'connecting' | 'success'>('scan');

  // Load persistence for secondary connection state
  useEffect(() => {
    const isSecondaryConnected = localStorage.getItem('whatsapp_sender_secondary_connected') === 'true';
    if (isSecondaryConnected) {
      setSenders((prev) =>
        prev.map((s) => (s.id === 'secondary' ? { ...s, status: 'Connected' } : s))
      );
    }
  }, []);

  if (!isOpen) return null;

  const handleSenderClick = (sender: WhatsAppSender) => {
    if (sender.status === 'Connected') {
      onSelectSender(sender);
    } else {
      // Open pairing UI for disconnected sender
      setPairingSenderId(sender.id);
      setPairingStep('scan');
      setShowPairingUI(true);
    }
  };

  const startSimulatePairing = () => {
    setPairingStep('connecting');
    setTimeout(() => {
      setPairingStep('success');
      // Update local state & persist
      if (pairingSenderId) {
        setSenders((prev) =>
          prev.map((s) => (s.id === pairingSenderId ? { ...s, status: 'Connected' } : s))
        );
        localStorage.setItem(`whatsapp_sender_${pairingSenderId}_connected`, 'true');
      }
    }, 2500); // 2.5s simulation delay
  };

  const handleSelectNewlyConnected = () => {
    const sender = senders.find((s) => s.id === pairingSenderId);
    setShowPairingUI(false);
    setPairingSenderId(null);
    if (sender) {
      onSelectSender({ ...sender, status: 'Connected' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100">
        {!showPairingUI ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Select Sender's WhatsApp</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {senders.map((sender) => {
                  const isConnected = sender.status === 'Connected';
                  return (
                    <button
                      key={sender.id}
                      onClick={() => handleSenderClick(sender)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 group ${
                        isConnected
                          ? 'border-gray-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 bg-white'
                          : 'border-gray-200 hover:border-red-400 hover:bg-red-50/20 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Profile Avatar Icon */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 transition-transform group-hover:scale-105 ${
                            isConnected
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-600'
                              : 'bg-gradient-to-br from-gray-400 to-slate-500'
                          }`}
                        >
                          {sender.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-base">{sender.name}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{sender.phoneNumber}</p>
                        </div>
                      </div>

                      {/* Connection Badge */}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {sender.status}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-6 text-center">
                Select an active connected sender device to proceed with composing your invitation message.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Pairing QR Code Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-800">
                  Link {senders.find((s) => s.id === pairingSenderId)?.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowPairingUI(false);
                  setPairingSenderId(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pairing QR Code Body */}
            <div className="p-6 flex flex-col md:flex-row items-center gap-8">
              {/* Left Column: Instructions */}
              <div className="flex-1 space-y-4 text-gray-600">
                <p className="font-semibold text-gray-800">Instructions:</p>
                <ol className="list-decimal list-inside space-y-2.5 text-sm">
                  <li>
                    Open <span className="font-medium text-emerald-600">WhatsApp</span> on your phone.
                  </li>
                  <li>
                    Tap <span className="font-medium text-gray-800">Menu</span> or{' '}
                    <span className="font-medium text-gray-800">Settings</span> and select{' '}
                    <span className="font-medium text-gray-800">Linked Devices</span>.
                  </li>
                  <li>
                    Tap <span className="font-medium text-emerald-600">Link a Device</span>.
                  </li>
                  <li>
                    Point your camera at this QR code to scan it.
                  </li>
                </ol>

                {pairingStep === 'scan' && (
                  <button
                    onClick={startSimulatePairing}
                    className="w-full mt-4 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm hover:shadow active:scale-95"
                  >
                    Simulate Camera Scan QR
                  </button>
                )}
              </div>

              {/* Right Column: QR Code visualization */}
              <div className="w-64 h-64 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center p-6 relative overflow-hidden shadow-inner flex-shrink-0">
                {pairingStep === 'scan' && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative border-4 border-emerald-500 rounded-lg p-2 bg-white shadow-md animate-pulse">
                      <QrCode className="w-36 h-36 text-gray-800" />
                      {/* Laser scanning line animation */}
                      <div className="absolute left-0 right-0 h-1 bg-emerald-500 top-0 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 animate-pulse mt-1">
                      Awaiting connection...
                    </span>
                  </div>
                )}

                {pairingStep === 'connecting' && (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    {/* Ring loader */}
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    <div>
                      <p className="font-bold text-gray-800">Connecting...</p>
                      <p className="text-xs text-gray-500 mt-1">Establishing secure connection</p>
                    </div>
                  </div>
                )}

                {pairingStep === 'success' && (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-800">Device Linked!</p>
                      <p className="text-xs text-emerald-600 mt-1">Active and ready to send</p>
                    </div>
                    <button
                      onClick={handleSelectNewlyConnected}
                      className="mt-2 py-1.5 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      Use Connected Sender
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
