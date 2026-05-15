import * as XLSX from 'xlsx';

export interface ParsedGuestData {
  guestName: string;
  email?: string;
  mobile?: string;
  attendingEvents: string[];
}

const COMMON_EVENT_ALIASES: Record<string, string> = {
  // Mehendi variations
  'mehendi': 'Mehendi',
  'mehndi': 'Mehendi',
  'henna': 'Mehendi',
  
  // Sangeet variations
  'sangeet': 'Sangeet',
  'songs': 'Sangeet',
  'music': 'Sangeet',
  
  // Haldi variations
  'haldi': 'Haldi',
  'turmeric': 'Haldi',
  
  // Wedding variations
  'wedding': 'Wedding Ceremony',
  'ceremony': 'Wedding Ceremony',
  'main event': 'Wedding Ceremony',
  
  // Reception variations
  'reception': 'Reception',
  'dinner': 'Reception',
  'party': 'Reception',
  
  // Farewell variations
  'farewell': 'Farewell Brunch',
  'brunch': 'Farewell Brunch',
  'goodbye': 'Farewell Brunch',
  
  // Welcome variations
  'welcome': 'Welcome Lunch',
  'lunch': 'Welcome Lunch',
  'arrival': 'Welcome Lunch',
};

const STANDARD_EVENTS = ['Welcome Lunch', 'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Farewell Brunch'];

/**
 * Parse Excel/CSV file and extract guest information with event attendance
 */
export function parseGuestListFile(file: File): Promise<ParsedGuestData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Log for debugging
        console.log('Raw parsed data:', jsonData);
        if (jsonData.length > 0) {
          console.log('First row keys:', Object.keys(jsonData[0]));
          console.log('First row:', jsonData[0]);
        }

        const parsedGuests = parseGuestData(jsonData);
        console.log('Parsed guests:', parsedGuests);
        resolve(parsedGuests);
      } catch (error) {
        console.error('File parsing error:', error);
        reject(new Error('Failed to parse guest list file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read guest list file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse raw guest data from spreadsheet and extract attending events
 */
function parseGuestData(rawData: any[]): ParsedGuestData[] {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    console.warn('No data found in spreadsheet');
    return [];
  }

  return rawData
    .map((row, index) => {
      // Skip empty rows
      if (!row || Object.keys(row).length === 0) {
        return null;
      }

      // Normalize row keys by trimming whitespace from column names
      const normalizedRow = normalizeRowKeys(row);

      const guestName = extractGuestName(normalizedRow);
      if (!guestName) {
        console.warn(`Row ${index}: No guest name found`, normalizedRow);
        return null;
      }

      const email = extractEmail(normalizedRow);
      const mobile = extractMobile(normalizedRow);
      const attendingEvents = extractAttendingEvents(normalizedRow);

      return {
        guestName,
        email,
        mobile,
        attendingEvents,
      };
    })
    .filter((guest): guest is ParsedGuestData => guest !== null);
}

/**
 * Normalize row keys by trimming whitespace from column names
 * Handles cases like "Names " or "Contact No " with trailing spaces
 */
function normalizeRowKeys(row: any): any {
  const normalized: any = {};
  for (const key in row) {
    const trimmedKey = key.trim();
    normalized[trimmedKey] = row[key];
  }
  return normalized;
}

/**
 * Extract guest name from spreadsheet row
 */
function extractGuestName(row: any): string | null {
  const nameColumns = ['Name', 'Names', 'Guest Name', 'name', 'names', 'guestName', 'Full Name', 'fullName', 'Guest', 'guest'];

  // First try exact matches (case-sensitive)
  for (const col of nameColumns) {
    if (row[col]) {
      const name = String(row[col]).trim();
      if (name) return name;
    }
  }

  // Then try columns that contain 'name' keyword (case-insensitive)
  for (const key in row) {
    const lowerKey = key.toLowerCase();
    if ((lowerKey.includes('name') || lowerKey.includes('guest')) && row[key]) {
      const name = String(row[key]).trim();
      if (name) return name;
    }
  }

  // Last resort: try first non-empty column that looks like a name
  for (const key in row) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== '') {
      const strValue = String(value).trim();
      // Skip if it looks like a number, email, or obviously not a name
      if (strValue && !strValue.match(/^\d+$/) && !strValue.includes('@') && strValue.length > 1) {
        return strValue;
      }
    }
  }

  return null;
}

/**
 * Extract email from spreadsheet row
 */
function extractEmail(row: any): string | undefined {
  const emailColumns = ['Email', 'email', 'E-mail', 'e-mail', 'Email Address', 'emailAddress', 'EmailAddress'];

  // First try exact matches
  for (const col of emailColumns) {
    if (row[col]) {
      const email = String(row[col]).trim();
      if (isValidEmail(email)) {
        return email;
      }
    }
  }

  // Then try columns that contain 'email' keyword (case-insensitive)
  for (const key in row) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('email') && row[key]) {
      const email = String(row[key]).trim();
      if (isValidEmail(email)) {
        return email;
      }
    }
  }

  return undefined;
}

/**
 * Extract mobile number from spreadsheet row
 */
