/**
 * Application Settings Configuration
 *
 * These settings can be customized per company. Settings are stored in the database
 * and loaded on app startup. The constants below serve as defaults.
 *
 * UK Working Time Regulations:
 * - Workers have the right to one uninterrupted 20-minute rest break during
 *   their working day if they work more than 6 hours.
 * - Young workers (16-17) are entitled to a 30-minute break if they work more than 4.5 hours.
 */

// =============================================================================
// SETTINGS STORAGE - Runtime settings that can be updated from the database
// =============================================================================

// Default settings values
const DEFAULT_BREAK_SETTINGS = {
  BREAKS_ARE_PAID: false,
  MIN_HOURS_BEFORE_BREAK: 6,
  DEFAULT_BREAK_MINUTES: 30,
  MAX_BREAK_MINUTES: 60,
  ALLOW_MULTIPLE_BREAKS: true,
  AUTO_DEDUCT_BREAK_AFTER_HOURS: 0,
  AUTO_DEDUCT_BREAK_MINUTES: 30,
};

const DEFAULT_SHIFT_SETTINGS = {
  STANDARD_HOURS_PER_DAY: 8,
  STANDARD_HOURS_PER_WEEK: 40,
  OVERTIME_MULTIPLIER: 1.5,
  WEEKEND_OVERTIME_MULTIPLIER: 2.0,
  MIN_SHIFT_DURATION_MINUTES: 15,
  MAX_SHIFT_DURATION_HOURS: 16,
  REQUIRE_CLOCK_IN_PHOTO: true,
  REQUIRE_CLOCK_OUT_PHOTO: true,
  ALLOW_CLOCK_IN_WITHOUT_PIN: false,
  ROUND_SHIFT_TIMES_TO_MINUTES: 0,
};

const DEFAULT_INVOICE_SETTINGS = {
  COMPANY_NAME: 'INSPIRA GROUP LTD',
  COMPANY_ADDRESS: 'Manor Farm, Roxhill Rd\nBedford MK43 0QG',
  COMPANY_WEBSITE: 'www.inspira.london',
  COMPANY_EMAIL: 'office@inspira.london',
  COMPANY_PHONE: '0800 048 7721',
  INVOICE_PREFIX: '',
  PAYMENT_TERMS_DAYS: 30,
  TAX_RATE: 0,
  TAX_NOTE: 'Tax included. Contractor must ensure all applicable taxes are paid to HMRC.',
  CURRENCY_SYMBOL: '£',
  CURRENCY_CODE: 'GBP',
};

const DEFAULT_LEAVE_SETTINGS = {
  ANNUAL_LEAVE_DAYS: 28,
  ALLOW_LEAVE_CARRY_OVER: true,
  MAX_CARRY_OVER_DAYS: 5,
  REQUIRE_LEAVE_APPROVAL: true,
  MIN_NOTICE_DAYS: 1,
  ALLOW_HALF_DAY_LEAVE: true,
};

const DEFAULT_KIOSK_SETTINGS = {
  APP_NAME: 'WhiteBook 360',
  APP_TAGLINE: 'Select Your Profile',
  FOOTER_COMPANY_NAME: 'WhiteBook 360',
  SHOW_VISITOR_SIGN_IN: true,
  AUTO_LOGOUT_SECONDS: 60,
  SHOW_DEPARTMENT: true,
  SHOW_POSITION: false,
  PIN_LENGTH: 4,
  SHOW_CLOCK: true,
  USE_24_HOUR_TIME: true,
};

// Runtime settings - these can be updated from the database
let runtimeBreakSettings = { ...DEFAULT_BREAK_SETTINGS };
let runtimeShiftSettings = { ...DEFAULT_SHIFT_SETTINGS };
let runtimeInvoiceSettings = { ...DEFAULT_INVOICE_SETTINGS };
let runtimeLeaveSettings = { ...DEFAULT_LEAVE_SETTINGS };
let runtimeKioskSettings = { ...DEFAULT_KIOSK_SETTINGS };

// Settings loaded flag
let settingsLoaded = false;

// =============================================================================
// EXPORTED SETTINGS - These read from runtime settings
// =============================================================================

