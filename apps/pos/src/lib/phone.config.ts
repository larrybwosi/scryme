// phone-config.ts
// Configuration file for phone number handling across different countries

export interface PhoneConfig {
  countryCode: string;
  formats: string[];
  displayName: string;
  placeholder: string;
  validationLength: number; // Total length including country code
}

// Country-specific configurations
export const PHONE_CONFIGS: Record<string, PhoneConfig> = {
  KE: {
    countryCode: '+254',
    formats: ['+254', '254', '07', '01'],
    displayName: 'Kenya (+254)',
    placeholder: '07xxxxxxxx or 01xxxxxxxx',
    validationLength: 13,
  },
  UG: {
    countryCode: '+256',
    formats: ['+256', '256', '07', '03'],
    displayName: 'Uganda (+256)',
    placeholder: '07xxxxxxxx or 03xxxxxxxx',
    validationLength: 13,
  },
  TZ: {
    countryCode: '+255',
    formats: ['+255', '255', '07', '06'],
    displayName: 'Tanzania (+255)',
    placeholder: '07xxxxxxxx or 06xxxxxxxx',
    validationLength: 13,
  },
  NG: {
    countryCode: '+234',
    formats: ['+234', '234', '070', '080', '081', '090', '091'],
    displayName: 'Nigeria (+234)',
    placeholder: '070xxxxxxxx or 080xxxxxxxx',
    validationLength: 14,
  },
  GH: {
    countryCode: '+233',
    formats: ['+233', '233', '024', '054', '055', '059'],
    displayName: 'Ghana (+233)',
    placeholder: '024xxxxxxx or 054xxxxxxx',
    validationLength: 13,
  },
};

// Default country (can be changed based on organization settings)
export const DEFAULT_COUNTRY = 'KE';

// Get current phone configuration
export const getCurrentPhoneConfig = (): PhoneConfig => {
  // This could later be fetched from user settings or organization config
  const countryCode = localStorage.getItem('phoneCountryConfig') || DEFAULT_COUNTRY;
  return PHONE_CONFIGS[countryCode] || PHONE_CONFIGS[DEFAULT_COUNTRY];
};

// Set phone configuration
export const setPhoneCountryConfig = (countryCode: string) => {
  if (PHONE_CONFIGS[countryCode]) {
    localStorage.setItem('phoneCountryConfig', countryCode);
  }
};

// Normalize phone number to international format
export const normalizePhoneNumber = (phone: string, config: PhoneConfig): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Handle different input formats based on config
  if (cleaned.startsWith(config.countryCode)) {
    return cleaned; // Already in correct format
  }

  // Remove country code without + and add it back with +
  const countryCodeDigits = config.countryCode.substring(1); // Remove +
  if (cleaned.startsWith(countryCodeDigits)) {
    return '+' + cleaned;
  }

  // Check against all supported formats
  for (const format of config.formats) {
    if (format.startsWith('+')) continue; // Skip country code format

    if (cleaned.startsWith(format)) {
      // For formats like '07', '01' - replace with country code
      if (format.length <= 2) {
        return config.countryCode + cleaned.substring(1);
      }
      // For formats like '070', '080' - replace with country code
      return config.countryCode + cleaned.substring(format.length);
    }
  }

  // If no format matches, assume it's a local number without prefix
  // This handles cases like '12345678' -> '+25412345678'
  return config.countryCode + cleaned;
};

// Format phone number for display
export const formatPhoneNumberForDisplay = (phone: string, config: PhoneConfig): string => {
  const normalized = normalizePhoneNumber(phone, config);

  // Format based on country
  switch (config.countryCode) {
    case '+254': // Kenya format: +254 7XX XXX XXX
      return normalized.replace(/(\+254)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    case '+256': // Uganda format: +256 7XX XXX XXX
      return normalized.replace(/(\+256)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    case '+255': // Tanzania format: +255 7XX XXX XXX
      return normalized.replace(/(\+255)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    case '+234': // Nigeria format: +234 XXX XXX XXXX
      return normalized.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    case '+233': // Ghana format: +233 XX XXX XXXX
      return normalized.replace(/(\+233)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    default:
      return normalized;
  }
};

// Validation helper
export const isValidPhoneNumber = (phone: string, config: PhoneConfig): boolean => {
  const normalized = normalizePhoneNumber(phone, config);
  return normalized.length === config.validationLength && normalized.startsWith(config.countryCode);
};
