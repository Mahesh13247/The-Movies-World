// User Roles and Password Management System
// This system manages admin and user roles with PIN-based authentication

// Default admin PIN - CHANGE THIS IN PRODUCTION!
const DEFAULT_ADMIN_PIN = "9137";

// Storage keys
const ADMIN_PIN_KEY = "adminPin";
const USER_ROLE_KEY = "userRole";
const SECTION_PINS_KEY = "sectionPins";
const AUTO_LOCK_SETTINGS_KEY = "autoLockSettings";
const SESSION_DATA_KEY = "sessionData";

// Initialize settings only on client side
if (typeof window !== 'undefined') {
  // Initialize admin PIN if not set
  if (!localStorage.getItem(ADMIN_PIN_KEY)) {
    localStorage.setItem(ADMIN_PIN_KEY, DEFAULT_ADMIN_PIN);
  }

  // Initialize user role if not set
  if (!localStorage.getItem(USER_ROLE_KEY)) {
    localStorage.setItem(USER_ROLE_KEY, "user");
  }

  // Initialize auto-lock settings if not set
  if (!localStorage.getItem(AUTO_LOCK_SETTINGS_KEY)) {
    const defaultSettings = {
      enabled: true,
      inactivityTimeout: 60000, // 1 minute
      sessionTimeout: 1800000, // 30 minutes
      warningTime: 60000, // 1 minute warning
    };
    localStorage.setItem(AUTO_LOCK_SETTINGS_KEY, JSON.stringify(defaultSettings));
  }
}

/**
 * Check if current user is admin
 * @returns {boolean} True if user is admin
 */
export const isAdmin = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(USER_ROLE_KEY) === "admin";
};

/**
 * Check if current user is regular user
 * @returns {boolean} True if user is regular user
 */
export const isUser = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(USER_ROLE_KEY) === "user";
};

/**
 * Get current admin PIN
 * @returns {string} Current admin PIN
 */
export const getAdminPin = () => {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
};

/**
 * Verify admin PIN with timing-safe comparison
 * @param {string} pin - PIN to verify
 * @returns {boolean} True if PIN is correct
 */
export const verifyAdminPin = (pin) => {
  const storedPin = getAdminPin();
  if (!pin || !storedPin || pin.length !== storedPin.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < pin.length; i++) {
    result |= pin.charCodeAt(i) ^ storedPin.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Change admin PIN
 * @param {string} currentPin - Current admin PIN
 * @param {string} newPin - New admin PIN
 * @returns {Object} Result object with success status and message
 */
export const changeAdminPin = (currentPin, newPin) => {
  if (!verifyAdminPin(currentPin)) {
    return {
      success: false,
      message: "Current admin PIN is incorrect",
    };
  }

  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return {
      success: false,
      message: "New PIN must be exactly 4 digits",
    };
  }

  if (newPin === currentPin) {
    return {
      success: false,
      message: "New PIN must be different from current PIN",
    };
  }

  localStorage.setItem(ADMIN_PIN_KEY, newPin);

  return {
    success: true,
    message: "Admin PIN changed successfully",
  };
};

/**
 * Switch to admin role
 * @param {string} pin - Admin PIN
 * @returns {Object} Result object with success status and message
 */
export const switchToAdmin = (pin) => {
  if (!verifyAdminPin(pin)) {
    return {
      success: false,
      message: "Incorrect admin PIN",
    };
  }

  localStorage.setItem(USER_ROLE_KEY, "admin");

  return {
    success: true,
    message: "Switched to admin role successfully",
  };
};

/**
 * Switch to user role
 * @returns {Object} Result object with success status and message
 */
export const switchToUser = () => {
  localStorage.setItem(USER_ROLE_KEY, "user");

  return {
    success: true,
    message: "Switched to user role successfully",
  };
};

/**
 * Get section PIN
 * @param {string} sectionName - Name of the section
 * @returns {string} Section PIN or empty string if not set
 */
export const getSectionPin = (sectionName) => {
  const sectionPins = JSON.parse(
    localStorage.getItem(SECTION_PINS_KEY) || "{}"
  );
  return sectionPins[sectionName] || "";
};

/**
 * Set section PIN
 * @param {string} sectionName - Name of the section
 * @param {string} pin - PIN to set
 * @returns {Object} Result object with success status and message
 */
export const setSectionPin = (sectionName, pin) => {
  if (!isAdmin()) {
    return {
      success: false,
      message: "Only admins can set section PINs",
    };
  }

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return {
      success: false,
      message: "PIN must be exactly 4 digits",
    };
  }

  const sectionPins = JSON.parse(
    localStorage.getItem(SECTION_PINS_KEY) || "{}"
  );
  sectionPins[sectionName] = pin;
  localStorage.setItem(SECTION_PINS_KEY, JSON.stringify(sectionPins));

  return {
    success: true,
    message: `PIN set successfully for ${sectionName}`,
  };
};