function extractMobile(row: any): string | undefined {
  const mobileColumns = ['Mobile', 'mobile', 'Phone', 'phone', 'Contact', 'contact', 'Mobile Number', 'Contact No', 'Contact Number', 'Phone Number', 'phoneNumber'];

  for (const col of mobileColumns) {
    if (row[col]) {
      return String(row[col]).trim();
    }
  }

  // Check for columns that contain these keywords (case-insensitive)
  for (const key in row) {
    const lowerKey = key.toLowerCase();
    if ((lowerKey.includes('contact') || lowerKey.includes('mobile') || lowerKey.includes('phone')) && row[key]) {
      return String(row[key]).trim();
    }
  }

  return undefined;
}

/**
 * Extract attending events from spreadsheet row
 * Looks for columns with event names or "Yes/No" indicators
 */
function extractAttendingEvents(row: any): string[] {
  const events: string[] = [];

  // First, check for explicit event columns with Yes/No values
  for (const standardEvent of STANDARD_EVENTS) {
    const eventColumns = [
      standardEvent,
      standardEvent.toLowerCase(),
      standardEvent.replace(/\s+/g, '_'),
      standardEvent.replace(/\s+/g, ''),
    ];

    for (const col of eventColumns) {
      if (col in row) {
        const value = String(row[col]).toLowerCase().trim();
        if (value === 'yes' || value === 'y' || value === '1' || value === 'true') {
          if (!events.includes(standardEvent)) {
            events.push(standardEvent);
          }
        }
        break;
      }
    }
  }

  // Check for shorter event names that match the beginning of standard events
  // e.g., "Wedding" should match "Wedding Ceremony", "Reception" should match "Reception"
  if (events.length === 0) {
    for (const key in row) {
      const lowerKey = key.toLowerCase();
      const value = String(row[key]).toLowerCase().trim();

      // Only process if value indicates attendance
      if (value !== 'yes' && value !== 'y' && value !== '1' && value !== 'true') {
        continue;
      }

      // Map event column names to standard events
      if (lowerKey.includes('mehendi') || lowerKey.includes('mehndi')) {
        if (!events.includes('Mehendi')) events.push('Mehendi');
      } else if (lowerKey.includes('sangeet')) {
        if (!events.includes('Sangeet')) events.push('Sangeet');
      } else if (lowerKey.includes('haldi')) {
        if (!events.includes('Haldi')) events.push('Haldi');
      } else if (lowerKey.includes('wedding')) {
        if (!events.includes('Wedding Ceremony')) events.push('Wedding Ceremony');
      } else if (lowerKey.includes('reception')) {
        if (!events.includes('Reception')) events.push('Reception');
      } else if (lowerKey.includes('farewell') || lowerKey.includes('brunch')) {
        if (!events.includes('Farewell Brunch')) events.push('Farewell Brunch');
      } else if (lowerKey.includes('welcome') || lowerKey.includes('lunch')) {
        if (!events.includes('Welcome Lunch')) events.push('Welcome Lunch');
      }
    }
  }

  // If still no events, try to detect from free-text columns
  if (events.length === 0) {
    events.push(...detectEventsFromText(row));
  }

  return events;
}

/**
 * Detect events from free-text columns in the row
 */
function detectEventsFromText(row: any): string[] {
  const events: string[] = [];
  const detectionColumns = ['Events', 'events', 'Attending', 'attending', 'Functions', 'functions', 'Event Details', 'Notes', 'notes'];
  
  for (const col of detectionColumns) {
    if (row[col]) {
      const text = String(row[col]).toLowerCase();
      
      // Search for event keywords
      for (const [alias, standardEvent] of Object.entries(COMMON_EVENT_ALIASES)) {
        if (text.includes(alias)) {
          if (!events.includes(standardEvent)) {
            events.push(standardEvent);
          }
        }
      }
    }
  }
  
  return events;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize event name to standard format
 */
export function normalizeEventName(eventName: string): string | null {
  const lower = eventName.toLowerCase().trim();
  
  // Check aliases
  if (lower in COMMON_EVENT_ALIASES) {
    return COMMON_EVENT_ALIASES[lower];
  }
  
  // Check exact match
  for (const event of STANDARD_EVENTS) {
    if (event.toLowerCase() === lower) {
      return event;
    }
  }
  
  return null;
}

/**
 * Generate sample CSV template for guest list
 */
export function generateSampleGuestListCSV(): string {
  const headers = [
    'Name',
    'Email',
    'Mobile',
    'Mehendi',
    'Sangeet',
    'Haldi',
    'Wedding Ceremony',
    'Reception',
    'Farewell Brunch',
  ];
  
  const sampleData = [
    ['Kaushal Mistry', 'kaushal@example.com', '9876543210', 'No', 'No', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Ankita Mistry', 'ankita@example.com', '9876543211', 'No', 'No', 'No', 'Yes', 'No', 'No'],
    ['Priya Singh', 'priya@example.com', '9876543212', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'No'],
  ];
  
  const rows = [headers, ...sampleData];
  return rows.map(row => row.join(',')).join('\n');
}