export const BREAK_SETTINGS = {
  get BREAKS_ARE_PAID() { return runtimeBreakSettings.BREAKS_ARE_PAID; },
  get MIN_HOURS_BEFORE_BREAK() { return runtimeBreakSettings.MIN_HOURS_BEFORE_BREAK; },
  get DEFAULT_BREAK_MINUTES() { return runtimeBreakSettings.DEFAULT_BREAK_MINUTES; },
  get MAX_BREAK_MINUTES() { return runtimeBreakSettings.MAX_BREAK_MINUTES; },
  get ALLOW_MULTIPLE_BREAKS() { return runtimeBreakSettings.ALLOW_MULTIPLE_BREAKS; },
  get AUTO_DEDUCT_BREAK_AFTER_HOURS() { return runtimeBreakSettings.AUTO_DEDUCT_BREAK_AFTER_HOURS; },
  get AUTO_DEDUCT_BREAK_MINUTES() { return runtimeBreakSettings.AUTO_DEDUCT_BREAK_MINUTES; },
};

export const SHIFT_SETTINGS = {
  get STANDARD_HOURS_PER_DAY() { return runtimeShiftSettings.STANDARD_HOURS_PER_DAY; },
  get STANDARD_HOURS_PER_WEEK() { return runtimeShiftSettings.STANDARD_HOURS_PER_WEEK; },
  get OVERTIME_MULTIPLIER() { return runtimeShiftSettings.OVERTIME_MULTIPLIER; },
  get WEEKEND_OVERTIME_MULTIPLIER() { return runtimeShiftSettings.WEEKEND_OVERTIME_MULTIPLIER; },
  get MIN_SHIFT_DURATION_MINUTES() { return runtimeShiftSettings.MIN_SHIFT_DURATION_MINUTES; },
  get MAX_SHIFT_DURATION_HOURS() { return runtimeShiftSettings.MAX_SHIFT_DURATION_HOURS; },
  get REQUIRE_CLOCK_IN_PHOTO() { return runtimeShiftSettings.REQUIRE_CLOCK_IN_PHOTO; },
  get REQUIRE_CLOCK_OUT_PHOTO() { return runtimeShiftSettings.REQUIRE_CLOCK_OUT_PHOTO; },
  get ALLOW_CLOCK_IN_WITHOUT_PIN() { return runtimeShiftSettings.ALLOW_CLOCK_IN_WITHOUT_PIN; },
  get ROUND_SHIFT_TIMES_TO_MINUTES() { return runtimeShiftSettings.ROUND_SHIFT_TIMES_TO_MINUTES; },
};

export const INVOICE_SETTINGS = {
  get COMPANY_NAME() { return runtimeInvoiceSettings.COMPANY_NAME; },
  get COMPANY_ADDRESS() { return runtimeInvoiceSettings.COMPANY_ADDRESS; },
  get COMPANY_WEBSITE() { return runtimeInvoiceSettings.COMPANY_WEBSITE; },
  get COMPANY_EMAIL() { return runtimeInvoiceSettings.COMPANY_EMAIL; },
  get COMPANY_PHONE() { return runtimeInvoiceSettings.COMPANY_PHONE; },
  get INVOICE_PREFIX() { return runtimeInvoiceSettings.INVOICE_PREFIX; },
  get PAYMENT_TERMS_DAYS() { return runtimeInvoiceSettings.PAYMENT_TERMS_DAYS; },
  get TAX_RATE() { return runtimeInvoiceSettings.TAX_RATE; },
  get TAX_NOTE() { return runtimeInvoiceSettings.TAX_NOTE; },
  get CURRENCY_SYMBOL() { return runtimeInvoiceSettings.CURRENCY_SYMBOL; },
  get CURRENCY_CODE() { return runtimeInvoiceSettings.CURRENCY_CODE; },
};

export const LEAVE_SETTINGS = {
  get ANNUAL_LEAVE_DAYS() { return runtimeLeaveSettings.ANNUAL_LEAVE_DAYS; },
  get ALLOW_LEAVE_CARRY_OVER() { return runtimeLeaveSettings.ALLOW_LEAVE_CARRY_OVER; },
  get MAX_CARRY_OVER_DAYS() { return runtimeLeaveSettings.MAX_CARRY_OVER_DAYS; },
  get REQUIRE_LEAVE_APPROVAL() { return runtimeLeaveSettings.REQUIRE_LEAVE_APPROVAL; },
  get MIN_NOTICE_DAYS() { return runtimeLeaveSettings.MIN_NOTICE_DAYS; },
  get ALLOW_HALF_DAY_LEAVE() { return runtimeLeaveSettings.ALLOW_HALF_DAY_LEAVE; },
};

