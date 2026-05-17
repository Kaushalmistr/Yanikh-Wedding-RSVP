// Default placeholder image as a data URI (simple gradient with heart)
// We use an SVG data URI so it works in single-file mode
export const DEFAULT_COVER_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f43f5e"/>
      <stop offset="50%" style="stop-color:#ec4899"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <text x="400" y="220" text-anchor="middle" fill="white" font-size="80" font-family="serif">♥</text>
  <text x="400" y="300" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="28" font-family="sans-serif" font-weight="bold">Wedding Celebration</text>
  <text x="400" y="340" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="16" font-family="sans-serif">Upload a cover photo to personalize</text>
</svg>
`)}`;

export const HERO_BG_GRADIENT = 'bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700';

// Country codes with validation rules
export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digitCount: number; // Expected number of digits (excluding country code)
  pattern?: RegExp; // Optional custom validation pattern
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', digitCount: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', digitCount: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', digitCount: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', digitCount: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', digitCount: 9 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', digitCount: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', digitCount: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', digitCount: 10 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', digitCount: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', digitCount: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', digitCount: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', digitCount: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', digitCount: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', digitCount: 9 },
];

export const DEFAULT_COUNTRY_CODE = 'IN'; // India as default

/**
 * Validate mobile number based on country code
 * @param mobile - The mobile number (digits only)
 * @param countryCode - The country code (e.g., 'IN', 'US')
 * @returns Object with isValid and error message
 */
export function validateMobileNumber(mobile: string, countryCode: string): { isValid: boolean; error?: string } {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  
  if (!country) {
    return { isValid: false, error: 'Invalid country code' };
  }

  // Remove all non-digit characters
  const cleanMobile = mobile.replace(/\D/g, '');

  if (!cleanMobile) {
    return { isValid: false, error: 'Mobile number is required' };
  }

  // Check if it's all digits
  if (!/^\d+$/.test(cleanMobile)) {
    return { isValid: false, error: 'Mobile number should contain only digits' };
  }

  // Check exact digit count
  if (cleanMobile.length !== country.digitCount) {
    return { 
      isValid: false, 
      error: `${country.name} mobile number must be exactly ${country.digitCount} digits` 
    };
  }

  // Check custom pattern if exists
  if (country.pattern && !country.pattern.test(cleanMobile)) {
    return { isValid: false, error: `Invalid ${country.name} mobile number format` };
  }

  return { isValid: true };
}

/**
 * Format mobile number for display
 * @param mobile - The mobile number
 * @param countryCode - The country code
 * @returns Formatted mobile number with country dial code
 */
export function formatMobileForDisplay(mobile: string, countryCode: string): string {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (!country) return mobile;
  
  const cleanMobile = mobile.replace(/\D/g, '');
  return `${country.dialCode} ${cleanMobile}`;
}

/**
 * Format mobile number for WhatsApp/international use
 * @param mobile - The mobile number
 * @param countryCode - The country code
 * @returns International format (e.g., +919876543210)
 */
export function formatMobileForWhatsApp(mobile: string, countryCode: string): string {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (!country) return mobile;
  
  const cleanMobile = mobile.replace(/\D/g, '');
  return `${country.dialCode}${cleanMobile}`;
}

/**
 * Validate email format
 * @param email - The email address to validate
 * @returns Object with isValid and error message
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Basic email regex pattern
  // Matches: name@example.com, user.name+tag@example.co.uk, etc.
  const emailPattern = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@example.com)' };
  }

  // Check for common mistakes
  if (trimmedEmail.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' };
  }

  if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
    return { isValid: false, error: 'Email cannot start or end with a dot' };
  }

  const [localPart, domain] = trimmedEmail.split('@');

  if (!localPart || localPart.length > 64) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (!domain || domain.length > 255) {
    return { isValid: false, error: 'Invalid email domain' };
  }

  // Check if domain has at least one dot
  if (!domain.includes('.')) {
    return { isValid: false, error: 'Email domain must include a dot (e.g., example.com)' };
  }

  return { isValid: true };
}

/**
 * Validate Government ID based on type
 * @param idNumber - The ID number to validate
 * @param idType - The type of ID (Aadhaar Card, Passport, Driving License, Voter ID)
 * @returns Object with isValid and error message
 */
export function validateGovernmentId(idNumber: string, idType: string): { isValid: boolean; error?: string } {
  if (!idNumber || !idType) {
    return { isValid: false, error: 'ID number and type are required' };
  }

  const trimmedId = idNumber.trim().toUpperCase();

  switch (idType) {
    case 'Aadhaar Card':
      return validateAadhaar(trimmedId);
    case 'Passport':
      return validatePassport(trimmedId);
    case 'Driving License':
      return validateDrivingLicense(trimmedId);
    case 'Voter ID':
      return validateVoterId(trimmedId);
    default:
      return { isValid: false, error: 'Invalid ID type selected' };
  }
}

