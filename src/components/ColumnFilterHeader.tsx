import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { Guest } from '../lib/db';

export interface ColumnFilter {
  values: string[];
  sortOrder?: 'asc' | 'desc' | null;
}

interface ColumnFilterHeaderProps {
  columnName: string;
  displayName: string;
  guests: Guest[];
  columnFilter?: ColumnFilter;
  onFilterChange: (columnName: string, filter: ColumnFilter) => void;
  onSortChange: (columnName: string | null, sortOrder: 'asc' | 'desc' | null) => void;
  textColumn?: boolean;
}

export default function ColumnFilterHeader({
  columnName,
  displayName,
  guests,
  columnFilter,
  onFilterChange,
  onSortChange,
  textColumn = false,
}: ColumnFilterHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasActiveFilter = columnFilter?.values && columnFilter.values.length > 0;
  const hasSortOrder = columnFilter?.sortOrder;

  // Extract unique values for this column
  const uniqueValues = getUniqueValuesForColumn(guests, columnName).filter(
    (value) => !searchText || value.toLowerCase().includes(searchText.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredValues = uniqueValues.filter((value) => {
    return !searchText || value.toLowerCase().includes(searchText.toLowerCase());
  });

  const allVisibleSelected =
    filteredValues.length > 0 &&
    filteredValues.every((value) => columnFilter?.values?.includes(value));

  const handleValueToggle = (value: string) => {
    const newValues = columnFilter?.values || [];
    const index = newValues.indexOf(value);
    const updatedValues = index === -1 ? [...newValues, value] : newValues.filter((_, i) => i !== index);

    onFilterChange(columnName, {
      ...columnFilter,
      values: updatedValues,
    });
  };

  const handleSortChange = (sortOrder: 'asc' | 'desc' | null) => {
    const newSortOrder = columnFilter?.sortOrder === sortOrder ? null : sortOrder;
    onFilterChange(columnName, {
      ...columnFilter,
      sortOrder: newSortOrder as 'asc' | 'desc' | null,
    });
    onSortChange(columnName, newSortOrder);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    const currentValues = columnFilter?.values || [];
    const nextValues = allVisibleSelected
      ? currentValues.filter((value) => !filteredValues.includes(value))
      : Array.from(new Set([...currentValues, ...filteredValues]));

    onFilterChange(columnName, {
      ...columnFilter,
      values: nextValues,
    });
  };

  const handleClearFilter = () => {
    onFilterChange(columnName, {
      ...columnFilter,
      values: [],
    });
    setSearchText('');
  };

  return (
    <th className="px-4 py-3 text-left font-semibold text-gray-900 relative">
      <div className="flex items-center justify-between gap-2">
        <span>{displayName}</span>
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
              hasActiveFilter || hasSortOrder
                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-100'
            }`}
            title={`Filter ${displayName}`}
          >
            <ChevronDown className="w-4 h-4" />
            {hasActiveFilter && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-600 rounded-full shadow-sm"></span>
            )}
          </button>

          {isOpen && (
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-[calc(100vw-1rem)] max-w-[360px] min-w-[280px] bg-white border border-gray-200 rounded-3xl shadow-[0_24px_60px_-22px_rgba(15,23,42,0.35)] z-50 overflow-hidden flex flex-col">
              <div className="bg-white px-4 py-4 border-b border-gray-200">
                <div className="grid gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search values..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-sm transition focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFilter}
                      className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      Clear Filter
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase">Sort</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSortChange('asc')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium text-left transition ${
                      columnFilter?.sortOrder === 'asc'
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    A → Z
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('desc')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium text-left transition ${
                      columnFilter?.sortOrder === 'desc'
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Z → A
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-4 min-h-[180px] max-h-[320px] space-y-2 filter-dropdown-scroll">
                {filteredValues.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
                    No values found
                  </div>
                ) : (
                  filteredValues.map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 transition hover:border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={columnFilter?.values?.includes(value) || false}
                        onChange={() => handleValueToggle(value)}
                        className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="truncate">{value || '(empty)'}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </th>
  );
}

/**
 * Extract unique values from a column across all guests
 */
export function getUniqueValuesForColumn(guests: Guest[], columnName: string): string[] {
  const values = new Set<string>();

  guests.forEach((guest) => {
    let value: string | undefined;

    switch (columnName) {
      case 'name':
        value = guest.name;
        break;
      case 'mobile':
        value = guest.mobile;
        break;
      case 'email':
        value = guest.email;
        break;
      case 'city':
        value = guest.city;
        break;
      case 'attendanceStatus':
        value = guest.attendanceStatus;
        break;
      case 'Sangeet':
        value = guest.functionAttendance?.['Sangeet'] === 'Yes' ? 'Yes' : 'No';
        break;
      case 'Shaadi':
        value = guest.functionAttendance?.['Wedding Ceremony'] === 'Yes' ? 'Yes' : 'No';
        break;
      case 'uploadSource':
        value = getSourceLabel(guest.uploadSource);
        break;
      case 'whatsappStatus':
        value = guest.whatsappStatus || 'Not Sent';
        break;
      case 'needsAccommodation':
        value = guest.needsAccommodation ? 'Yes' : 'No';
        break;
      default:
        value = undefined;
    }

    if (value) {
      values.add(value);
    }
  });

  return Array.from(values).sort((a, b) => {
    // Sort yes/no values with Yes first
    if ((a === 'Yes' || a === 'No') && (b === 'Yes' || b === 'No')) {
      return a === 'Yes' ? -1 : 1;
    }
    return a.localeCompare(b);
  });
}

/**
 * Extract column value from guest object for filtering
 */
export function getColumnValue(guest: Guest, columnName: string): string {
  switch (columnName) {
    case 'name':
      return guest.name;
    case 'mobile':
      return guest.mobile;
    case 'email':
      return guest.email;
    case 'city':
      return guest.city;
    case 'attendanceStatus':
      return guest.attendanceStatus;
    case 'Sangeet':
      return guest.functionAttendance?.['Sangeet'] === 'Yes' ? 'Yes' : 'No';
    case 'Shaadi':
      return guest.functionAttendance?.['Wedding Ceremony'] === 'Yes' ? 'Yes' : 'No';
    case 'uploadSource':
      return getSourceLabel(guest.uploadSource);
    case 'whatsappStatus':
      return guest.whatsappStatus || 'Not Sent';
    case 'needsAccommodation':
      return guest.needsAccommodation ? 'Yes' : 'No';
    default:
      return '';
  }
}

/**
 * Get source label
 */
function getSourceLabel(source?: Guest['uploadSource']): string {
  if (source === 'BulkUpload') return 'Uploaded';
  if (source === 'Manual') return 'Manual';
  return 'RSVP Form';
}