export const KIOSK_SETTINGS = {
  get APP_NAME() { return runtimeKioskSettings.APP_NAME; },
  get APP_TAGLINE() { return runtimeKioskSettings.APP_TAGLINE; },
  get FOOTER_COMPANY_NAME() { return runtimeKioskSettings.FOOTER_COMPANY_NAME; },
  get SHOW_VISITOR_SIGN_IN() { return runtimeKioskSettings.SHOW_VISITOR_SIGN_IN; },
  get AUTO_LOGOUT_SECONDS() { return runtimeKioskSettings.AUTO_LOGOUT_SECONDS; },
  get SHOW_DEPARTMENT() { return runtimeKioskSettings.SHOW_DEPARTMENT; },
  get SHOW_POSITION() { return runtimeKioskSettings.SHOW_POSITION; },
  get PIN_LENGTH() { return runtimeKioskSettings.PIN_LENGTH; },
  get SHOW_CLOCK() { return runtimeKioskSettings.SHOW_CLOCK; },
  get USE_24_HOUR_TIME() { return runtimeKioskSettings.USE_24_HOUR_TIME; },
};

// =============================================================================
// SETTINGS MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Update break settings at runtime
 */
export function updateBreakSettings(settings: Partial<typeof DEFAULT_BREAK_SETTINGS>) {
  runtimeBreakSettings = { ...runtimeBreakSettings, ...settings };
  saveSettingsToLocalStorage();
}

/**
 * Update shift settings at runtime
 */
export function updateShiftSettings(settings: Partial<typeof DEFAULT_SHIFT_SETTINGS>) {
  runtimeShiftSettings = { ...runtimeShiftSettings, ...settings };
  saveSettingsToLocalStorage();
}

/**
 * Update invoice settings at runtime
 */
export function updateInvoiceSettings(settings: Partial<typeof DEFAULT_INVOICE_SETTINGS>) {
  runtimeInvoiceSettings = { ...runtimeInvoiceSettings, ...settings };
  saveSettingsToLocalStorage();
}

/**
 * Update leave settings at runtime
 */
export function updateLeaveSettings(settings: Partial<typeof DEFAULT_LEAVE_SETTINGS>) {
  runtimeLeaveSettings = { ...runtimeLeaveSettings, ...settings };
  saveSettingsToLocalStorage();
}

/**
 * Update kiosk settings at runtime
 */
export function updateKioskSettings(settings: Partial<typeof DEFAULT_KIOSK_SETTINGS>) {
  runtimeKioskSettings = { ...runtimeKioskSettings, ...settings };
  saveSettingsToLocalStorage();
}

/**
 * Get all settings as a flat object (for saving to database)
 */
export function getAllSettings() {
  return {
    break: { ...runtimeBreakSettings },
    shift: { ...runtimeShiftSettings },
    invoice: { ...runtimeInvoiceSettings },
    leave: { ...runtimeLeaveSettings },
    kiosk: { ...runtimeKioskSettings },
  };
}

/**
 * Load all settings from an object (from database)
 */
export function loadAllSettings(settings: {
  break?: Partial<typeof DEFAULT_BREAK_SETTINGS>;
  shift?: Partial<typeof DEFAULT_SHIFT_SETTINGS>;
  invoice?: Partial<typeof DEFAULT_INVOICE_SETTINGS>;
  leave?: Partial<typeof DEFAULT_LEAVE_SETTINGS>;
  kiosk?: Partial<typeof DEFAULT_KIOSK_SETTINGS>;
}) {
  if (settings.break) runtimeBreakSettings = { ...DEFAULT_BREAK_SETTINGS, ...settings.break };
  if (settings.shift) runtimeShiftSettings = { ...DEFAULT_SHIFT_SETTINGS, ...settings.shift };
  if (settings.invoice) runtimeInvoiceSettings = { ...DEFAULT_INVOICE_SETTINGS, ...settings.invoice };
  if (settings.leave) runtimeLeaveSettings = { ...DEFAULT_LEAVE_SETTINGS, ...settings.leave };
  if (settings.kiosk) runtimeKioskSettings = { ...DEFAULT_KIOSK_SETTINGS, ...settings.kiosk };
  settingsLoaded = true;
}

/**
 * Reset all settings to defaults
 */
