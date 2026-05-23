import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEventById,
  getGuestsByEvent,
  createMessage,
  addGuest,
  addGuestsBulk,
  convertParsedGuestToGuest,
  updateGuest,
  deleteGuests,
  type WeddingEvent,
  type Guest,
} from '../lib/db';
import { parseGuestListFile } from '../lib/guestListParser';
import { formatMobileForDisplay } from '../lib/constants';
import ColumnFilterHeader, { getColumnValue, type ColumnFilter } from '../components/ColumnFilterHeader';
import DocumentsModal from '../components/DocumentsModal';
import {
  Heart,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Users,
  Plus,
  Trash2,
  FileText,
  X,
  Send,
  MessageCircle,
  Pencil,
  Link as LinkIcon,
} from 'lucide-react';
import { Fragment } from 'react';

const FUNCTIONS = ['Welcome Lunch', 'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Farewell Brunch'];

type WhatsAppStatusOption = 'Pending' | 'Success' | 'Failed' | 'Not Sent';

interface GuestFormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  signedIn: boolean;
  sangeet: boolean;
  shaadi: boolean;
  needsAccommodation: boolean;
  city: string;
  whatsappStatus: WhatsAppStatusOption;
}

const emptyGuestForm = (): GuestFormState => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  signedIn: false,
  sangeet: false,
  shaadi: false,
  needsAccommodation: false,
  city: '',
  whatsappStatus: 'Not Sent',
});

function defaultFunctionAttendance(): Record<string, 'Yes' | 'No'> {
  return Object.fromEntries(FUNCTIONS.map((fn) => [fn, 'No'])) as Record<string, 'Yes' | 'No'>;
}

function guestToFormState(guest: Guest): GuestFormState {
  const nameParts = guest.name.trim().split(/\s+/);
  return {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
    phone: guest.mobile,
    email: guest.email,
    signedIn: guest.attendanceStatus === 'Yes',
    sangeet: guest.functionAttendance?.['Sangeet'] === 'Yes',
    shaadi: guest.functionAttendance?.['Wedding Ceremony'] === 'Yes',
    needsAccommodation: guest.needsAccommodation,
    city: guest.city,
    whatsappStatus: guest.whatsappStatus || 'Not Sent',
  };
}

function buildGuestPayload(
  form: GuestFormState,
  eventId: string,
  existing?: Guest
): Omit<Guest, 'id' | 'submittedAt'> {
  const functionAttendance = existing?.functionAttendance
    ? { ...existing.functionAttendance }
    : defaultFunctionAttendance();

  functionAttendance['Sangeet'] = form.sangeet ? 'Yes' : 'No';
  functionAttendance['Wedding Ceremony'] = form.shaadi ? 'Yes' : 'No';

  const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  return {
    eventId,
    name: fullName,
    mobile: form.phone.trim(),
    email: form.email.trim(),
    city: form.city.trim(),
    respondingFor: existing?.respondingFor ?? 'Self',
    attendanceStatus: form.signedIn ? 'Yes' : 'Maybe',
    functionAttendance,
    adults: existing?.adults ?? 1,
    children: existing?.children ?? 0,
    infants: existing?.infants ?? 0,
    additionalGuests: existing?.additionalGuests ?? [],
    needsAccommodation: form.needsAccommodation,
    checkInDate: existing?.checkInDate,
    checkOutDate: existing?.checkOutDate,
    numberOfRooms: existing?.numberOfRooms,
    roomPreference: existing?.roomPreference,
    preferredRoommates: existing?.preferredRoommates,
    arrivalMode: existing?.arrivalMode,
    arrivalDate: existing?.arrivalDate,
    arrivalTime: existing?.arrivalTime,
    arrivalTransportName: existing?.arrivalTransportName,
    arrivalNumber: existing?.arrivalNumber,
    arrivalLocation: existing?.arrivalLocation,
    arrivalItineraryFile: existing?.arrivalItineraryFile,
    departureDate: existing?.departureDate,
    departureTime: existing?.departureTime,
    departureTransportName: existing?.departureTransportName,
    departureNumber: existing?.departureNumber,
    departureItineraryFile: existing?.departureItineraryFile,
    needsPickup: existing?.needsPickup ?? false,
    needsDrop: existing?.needsDrop ?? false,
    transferPassengers: existing?.transferPassengers ?? 0,
    transferBags: existing?.transferBags ?? 0,
    transferRequirements: existing?.transferRequirements,
    idType: existing?.idType,
    idNumber: existing?.idNumber,
    idFrontFile: existing?.idFrontFile,
    idBackFile: existing?.idBackFile,
    mealPreference: existing?.mealPreference ?? '',
    dietaryRestrictions: existing?.dietaryRestrictions ?? '',
    specialAssistance: existing?.specialAssistance ?? [],
    celebrationParticipation: existing?.celebrationParticipation ?? [],
    additionalNotes: existing?.additionalNotes ?? '',
    infoAccurate: existing?.infoAccurate ?? true,
    dataConsent: existing?.dataConsent ?? true,
    uploadSource: existing?.uploadSource ?? 'Manual',
    whatsappStatus: form.whatsappStatus,
    whatsappSentAt: existing?.whatsappSentAt,
  };
}