/**
 * Reset section PIN
 * @param {string} sectionName - Name of the section
 * @returns {Object} Result object with success status and message
 */
export const resetSectionPin = (sectionName) => {
  if (!isAdmin()) {
    return {
      success: false,
      message: "Only admins can reset section PINs",
    };
  }

  const sectionPins = JSON.parse(
    localStorage.getItem(SECTION_PINS_KEY) || "{}"
  );
  delete sectionPins[sectionName];
  localStorage.setItem(SECTION_PINS_KEY, JSON.stringify(sectionPins));

  // Also remove unlock status
  localStorage.removeItem(`${sectionName}PinUnlocked`);

  return {
    success: true,
    message: `PIN reset successfully for ${sectionName}`,
  };
};

/**
 * Get all section PINs
 * @returns {Object} Object with section names as keys and PINs as values
 */
export const getAllSectionPins = () => {
  if (!isAdmin()) {
    return {};
  }

  return JSON.parse(localStorage.getItem(SECTION_PINS_KEY) || "{}");
};

/**
 * Get auto-lock settings
 * @returns {Object} Auto-lock settings object
 */
export const getAutoLockSettings = () => {
  const settings = localStorage.getItem(AUTO_LOCK_SETTINGS_KEY);
  if (settings) {
    return JSON.parse(settings);
  }

  // Return default settings
  return {
    enabled: true,
    inactivityTimeout: 60000, // 1 minute
    sessionTimeout: 1800000, // 30 minutes
    warningTime: 60000, // 1 minute warning
  };
};

/**
 * Update auto-lock settings
 * @param {Object} settings - New settings object
 * @returns {Object} Result object with success status and message
 */
export const updateAutoLockSettings = (settings) => {
  if (!isAdmin()) {
    return {
      success: false,
      message: "Only admins can update auto-lock settings",
    };
  }

  const currentSettings = getAutoLockSettings();
  const newSettings = { ...currentSettings, ...settings };

  localStorage.setItem(AUTO_LOCK_SETTINGS_KEY, JSON.stringify(newSettings));

  return {
    success: true,
    message: "Auto-lock settings updated successfully",
  };
};

/**
 * Start a session for a section
 * @param {string} sectionName - Name of the section
 */
export const startSession = (sectionName) => {
  const sessionData = JSON.parse(
    localStorage.getItem(SESSION_DATA_KEY) || "{}"
  );
  sessionData[sectionName] = {
    startTime: Date.now(),
    lastActivity: Date.now(),
  };
  localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(sessionData));
};

/**
 * Update activity for a section
 * @param {string} sectionName - Name of the section
 */
export const updateActivity = (sectionName) => {
  const sessionData = JSON.parse(
    localStorage.getItem(SESSION_DATA_KEY) || "{}"
  );
  if (sessionData[sectionName]) {
    sessionData[sectionName].lastActivity = Date.now();
    localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(sessionData));
  }
};