export function resetAllSettings() {
  runtimeBreakSettings = { ...DEFAULT_BREAK_SETTINGS };
  runtimeShiftSettings = { ...DEFAULT_SHIFT_SETTINGS };
  runtimeInvoiceSettings = { ...DEFAULT_INVOICE_SETTINGS };
  runtimeLeaveSettings = { ...DEFAULT_LEAVE_SETTINGS };
  runtimeKioskSettings = { ...DEFAULT_KIOSK_SETTINGS };
  localStorage.removeItem('company_settings');
}

/**
 * Check if settings have been loaded
 */
export function areSettingsLoaded() {
  return settingsLoaded;
}

// =============================================================================
// LOCAL STORAGE PERSISTENCE (as backup/cache)
// =============================================================================

const SETTINGS_STORAGE_KEY = 'company_settings';

/**
 * Save settings to localStorage
 */
function saveSettingsToLocalStorage() {
  try {
    const settings = getAllSettings();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

/**
 * Load settings from localStorage
 */
export function loadSettingsFromLocalStorage() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      loadAllSettings(settings);
      return true;
    }
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
  }
  return false;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate entitled break duration based on hours worked
 * @param hoursWorked - Number of hours worked in the shift
 * @returns Break duration in minutes, or 0 if not entitled
 */
export function calculateEntitledBreak(hoursWorked: number): number {
  if (hoursWorked >= BREAK_SETTINGS.MIN_HOURS_BEFORE_BREAK) {
    return BREAK_SETTINGS.DEFAULT_BREAK_MINUTES;
  }
  return 0;
}

/**
 * Calculate if employee is currently entitled to take a break
 * @param shiftStartTime - When the shift started (ISO string or Date)
 * @param breaksTaken - Total break minutes already taken
 * @returns Object with entitlement info
 */
export function getBreakEntitlement(
  shiftStartTime: string | Date,
  breaksTaken: number = 0
): {
  isEntitled: boolean;
  minutesEntitled: number;
  minutesRemaining: number;
  hoursWorked: number;
  message: string;
} {
  const start = new Date(shiftStartTime);
  const now = new Date();
  const hoursWorked = (now.getTime() - start.getTime()) / (1000 * 60 * 60);

  const minutesEntitled = calculateEntitledBreak(hoursWorked);
  const minutesRemaining = Math.max(0, minutesEntitled - breaksTaken);

  let message = '';
  if (hoursWorked < BREAK_SETTINGS.MIN_HOURS_BEFORE_BREAK) {
    const hoursUntilBreak = BREAK_SETTINGS.MIN_HOURS_BEFORE_BREAK - hoursWorked;
    const minsUntilBreak = Math.ceil(hoursUntilBreak * 60);
    message = `Break available in ${minsUntilBreak} minutes`;
  } else if (minutesRemaining > 0) {
    message = `${minutesRemaining} minute break available`;
  } else if (BREAK_SETTINGS.ALLOW_MULTIPLE_BREAKS) {
    message = 'Additional break available';
  } else {
    message = 'Break already taken';
  }

  return {
    isEntitled: minutesEntitled > 0 && (minutesRemaining > 0 || BREAK_SETTINGS.ALLOW_MULTIPLE_BREAKS),
    minutesEntitled,
    minutesRemaining,
    hoursWorked,
    message,
  };
}

/**
 * Calculate overtime hours
 * @param totalMinutes - Total minutes worked
 * @param breakMinutes - Break minutes to deduct if unpaid
 * @returns Object with standard and overtime minutes
 */
export function calculateOvertimeMinutes(
  totalMinutes: number,
  breakMinutes: number = 0
): {
  workMinutes: number;
  standardMinutes: number;
  overtimeMinutes: number;
} {
  // Deduct break if unpaid
  const workMinutes = BREAK_SETTINGS.BREAKS_ARE_PAID
    ? totalMinutes
    : totalMinutes - breakMinutes;

  const standardMinutes = Math.min(
    workMinutes,
    SHIFT_SETTINGS.STANDARD_HOURS_PER_DAY * 60
  );
  const overtimeMinutes = Math.max(0, workMinutes - standardMinutes);

  return {
    workMinutes,
    standardMinutes,
    overtimeMinutes,
  };
}

/**
 * Round time to nearest interval
 * @param date - Date to round
 * @param intervalMinutes - Interval in minutes to round to
 * @returns Rounded Date
 */
export function roundTime(date: Date, intervalMinutes: number = SHIFT_SETTINGS.ROUND_SHIFT_TIMES_TO_MINUTES): Date {
  if (intervalMinutes <= 0) return date;

  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return `${INVOICE_SETTINGS.CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