function getSourceLabel(source?: Guest['uploadSource']): string {
  if (source === 'BulkUpload') return 'Uploaded';
  if (source === 'Manual') return 'Manual';
  return 'RSVP Form';
}

function getSourceBadgeClass(source?: Guest['uploadSource']): string {
  if (source === 'BulkUpload') return 'bg-orange-100 text-orange-700';
  if (source === 'Manual') return 'bg-emerald-100 text-emerald-700';
  return 'bg-blue-100 text-blue-700';
}

export default function GuestList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuests, setExpandedGuests] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'Yes' | 'Maybe' | 'Cannot attend'>('all');
  const [sortBy, setSortBy] = useState<'original' | 'name' | 'date' | 'status'>('original');
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [activeSortColumn, setActiveSortColumn] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedGuestForMessage, setSelectedGuestForMessage] = useState<Guest | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  // Delete confirmation modal
  const [guestsPendingDelete, setGuestsPendingDelete] = useState<Guest[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add / edit guest modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState<GuestFormState>(emptyGuestForm);
  const [guestFormError, setGuestFormError] = useState('');

  // Documents modal state
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedGuestForDocuments, setSelectedGuestForDocuments] = useState<Guest | null>(null);

  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refreshGuests = () => {
    if (id) setGuests(getGuestsByEvent(id));
  };

  const handleColumnFilterChange = (columnName: string, filter: ColumnFilter) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnName]: filter,
    }));
  };

  const handleColumnSortChange = (columnName: string | null, sortOrder: 'asc' | 'desc' | null) => {
    setActiveSortColumn(columnName);
    if (columnName) {
      setSortBy('original');
    }
  };

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) {
        setEvent(ev);
        setGuests(getGuestsByEvent(id));
      }
    }
  }, [id]);

  useEffect(() => {
    if (importStatus?.type !== 'success') return;
    const timer = window.setTimeout(() => setImportStatus(null), 5000);
    return () => window.clearTimeout(timer);
  }, [importStatus]);

  // Auto-dismiss toast notifications
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Clear selection when filters/search changes
  useEffect(() => {
    setSelectedGuests([]);
  }, [searchQuery, filterStatus, sortBy]);

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !id) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const parsed = await parseGuestListFile(file);
      const validGuests = parsed.filter((g) => g.guestName?.trim());

      if (validGuests.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'No valid guests found in the file. Ensure names are included.',
        });
        return;
      }

      const guestObjects = convertParsedGuestToGuest(validGuests, id);
      addGuestsBulk(guestObjects);
      refreshGuests();
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${validGuests.length} guest${validGuests.length === 1 ? '' : 's'}.`,
      });
    } catch {
      setImportStatus({
        type: 'error',
        message: 'Failed to import file. Please use a valid Excel (.xlsx, .xls) or CSV file.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Filter and search logic
  const filteredGuests = useMemo(() => {
    let result = guests;

    // Search filter - includes main guest and additional guests
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((guest) => {
        // Search in main guest fields
        const mainGuestMatch =
          (guest.name && guest.name.toLowerCase().includes(query)) ||
          (guest.email && guest.email.toLowerCase().includes(query)) ||
          (guest.mobile && guest.mobile.toString().includes(query)) ||
          (guest.city && guest.city.toLowerCase().includes(query));

        // Also search in additional guests
        const additionalGuestMatch =
          guest.additionalGuests && guest.additionalGuests.length > 0
            ? guest.additionalGuests.some(
                (addGuest) =>
                  (addGuest.name && addGuest.name.toLowerCase().includes(query)) ||
                  (addGuest.email && addGuest.email.toLowerCase().includes(query)) ||
                  (addGuest.mobile && addGuest.mobile.toString().includes(query))
              )
            : false;

        return mainGuestMatch || additionalGuestMatch;
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((guest) => guest.attendanceStatus === filterStatus);
    }

    // Column-level filters (AND logic)
    for (const [columnName, filterConfig] of Object.entries(columnFilters)) {
      if (!filterConfig || filterConfig.values.length === 0) continue;

      result = result.filter((guest) => {
        const columnValue = getColumnValue(guest, columnName);
        return filterConfig.values.includes(columnValue);
      });
    }

    // Sort
    if (activeSortColumn && columnFilters[activeSortColumn]?.sortOrder) {
      const sortOrder = columnFilters[activeSortColumn].sortOrder;
      result = [...result].sort((a, b) => {
        const aVal = getColumnValue(a, activeSortColumn);
        const bVal = getColumnValue(b, activeSortColumn);
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy !== 'original') {
      result = [...result].sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'date') {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        } else if (sortBy === 'status') {
          const statusOrder = { 'Yes': 0, 'Maybe': 1, 'Cannot attend': 2 };
          return statusOrder[a.attendanceStatus as keyof typeof statusOrder] - statusOrder[b.attendanceStatus as keyof typeof statusOrder];
        }
        return 0;
      });
    }

    return result;
  }, [guests, searchQuery, filterStatus, sortBy, columnFilters, activeSortColumn]);

  const toggleGuestExpanded = (guestId: string) => {
    setExpandedGuests((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  const toggleSelectGuest = (guestId: string) => {
    setSelectedGuests((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g) => g.id));
    }
  };

  const openAddGuestModal = () => {
    setEditingGuest(null);
    setGuestForm(emptyGuestForm());
    setGuestFormError('');
    setShowGuestModal(true);
  };

  const openEditGuestModal = (guest: Guest) => {
    setEditingGuest(guest);
    setGuestForm(guestToFormState(guest));
    setGuestFormError('');
    setShowGuestModal(true);
  };

  const closeGuestModal = () => {
    setShowGuestModal(false);
    setEditingGuest(null);
    setGuestForm(emptyGuestForm());
    setGuestFormError('');
  };

  const handleSaveGuest = () => {
    if (!id) return;

    if (!guestForm.firstName.trim()) {
      setGuestFormError('First name is required');
      return;
    }
    if (!guestForm.phone.trim()) {
      setGuestFormError('Phone number is required');
      return;
    }
    if (!guestForm.email.trim()) {
      setGuestFormError('Email address is required');
      return;
    }

    const payload = buildGuestPayload(guestForm, id, editingGuest ?? undefined);

    if (editingGuest) {
      updateGuest(editingGuest.id, payload);
    } else {
      addGuest(payload);
    }

    refreshGuests();
    closeGuestModal();
  };

  const requestDeleteGuest = (guest: Guest) => {
    setGuestsPendingDelete([guest]);
  };

  const requestDeleteSelected = () => {
    if (selectedGuests.length === 0) return;
    const toDelete = guests.filter((g) => selectedGuests.includes(g.id));
    setGuestsPendingDelete(toDelete);
  };

  const closeDeleteConfirm = () => {
    setGuestsPendingDelete(null);
    setDeleteError('');
  };

  const deleteAdditionalGuest = (guestId: string, additionalGuestIndex: number) => {
    try {
      const guest = guests.find((g) => g.id === guestId);
      if (!guest) return;

      const updatedAdditionalGuests = guest.additionalGuests?.filter((_, idx) => idx !== additionalGuestIndex) || [];
      updateGuest(guestId, { ...guest, additionalGuests: updatedAdditionalGuests });

      refreshGuests();
      setToast({
        type: 'success',
        message: 'Additional guest removed successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to remove additional guest';
      setToast({
        type: 'error',
        message: errorMsg,
      });
    }
  };

  const confirmDelete = () => {
    if (!guestsPendingDelete?.length) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const idsToDelete = guestsPendingDelete.map((g) => g.id);
      deleteGuests(idsToDelete);

      setSelectedGuests((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setExpandedGuests((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      refreshGuests();

      setToast({
        type: 'success',
        message: `Successfully deleted ${idsToDelete.length} guest${idsToDelete.length === 1 ? '' : 's'}`,
      });

      closeDeleteConfirm();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete guests';
      setDeleteError(errorMsg);
      setToast({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openMessageModal = (guest: Guest) => {
    setSelectedGuestForMessage(guest);
    setMessageSubject('');
    setMessageBody('');
    setMessageError('');
    setMessageSuccess('');
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!selectedGuestForMessage) return;

    if (!messageSubject.trim()) {
      setMessageError('Please enter a message subject');
      return;
    }

    if (!messageBody.trim()) {
      setMessageError('Please enter a message body');
      return;
    }

    setIsSendingMessage(true);
    setMessageError('');

    try {
      // Create a manual message
      createMessage({
        eventId: id!,
        title: messageSubject,
        content: messageBody,
        selectedFunctions: Object.keys(selectedGuestForMessage.functionAttendance).filter(
          (func) => selectedGuestForMessage.functionAttendance[func] === 'Yes'
        ),
        createdBy: 'admin',
        sentAt: new Date().toISOString(),
        totalRecipients: 1,
        recipientGuestIds: [selectedGuestForMessage.id],
        isAutoSent: false,
      });

      setMessageSuccess(`Message sent to ${selectedGuestForMessage.name}!`);
      setTimeout(() => {
        setShowMessageModal(false);
        setSelectedGuestForMessage(null);
        setMessageSubject('');
        setMessageBody('');
        setMessageSuccess('');
      }, 2000);
    } catch (err) {
      setMessageError('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-rose-600 hover:underline"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalGuests = guests.reduce((sum, g) => sum + 1 + (g.additionalGuests?.length || 0), 0);
  const acceptedGuests = guests.filter((g) => g.attendanceStatus === 'Yes').length;
  const pendingGuests = guests.filter((g) => g.attendanceStatus === 'Maybe').length;
  const declinedGuests = guests.filter((g) => g.attendanceStatus === 'Cannot attend').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-50">
        <div className="w-full px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500" fill="currentColor" />
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Wedding RSVP
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <input
                ref={importFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                className="hidden"
                aria-hidden
              />
              <button
                type="button"
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing…' : 'Import'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-sm font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-sm font-medium">
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                onClick={() => navigate(`/event/${id}`)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                Back to Event
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-8 py-10">
        {/* Page Title & Stats */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Guest List</h1>
          <p className="text-gray-600 mb-6">
            {event.groomName} & {event.brideName} • {new Date(event.weddingDate).toLocaleDateString('en-IN')}
          </p>

          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total Guests</div>
              <div className="text-3xl font-bold text-gray-900">{totalGuests}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100">
              <div className="text-sm text-green-600 mb-1">Accepted</div>
              <div className="text-3xl font-bold text-green-600">{acceptedGuests}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-yellow-100">
              <div className="text-sm text-yellow-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{pendingGuests}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-100">
              <div className="text-sm text-red-600 mb-1">Declined</div>
              <div className="text-3xl font-bold text-red-600">{declinedGuests}</div>
            </div>
          </div>
        </div>

        {importStatus && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-start justify-between border ${
              importStatus.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                importStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {importStatus.message}
            </p>
            <button
              type="button"
              onClick={() => setImportStatus(null)}
              className={`flex-shrink-0 p-1 transition-colors ${
                importStatus.type === 'success'
                  ? 'text-green-400 hover:text-green-600'
                  : 'text-red-400 hover:text-red-600'
              }`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Info Banner */}
        {showBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-400 flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold">
                💡
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-0.5">
                  Populate your guest list with a single magic link
                </p>
                <p className="text-sm text-blue-700">
                  <button className="font-medium hover:underline">Try Contact Collector</button>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar with Filter Options */}
        <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex items-center gap-2 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <FileText className="w-4 h-4" />
            RSVP Tracking
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Users className="w-4 h-4" />
            Create Party
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Users className="w-4 h-4" />
            Make Head
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add to Party
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Trash2 className="w-4 h-4" />
            Remove from Party
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            Merge Duplicates
          </button>
          <button
            type="button"
            onClick={requestDeleteSelected}
            disabled={selectedGuests.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete Guest
          </button>
          <div className="flex-1"></div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Columns
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-gray-200 border-t-0 p-4 rounded-b-xl mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              >
                <option value="all">All RSVP Status</option>
                <option value="Yes">✓ Accepted</option>
                <option value="Maybe">Pending</option>
                <option value="Cannot attend">Declined</option>
              </select>
            </div>

            {/* Sort */}
            <div className="w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              >
                <option value="original">Original Order (Excel)</option>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>

            {/* Search Options */}
            <button className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-xs">More filters</span>
            </button>

            {selectedGuests.length > 0 && (
              <button
                type="button"
                onClick={requestDeleteSelected}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedGuests.length})
              </button>
            )}

            <button
              type="button"
              onClick={openAddGuestModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Guest
            </button>
          </div>
        </div>

        {/* Guest Table/List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No guests found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      <input
                        type="checkbox"
                        checked={
                          filteredGuests.length > 0 && selectedGuests.length === filteredGuests.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </th>
                    <ColumnFilterHeader
                      columnName="name"
                      displayName="First Name"
                      guests={guests}
                      columnFilter={columnFilters['name']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                      textColumn
                    />
                    <ColumnFilterHeader
                      columnName="name"
                      displayName="Last Name"
                      guests={guests}
                      columnFilter={columnFilters['name']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                      textColumn
                    />
                    <ColumnFilterHeader
                      columnName="mobile"
                      displayName="Phone Number"
                      guests={guests}
                      columnFilter={columnFilters['mobile']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                      textColumn
                    />
                    <ColumnFilterHeader
                      columnName="email"
                      displayName="Email Address"
                      guests={guests}
                      columnFilter={columnFilters['email']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                      textColumn
                    />
                    <ColumnFilterHeader
                      columnName="attendanceStatus"
                      displayName="Signed-In"
                      guests={guests}
                      columnFilter={columnFilters['attendanceStatus']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                    />
                    <ColumnFilterHeader
                      columnName="Sangeet"
                      displayName="Sangeet"
                      guests={guests}
                      columnFilter={columnFilters['Sangeet']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                    />
                    <ColumnFilterHeader
                      columnName="Shaadi"
                      displayName="Shaadi"
                      guests={guests}
                      columnFilter={columnFilters['Shaadi']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                    />
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Tags
                    </th>
                    <ColumnFilterHeader
                      columnName="city"
                      displayName="City"
                      guests={guests}
                      columnFilter={columnFilters['city']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                    />
                    <ColumnFilterHeader
                      columnName="uploadSource"
                      displayName="Source"
                      guests={guests}
                      columnFilter={columnFilters['uploadSource']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                    />
                    <ColumnFilterHeader
                      columnName="whatsappStatus"
                      displayName="WhatsApp Status"
                      guests={guests}
                      columnFilter={columnFilters['whatsappStatus']}
                      onFilterChange={handleColumnFilterChange}
                      onSortChange={handleColumnSortChange}
                    />
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Documents
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => {
                    const firstName = guest.name.split(' ')[0];
                    const lastName = guest.name.split(' ').slice(1).join(' ');
                    const isExpanded = expandedGuests.includes(guest.id);
                    const initials = (guest.name.split(' ')[0][0] + (guest.name.split(' ')[1]?.[0] || '')).toUpperCase();

                    return (
                      <Fragment key={guest.id}>
                        {/* Main Row */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedGuests.includes(guest.id)}
                              onChange={() => toggleSelectGuest(guest.id)}
                              className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {initials}
                              </div>
                              <span className="text-gray-900 font-medium truncate">{firstName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 truncate">
                            {lastName || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{guest.mobile}</td>
                          <td className="px-4 py-3 text-gray-600">
                            <a href={`mailto:${guest.email}`} className="hover:text-rose-600 text-blue-600 block truncate">
                              {guest.email}
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={guest.attendanceStatus === 'Yes'}
                              readOnly
                              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-default pointer-events-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {guest.functionAttendance?.['Sangeet'] === 'Yes' && (
                              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 inline-flex items-center justify-center text-xs font-bold">
                                ✓
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {guest.functionAttendance?.['Wedding Ceremony'] === 'Yes' && (
                              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 inline-flex items-center justify-center text-xs font-bold">
                                ✓
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {guest.city}
                              </span>
                              {guest.needsAccommodation && (
                                <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                  Accommodation
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 truncate">{guest.city}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${getSourceBadgeClass(guest.uploadSource)}`}
                            >
                              {getSourceLabel(guest.uploadSource)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              guest.whatsappStatus === 'Success'
                                ? 'bg-green-100 text-green-700'
                                : guest.whatsappStatus === 'Failed'
                                ? 'bg-red-100 text-red-700'
                                : guest.whatsappStatus === 'Pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {guest.whatsappStatus === 'Success' ? '✓ Sent' : 
                               guest.whatsappStatus === 'Failed' ? '✗ Failed' :
                               guest.whatsappStatus === 'Pending' ? '⏳ Pending' :
                               '— Not Sent'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {guest.documents && guest.documents.length > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedGuestForDocuments(guest);
                                  setShowDocumentsModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors hover:underline"
                              >
                                <LinkIcon className="w-4 h-4" />
                                <span>Link ({guest.documents.length})</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedGuestForDocuments(guest);
                                  setShowDocumentsModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1 rounded text-sm transition-colors font-medium"
                                title="No documents uploaded - click to upload"
                              >
                                <FileText className="w-4 h-4" />
                                <span>Upload</span>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditGuestModal(guest)}
                                className="inline-flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded"
                                title="Edit guest"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openMessageModal(guest)}
                                className="inline-flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded"
                                title="Send message"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              {guest.additionalGuests && guest.additionalGuests.length > 0 ? (
                                <button
                                  onClick={() => toggleGuestExpanded(guest.id)}
                                  className="inline-flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors p-1 hover:bg-gray-100 rounded"
                                  title="Toggle details"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => requestDeleteGuest(guest)}
                                className="inline-flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded"
                                title="Delete guest"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {isExpanded && guest.additionalGuests && guest.additionalGuests.length > 0 && (
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <td colSpan={13} className="px-6 py-4">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <Users className="w-4 h-4" /> Additional Guests ({guest.additionalGuests.length})
                                </h4>
                                <div className="space-y-2">
                                  {guest.additionalGuests.map((addGuest, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 flex items-start justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {addGuest.name}
                                          <span className="text-sm text-gray-500 font-normal ml-2">
                                            • {addGuest.relation} • {addGuest.age} years
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          📧 {addGuest.email} | 📱 {formatMobileForDisplay(addGuest.mobile, addGuest.countryCode || 'IN')}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => deleteAdditionalGuest(guest.id, idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Delete additional guest"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-6 text-sm text-gray-600 px-4 py-3">
          Showing <span className="font-medium text-gray-900">{filteredGuests.length}</span> of <span className="font-medium text-gray-900">{guests.length}</span> guests
          {selectedGuests.length > 0 && <span> • <span className="font-medium text-rose-600">{selectedGuests.length} selected</span></span>}
        </div>

        {/* Toast Notifications */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-md z-40 animate-in fade-in slide-in-from-bottom-4 ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            <p
              className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className={`flex-shrink-0 ml-auto transition-colors ${
                toast.type === 'success'
                  ? 'text-green-400 hover:text-green-600'
                  : 'text-red-400 hover:text-red-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {guestsPendingDelete && guestsPendingDelete.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 size={22} />
                Confirm Deletion
              </h2>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
                className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{deleteError}</p>
                </div>
              )}

              <p className="text-gray-700 text-sm leading-relaxed">
                {guestsPendingDelete.length === 1 ? (
                  <>
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-gray-900">{guestsPendingDelete[0].name}</span>{' '}
                    from the guest list? This action cannot be undone.
                  </>
                ) : (
                  <>
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-gray-900">{guestsPendingDelete.length} guests</span>{' '}
                    from the guest list? This action cannot be undone.
                  </>
                )}
              </p>

              {guestsPendingDelete.length > 1 && guestsPendingDelete.length <= 5 && (
                <ul className="mt-3 text-sm text-gray-600 list-disc list-inside max-h-32 overflow-y-auto">
                  {guestsPendingDelete.map((g) => (
                    <li key={g.id}>{g.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Deleting...
                  </>
                ) : (
                  guestsPendingDelete.length === 1 ? 'Delete Guest' : 'Delete Selected'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedGuestForMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle size={24} />
                Send Message to {selectedGuestForMessage.name}
              </h2>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedGuestForMessage(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {messageError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{messageError}</p>
                </div>
              )}

              {messageSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">{messageSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Subject
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="e.g., Important Update for Wedding Ceremony"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Guest Details:</strong><br />
                  Email: {selectedGuestForMessage.email}<br />
                  Mobile: {formatMobileForDisplay(selectedGuestForMessage.mobile, selectedGuestForMessage.countryCode || 'IN')}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedGuestForMessage(null);
                  setMessageSubject('');
                  setMessageBody('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingMessage ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={22} />
                {editingGuest ? 'Edit Guest' : 'Add Guest'}
              </h2>
              <button
                type="button"
                onClick={closeGuestModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {guestFormError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{guestFormError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={guestForm.firstName}
                    onChange={(e) => setGuestForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={guestForm.lastName}
                    onChange={(e) => setGuestForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={guestForm.city}
                    onChange={(e) => setGuestForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    readOnly
                    value={editingGuest ? getSourceLabel(editingGuest.uploadSource) : 'Manual'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Status</label>
                  <select
                    value={guestForm.whatsappStatus}
                    onChange={(e) =>
                      setGuestForm((f) => ({
                        ...f,
                        whatsappStatus: e.target.value as WhatsAppStatusOption,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Not Sent">— Not Sent</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Success">✓ Sent</option>
                    <option value="Failed">✗ Failed</option>
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Attendance & Events</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guestForm.signedIn}
                    onChange={(e) => setGuestForm((f) => ({ ...f, signedIn: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Signed-In (RSVP accepted)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guestForm.sangeet}
                    onChange={(e) => setGuestForm((f) => ({ ...f, sangeet: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Sangeet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guestForm.shaadi}
                    onChange={(e) => setGuestForm((f) => ({ ...f, shaadi: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Shaadi (Wedding Ceremony)</span>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guestForm.needsAccommodation}
                    onChange={(e) => setGuestForm((f) => ({ ...f, needsAccommodation: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Needs Accommodation</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={closeGuestModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGuest}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center gap-2"
              >
                <Plus size={18} />
                {editingGuest ? 'Save Changes' : 'Add Guest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedGuestForDocuments && (
        <DocumentsModal
          guest={selectedGuestForDocuments}
          onClose={() => {
            setShowDocumentsModal(false);
            setSelectedGuestForDocuments(null);
          }}
          onUpdate={() => {
            refreshGuests();
            if (selectedGuestForDocuments) {
              // Update the selected guest with fresh data
              const updatedGuest = guests.find(g => g.id === selectedGuestForDocuments.id);
              if (updatedGuest) {
                setSelectedGuestForDocuments(updatedGuest);
              }
            }
          }}
        />
      )}
    </div>
  );
}
