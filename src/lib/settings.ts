/**
 * Application Settings Configuration
 *
 * These settings can be customized per company. In the future, these will be
 * stored in the database and managed via a Settings page. For now, they are
 * configured here as constants.
 *
 * UK Working Time Regulations:
 * - Workers have the right to one uninterrupted 20-minute rest break during
 *   their working day if they work more than 6 hours.
 * - Young workers (16-17) are entitled to a 30-minute break if they work more than 4.5 hours.
 */

// =============================================================================
// BREAK SETTINGS
// =============================================================================

export const BREAK_SETTINGS = {
  /**
   * Whether breaks are paid or unpaid
   * - true: Break time is included in paid hours
   * - false: Break time is deducted from paid hours
   */
  BREAKS_ARE_PAID: false,

  /**
   * Minimum hours worked before a break is required/allowed
   * UK Regulation: 6 hours for adults, 4.5 hours for young workers
   */
  MIN_HOURS_BEFORE_BREAK: 6,

  /**
   * Default break duration in minutes
   * UK Regulation: Minimum 20 minutes for adults, 30 minutes for young workers
   */
  DEFAULT_BREAK_MINUTES: 30,

  /**
   * Maximum break duration in minutes (optional cap)
   * Set to 0 for no maximum
   */
  MAX_BREAK_MINUTES: 60,

  /**
   * Allow multiple breaks per shift
   */
  ALLOW_MULTIPLE_BREAKS: true,

  /**
   * Auto-deduct break if shift is longer than this many hours
   * Set to 0 to disable auto-deduction
   * Some companies automatically deduct a lunch break for long shifts
   */
  AUTO_DEDUCT_BREAK_AFTER_HOURS: 0,

  /**
   * Auto-deduct break duration in minutes (if AUTO_DEDUCT_BREAK_AFTER_HOURS > 0)
   */
  AUTO_DEDUCT_BREAK_MINUTES: 30,
};

// =============================================================================
// SHIFT SETTINGS
// =============================================================================

export const SHIFT_SETTINGS = {
  /**
   * Standard working hours per day (for overtime calculation)
   */
  STANDARD_HOURS_PER_DAY: 8,

  /**
   * Standard working hours per week
   */
  STANDARD_HOURS_PER_WEEK: 40,

  /**
   * Overtime multiplier (e.g., 1.5 for time-and-a-half)
   */
  OVERTIME_MULTIPLIER: 1.5,

  /**
   * Weekend overtime multiplier
   */
  WEEKEND_OVERTIME_MULTIPLIER: 2.0,

  /**
   * Minimum shift duration in minutes (to prevent accidental clock-ins)
   */
  MIN_SHIFT_DURATION_MINUTES: 15,

  /**
   * Maximum shift duration in hours (safety limit)
   */
  MAX_SHIFT_DURATION_HOURS: 16,

  /**
   * Require photo for clock in
   */
  REQUIRE_CLOCK_IN_PHOTO: true,

  /**
   * Require photo for clock out
   */
  REQUIRE_CLOCK_OUT_PHOTO: true,

  /**
   * Allow clock in without PIN (for kiosks in secure areas)
   */
  ALLOW_CLOCK_IN_WITHOUT_PIN: false,

  /**
   * Round shift times to nearest X minutes (0 = no rounding)
   * Common values: 5, 15, 30
   */
  ROUND_SHIFT_TIMES_TO_MINUTES: 0,
};

// =============================================================================
// INVOICE SETTINGS
// =============================================================================

export const INVOICE_SETTINGS = {
  /**
   * Default company name for invoices
   */
  COMPANY_NAME: 'INSPIRA GROUP LTD',

  /**
   * Default company address
   */
  COMPANY_ADDRESS: 'Manor Farm, Roxhill Rd\nBedford MK43 0QG',

  /**
   * Company website
   */
  COMPANY_WEBSITE: 'www.inspira.london',

  /**
   * Company email
   */
  COMPANY_EMAIL: 'office@inspira.london',

  /**
   * Company phone
   */
  COMPANY_PHONE: '0800 048 7721',

  /**
   * Invoice prefix (e.g., "INV-" results in "INV-001")
   */
  INVOICE_PREFIX: '',

  /**
   * Default payment terms in days
   */
  PAYMENT_TERMS_DAYS: 30,

  /**
   * Tax rate (0.20 = 20% VAT)
   * Set to 0 if tax is not applicable or handled separately
   */
  TAX_RATE: 0,

  /**
   * Tax note to display on invoices
   */
  TAX_NOTE: 'Tax included. Contractor must ensure all applicable taxes are paid to HMRC.',

  /**
   * Currency symbol
   */
  CURRENCY_SYMBOL: '£',

  /**
   * Currency code
   */
  CURRENCY_CODE: 'GBP',
};

// =============================================================================
// LEAVE SETTINGS
// =============================================================================

export const LEAVE_SETTINGS = {
  /**
   * Annual leave entitlement in days
   * UK Statutory: 28 days (including bank holidays) for full-time
   */
  ANNUAL_LEAVE_DAYS: 28,

  /**
   * Allow carry over of unused leave
   */
  ALLOW_LEAVE_CARRY_OVER: true,

  /**
   * Maximum days that can be carried over
   */
  MAX_CARRY_OVER_DAYS: 5,

  /**
   * Require manager approval for leave requests
   */
  REQUIRE_LEAVE_APPROVAL: true,

  /**
   * Minimum notice days for leave requests
   */
  MIN_NOTICE_DAYS: 1,

  /**
   * Allow half-day leave requests
   */
  ALLOW_HALF_DAY_LEAVE: true,
};

// =============================================================================
// KIOSK SETTINGS
// =============================================================================

export const KIOSK_SETTINGS = {
  /**
   * Application name displayed in kiosk
   */
  APP_NAME: 'WhiteBook 360',

  /**
   * Tagline displayed in kiosk header
   */
  APP_TAGLINE: 'Select Your Profile',

  /**
   * Company name for footer
   */
  FOOTER_COMPANY_NAME: 'WhiteBook 360',

  /**
   * Show visitor sign-in option
   */
  SHOW_VISITOR_SIGN_IN: true,

  /**
   * Auto-logout timeout in seconds (0 = disabled)
   * Returns to idle state after this many seconds of inactivity
   */
  AUTO_LOGOUT_SECONDS: 60,

  /**
   * Show employee department on cards
   */
  SHOW_DEPARTMENT: true,

  /**
   * Show employee position on cards
   */
  SHOW_POSITION: false,

  /**
   * PIN length required
   */
  PIN_LENGTH: 4,

  /**
   * Show clock on kiosk
   */
  SHOW_CLOCK: true,

  /**
   * 24-hour time format (false = 12-hour with AM/PM)
   */
  USE_24_HOUR_TIME: true,
};

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
