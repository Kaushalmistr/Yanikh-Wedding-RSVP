import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, getRecipientsForMessage, createMessage, getMessagesByEvent, deleteMessage, sendMessage, getGuestsByEvent, findGuestByNameOrEmail, createUploadedGuestList, getUploadedGuestListsByEvent, deleteUploadedGuestList, convertParsedGuestToGuest, addGuestsBulk, type WeddingEvent, type BulkMessage, type Guest } from '../lib/db';
import { parseGuestListFile, generateSampleGuestListCSV, type ParsedGuestData } from '../lib/guestListParser';
import { ArrowLeft, Send, Trash2, MessageSquare, Users, CheckCircle, Loader, Upload, Download, AlertCircle } from 'lucide-react';

const FUNCTIONS = ['Welcome Lunch', 'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Farewell Brunch'];

export default function BulkMessaging() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [messages, setMessages] = useState<BulkMessage[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Preview state
  const [recipientCount, setRecipientCount] = useState(0);
  const [showTab, setShowTab] = useState<'compose' | 'history' | 'auto-detect'>('compose');

  // Auto-detect guest list state
  const [uploadedLists, setUploadedLists] = useState<any[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedGuests, setParsedGuests] = useState<ParsedGuestData[]>([]);
  const [autoSendProgress, setAutoSendProgress] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) setEvent(ev);
      loadMessages();
      loadUploadedLists();
    }
  }, [id]);

  const loadUploadedLists = () => {
    if (id) {
      setUploadedLists(getUploadedGuestListsByEvent(id));
    }
  };

  useEffect(() => {
    if (id && selectedFunctions.length > 0) {
      const recipients = getRecipientsForMessage(id, selectedFunctions);
      setRecipientCount(recipients.length);
    } else {
      setRecipientCount(0);
    }
  }, [selectedFunctions, id]);

  const loadMessages = () => {
    if (id) {
      setMessages(getMessagesByEvent(id));
    }
  };

  const toggleFunction = (func: string) => {
    setSelectedFunctions(prev =>
      prev.includes(func) ? prev.filter(f => f !== func) : [...prev, func]
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Please enter a message title');
      return false;
    }
    if (!content.trim()) {
      setError('Please enter message content');
      return false;
    }
    if (selectedFunctions.length === 0) {
      setError('Please select at least one event/function');
      return false;
    }
    if (recipientCount === 0) {
      setError('No guests found attending the selected functions');
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;

    try {
      createMessage({
        eventId: id!,
        title,
        content,
        selectedFunctions,
        createdBy: 'admin', // In a real app, use actual user ID
        sentAt: undefined,
      });

      setSuccess('Message draft saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setTitle('');
      setContent('');
      setSelectedFunctions([]);
      loadMessages();
      setError('');
    } catch (err) {
      setError('Failed to save message draft');
    }
  };

  const handleSendMessage = (messageId: string) => {
    if (!confirm('Are you sure you want to send this message to all selected guests?')) {
      return;
    }

    setIsSending(true);
    try {
      // Simulate sending delay
      setTimeout(() => {
        sendMessage(messageId);
        setSuccess('Message sent successfully to all recipients!');
        setTimeout(() => setSuccess(''), 3000);
        loadMessages();
        setIsSending(false);
      }, 1500);
    } catch (err) {
      setError('Failed to send message');
      setIsSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      deleteMessage(messageId);
      setSuccess('Message deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadMessages();
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setError('');
    setSuccess('');

    try {
      const parsed = await parseGuestListFile(file);
      setParsedGuests(parsed);
      setSuccess(`Successfully parsed ${parsed.length} guests from the file!`);
      setError('');
    } catch (err) {
      setError('Failed to parse guest list file. Please ensure it\'s a valid Excel or CSV file.');
      setParsedGuests([]);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleAutoSendMessages = async () => {
    if (parsedGuests.length === 0) {
      setError('No guests to process');
      return;
    }

    if (!confirm(`This will add ${parsedGuests.length} guests to your guest list and create/send messages based on their event attendance. Continue?`)) {
      return;
    }

    setIsAutoSending(true);
    setError('');
    setSuccess('');

    try {
      const eventData = getEventById(id!);
      if (!eventData) throw new Error('Event not found');

      // Step 1: Convert parsed guests to Guest objects and add them to database
      const guestObjectsToAdd = convertParsedGuestToGuest(parsedGuests, id!);
      const addedGuests = addGuestsBulk(guestObjectsToAdd);

      // Step 2: Create and send messages for added guests
      let messagesCreated = 0;
      let guestsProcessed = 0;

      for (const parsedGuest of parsedGuests) {
        // Find the matching added guest in the system
        const matchedGuest = addedGuests.find(
          g => g.name.toLowerCase() === parsedGuest.guestName.toLowerCase() ||
               (parsedGuest.email && g.email === parsedGuest.email)
        );

        if (matchedGuest && parsedGuest.attendingEvents.length > 0) {
          // Create and send message for this guest's specific events
          const messageTitle = `Event Update: ${parsedGuest.attendingEvents.join(', ')}`;
          const messageContent = `Dear ${parsedGuest.guestName},\n\nThis is a special update for the events you're attending: ${parsedGuest.attendingEvents.join(', ')}.\n\nWe look forward to seeing you!\n\nBest regards`;

          const msg = createMessage({
            eventId: id!,
            title: messageTitle,
            content: messageContent,
            selectedFunctions: parsedGuest.attendingEvents,
            createdBy: 'admin',
            sentAt: new Date().toISOString(),
            totalRecipients: 1,
            recipientGuestIds: [matchedGuest.id],
            isAutoSent: true,
          });

          messagesCreated++;
        }

        guestsProcessed++;
        setAutoSendProgress(Math.round((guestsProcessed / parsedGuests.length) * 100));

        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSuccess(`Successfully added ${addedGuests.length} guests to your guest list and sent ${messagesCreated} messages!`);
      setParsedGuests([]);
      setAutoSendProgress(0);
      loadMessages();
      loadUploadedLists();

      // Save to uploaded lists
      createUploadedGuestList({
        eventId: id!,
        fileName: 'Guest List (Auto-detected)',
        uploadedAt: new Date().toISOString(),
        processedGuests: guestsProcessed,
        messagesSent: messagesCreated,
        guestData: parsedGuests,
        createdBy: 'admin',
      });
    } catch (err) {
      setError('Failed to auto-send messages: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsAutoSending(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = generateSampleGuestListCSV();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'guest_list_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-rose-600" size={40} />
      </div>
    );
  }

  const sentMessages = messages.filter(m => m.sentAt);
  const draftMessages = messages.filter(m => !m.sentAt);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to={`/event/${id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bulk Messaging</h1>
              <p className="text-gray-500 mt-1">
                {event.groomName} & {event.brideName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setShowTab('compose')}
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                showTab === 'compose'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="inline-block mr-2" size={18} />
              Compose Message
            </button>
            <button
              onClick={() => setShowTab('auto-detect')}
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                showTab === 'auto-detect'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="inline-block mr-2" size={18} />
              Upload & Auto-Send
            </button>
            <button
              onClick={() => setShowTab('history')}
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                showTab === 'history'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="inline-block mr-2" size={18} />
              Message History ({messages.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showTab === 'compose' ? (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Compose Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Compose New Message</h2>

                {/* Title Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mehendi Event Update"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Content Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {content.length} characters
                  </p>
                </div>

                {/* Event Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Events/Functions to Receive This Message *
                  </label>
                  <div className="space-y-2">
                    {FUNCTIONS.map((func) => (
                      <label key={func} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFunctions.includes(func)}
                          onChange={() => toggleFunction(func)}
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="ml-3 text-gray-700">{func}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Send Now
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              {/* Message Preview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Message Preview</h3>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Title</p>
                    <p className="font-semibold text-gray-900">
                      {title || '(No title entered)'}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 uppercase">Content</p>
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">
                      {content || '(No content entered)'}
                    </p>
                  </div>

                  {selectedFunctions.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 uppercase mb-2">
                        Target Events
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFunctions.map((func) => (
                          <span
                            key={func}
                            className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded"
                          >
                            {func}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient Count */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-rose-600" size={24} />
                  <span className="text-sm text-gray-600">Expected Recipients</span>
                </div>
                <p className="text-4xl font-bold text-rose-600">
                  {recipientCount}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {recipientCount === 0
                    ? 'No guests selected'
                    : recipientCount === 1
                      ? 'guest will receive this message'
                      : 'guests will receive this message'}
                </p>
              </div>

              {/* Help */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                  How it works
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Select event functions</li>
                  <li>• Only guests attending those events will receive it</li>
                  <li>• Save as draft or send immediately</li>
                  <li>• Track all messages in History</li>
                </ul>
              </div>
            </div>
          </div>
        ) : showTab === 'auto-detect' ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Guest List & Auto-Send Messages</h2>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">How Auto-Detection Works</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Upload an Excel or CSV file with guest information</li>
                      <li>2. The system identifies which events each guest is attending</li>
                      <li>3. Matches guests in your system by name or email</li>
                      <li>4. Creates and sends event-specific messages automatically</li>
                      <li>5. Each guest receives messages only for their attending events</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  <Download size={18} />
                  Download CSV Template
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Download this template, fill it with your guest data, and upload it
                </p>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                <input
                  type="file"
                  id="guest-file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isParsingFile || isAutoSending}
                  className="hidden"
                />
                <label
                  htmlFor="guest-file"
                  className={`flex flex-col items-center cursor-pointer ${
                    isParsingFile || isAutoSending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                  <span className="text-lg font-semibold text-gray-700 mb-1">
                    Drop your file here or click to browse
                  </span>
                  <span className="text-sm text-gray-500">
                    Supports Excel (.xlsx, .xls) and CSV files
                  </span>
                </label>
              </div>

              {/* Parsed Guests Display */}
              {parsedGuests.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Detected {parsedGuests.length} Guest(s)
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {parsedGuests.map((guest, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-medium text-gray-900">{guest.guestName}</div>
                        <div className="text-sm text-gray-600">
                          {guest.email && <div>Email: {guest.email}</div>}
                          {guest.mobile && <div>Mobile: {guest.mobile}</div>}
                        </div>
                        {guest.attendingEvents.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {guest.attendingEvents.map((event) => (
                              <span
                                key={event}
                                className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                              >
                                {event}
                              </span>
                            ))}
                          </div>
                        )}
                        {guest.attendingEvents.length === 0 && (
                          <div className="text-xs text-orange-600 mt-2">
                            No events detected for this guest
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isAutoSending && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Sending messages...
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {autoSendProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${autoSendProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Auto-Send Button */}
              {parsedGuests.length > 0 && !isAutoSending && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setParsedGuests([])}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Clear & Start Over
                  </button>
                  <button
                    onClick={handleAutoSendMessages}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Auto-Send Messages Now
                  </button>
                </div>
              )}
            </div>

            {/* Upload History */}
            {uploadedLists.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Upload History</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {uploadedLists.map((list) => (
                    <div key={list.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {list.fileName}
                          </h4>
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-500">Processed Guests</p>
                              <p className="font-semibold text-gray-900">{list.processedGuests}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Messages Sent</p>
                              <p className="font-semibold text-gray-900">{list.messagesSent}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Upload Date</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(list.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Delete this upload record?')) {
                              deleteUploadedGuestList(list.id);
                              loadUploadedLists();
                            }
                          }}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Message History</h2>
            </div>

            {messages.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare
                  size={48}
                  className="mx-auto text-gray-400 mb-4"
                />
                <p className="text-gray-600 text-lg">No messages yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Create your first message to get started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sentMessages.length > 0 && (
                  <div>
                    <div className="bg-gray-50 px-6 py-3">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        SENT MESSAGES
                      </h3>
                    </div>
                    {sentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">
                              {msg.title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {msg.content}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.selectedFunctions.map((func) => (
                                <span
                                  key={func}
                                  className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                                >
                                  {func}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span>
                                Recipients:{' '}
                                <strong className="text-gray-700">
                                  {msg.totalRecipients || 0}
                                </strong>
                              </span>
                              <span>
                                Sent:{' '}
                                <strong className="text-gray-700">
                                  {msg.sentAt
                                    ? new Date(msg.sentAt).toLocaleDateString()
                                    : '—'}
                                </strong>
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {draftMessages.length > 0 && (
                  <div>
                    <div className="bg-gray-50 px-6 py-3">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        DRAFTS ({draftMessages.length})
                      </h3>
                    </div>
                    {draftMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">
                              {msg.title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {msg.content}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.selectedFunctions.map((func) => (
                                <span
                                  key={func}
                                  className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                                >
                                  {func}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                              Created:{' '}
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendMessage(msg.id)}
                              disabled={isSending}
                              className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors rounded-lg disabled:opacity-50"
                            >
                              {isSending ? (
                                <Loader className="animate-spin" size={18} />
                              ) : (
                                <Send size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