/**
 * Validate Aadhaar Card number
 * Format: Exactly 12 numeric digits
 * Example: 123456789012
 */
function validateAadhaar(aadhaar: string): { isValid: boolean; error?: string } {
  // Remove spaces and hyphens
  const cleaned = aadhaar.replace(/[\s-]/g, '');

  // Check if exactly 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    return { isValid: false, error: 'Aadhaar must be exactly 12 numeric digits' };
  }

  // Aadhaar cannot start with 0 or 1
  if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
    return { isValid: false, error: 'Aadhaar number cannot start with 0 or 1' };
  }

  return { isValid: true };
}

/**
 * Validate Passport number
 * Format: 1 uppercase letter followed by 7 digits
 * Example: A1234567, Z9876543
 */
function validatePassport(passport: string): { isValid: boolean; error?: string } {
  // Remove spaces
  const cleaned = passport.replace(/\s/g, '');

  // Check format: Letter followed by 7 digits
  if (!/^[A-Z]\d{7}$/.test(cleaned)) {
    return { isValid: false, error: 'Passport must be 1 letter followed by 7 digits (e.g., A1234567)' };
  }

  return { isValid: true };
}

/**
 * Validate Driving License number
 * Format: State code (2 letters) + RTO code (2 digits) + Year (4 digits) + Serial (7 digits)
 * Example: MH0120110012345, DL1420150001234
 */
function validateDrivingLicense(dl: string): { isValid: boolean; error?: string } {
  // Remove spaces and hyphens
  const cleaned = dl.replace(/[\s-]/g, '');

  // Format: 2 letters + 13 digits OR 2 letters + 2 digits + 4 digits + 7 digits
  if (!/^[A-Z]{2}\d{13}$/.test(cleaned)) {
    return { isValid: false, error: 'Driving License must be 2 letters followed by 13 digits (e.g., MH0120110012345)' };
  }

  return { isValid: true };
}

/**
 * Validate Voter ID (EPIC - Electors Photo Identity Card)
 * Format: 3 uppercase letters followed by 7 digits
 * Example: ABC1234567
 */
function validateVoterId(voterId: string): { isValid: boolean; error?: string } {
  // Remove spaces
  const cleaned = voterId.replace(/\s/g, '');

  // Check format: 3 letters followed by 7 digits
  if (!/^[A-Z]{3}\d{7}$/.test(cleaned)) {
    return { isValid: false, error: 'Voter ID must be 3 letters followed by 7 digits (e.g., ABC1234567)' };
  }

  return { isValid: true };
}

/**
 * Validate Flight PNR Number
 * Format: 6 alphanumeric characters (letters and numbers)
 * Example: ABC123, XYZ789, PQR456
 */
export function validateFlightPNR(pnr: string): { isValid: boolean; error?: string } {
  if (!pnr) {
    return { isValid: false, error: 'Flight PNR is required' };
  }

  // Remove spaces and convert to uppercase
  const cleaned = pnr.replace(/\s/g, '').toUpperCase();

  // Check format: 6 alphanumeric characters
  if (!/^[A-Z0-9]{6}$/.test(cleaned)) {
    return { isValid: false, error: 'Flight PNR must be exactly 6 alphanumeric characters (e.g., ABC123)' };
  }

  return { isValid: true };
}

/**
 * Validate Train PNR Number
 * Format: 10 numeric digits
 * Example: 1234567890, 9876543210
 */
export function validateTrainPNR(pnr: string): { isValid: boolean; error?: string } {
  if (!pnr) {
    return { isValid: false, error: 'Train PNR is required' };
  }

  // Remove spaces and hyphens
  const cleaned = pnr.replace(/[\s-]/g, '');

  // Check format: exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'Train PNR must be exactly 10 numeric digits (e.g., 1234567890)' };
  }

  return { isValid: true };
}

/**
 * Format ID number for display (add spaces for readability)
 * @param idNumber - The ID number
 * @param idType - The type of ID
 * @returns Formatted ID number
 */
export function formatIdForDisplay(idNumber: string, idType: string): string {
  if (!idNumber) return '';
  
  const cleaned = idNumber.replace(/[\s-]/g, '').toUpperCase();
  
  switch (idType) {
    case 'Aadhaar Card':
      // Format as XXXX XXXX XXXX
      return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    case 'Passport':
      // Format as X XXXXXXX
      return cleaned.replace(/([A-Z])(\d{7})/, '$1 $2');
    case 'Driving License':
      // Format as XX XX XXXX XXXXXXX
      return cleaned.replace(/([A-Z]{2})(\d{2})(\d{4})(\d{7})/, '$1 $2 $3 $4');
    case 'Voter ID':
      // Format as XXX XXXXXXX
      return cleaned.replace(/([A-Z]{3})(\d{7})/, '$1 $2');
    default:
      return cleaned;
  }
}