/**
 * Check if session is valid
 * @param {string} sectionName - Name of the section
 * @returns {boolean} True if session is valid
 */
export const isSessionValid = (sectionName) => {
  const settings = getAutoLockSettings();
  if (!settings.enabled) return true;

  const sessionData = JSON.parse(
    localStorage.getItem(SESSION_DATA_KEY) || "{}"
  );
  const session = sessionData[sectionName];

  if (!session) return false;

  const now = Date.now();
  const sessionAge = now - session.startTime;
  const inactivityTime = now - session.lastActivity;

  return (
    sessionAge < settings.sessionTimeout &&
    inactivityTime < settings.inactivityTimeout
  );
};

/**
 * Check and auto-lock if needed
 * @param {string} sectionName - Name of the section
 * @returns {boolean} True if section was auto-locked
 */
export const checkAndAutoLock = (sectionName) => {
  if (!isSessionValid(sectionName)) {
    localStorage.setItem(`${sectionName}PinUnlocked`, "0");
    return true;
  }
  return false;
};

/**
 * Get remaining session time
 * @param {string} sectionName - Name of the section
 * @returns {number} Remaining time in milliseconds
 */
export const getRemainingSessionTime = (sectionName) => {
  const settings = getAutoLockSettings();
  if (!settings.enabled) return 0;

  const sessionData = JSON.parse(
    localStorage.getItem(SESSION_DATA_KEY) || "{}"
  );
  const session = sessionData[sectionName];

  if (!session) return 0;

  const now = Date.now();
  const sessionAge = now - session.startTime;
  const inactivityTime = now - session.lastActivity;

  const sessionRemaining = Math.max(0, settings.sessionTimeout - sessionAge);
  const inactivityRemaining = Math.max(
    0,
    settings.inactivityTimeout - inactivityTime
  );

  return Math.min(sessionRemaining, inactivityRemaining);
};

/**
 * Format time remaining in human-readable format
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (timeMs) => {
  if (timeMs <= 0) return "00:00";

  const minutes = Math.floor(timeMs / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Reset admin PIN to default
 * @returns {Object} Result object with success status and message
 */
export const resetAdminPinToDefault = () => {
  localStorage.setItem(ADMIN_PIN_KEY, DEFAULT_ADMIN_PIN);

  return {
    success: true,
    message: `Admin PIN reset to default: ${DEFAULT_ADMIN_PIN}`,
  };
};

/**
 * Get system information
 * @returns {Object} System information object
 */
export const getSystemInfo = () => {
  return {
    defaultAdminPin: DEFAULT_ADMIN_PIN,
    currentAdminPin: getAdminPin(),
    currentUserRole: localStorage.getItem(USER_ROLE_KEY) || "user",
    sectionCount: Object.keys(getAllSectionPins()).length,
    autoLockEnabled: getAutoLockSettings().enabled,
  };
};

/**
 * Clear all data (for testing/reset)
 * @returns {Object} Result object with success status and message
 */
export const clearAllData = () => {
  localStorage.removeItem(ADMIN_PIN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(SECTION_PINS_KEY);
  localStorage.removeItem(AUTO_LOCK_SETTINGS_KEY);
  localStorage.removeItem(SESSION_DATA_KEY);

  // Reinitialize defaults
  localStorage.setItem(ADMIN_PIN_KEY, DEFAULT_ADMIN_PIN);
  localStorage.setItem(USER_ROLE_KEY, "user");

  const defaultSettings = {
    enabled: true,
    inactivityTimeout: 60000, // 1 minute
    sessionTimeout: 1800000,
    warningTime: 60000,
  };
  localStorage.setItem(AUTO_LOCK_SETTINGS_KEY, JSON.stringify(defaultSettings));

  return {
    success: true,
    message: "All data cleared and reset to defaults",
  };
};
