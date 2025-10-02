// Global Error Handling Utilities
import { toast } from "react-toastify";

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK: "NETWORK",
  API: "API",
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  STORAGE: "STORAGE",
  UNKNOWN: "UNKNOWN",
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    message,
    type = ERROR_TYPES.UNKNOWN,
    severity = ERROR_SEVERITY.MEDIUM,
    originalError = null
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.severity = severity;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Categorizes errors based on type and content
 * @param {Error} error - The error to categorize
 * @returns {Object} - Error type and severity
 */
const categorizeError = (error) => {
  if (!error)
    return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.LOW };

  const message = error.message?.toLowerCase() || "";

  // Network errors
  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.MEDIUM };
  }

  // API errors
  if (message.includes("api") || message.includes("http") || error.status) {
    return { type: ERROR_TYPES.API, severity: ERROR_SEVERITY.MEDIUM };
  }

  // Authentication errors
  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return { type: ERROR_TYPES.AUTHENTICATION, severity: ERROR_SEVERITY.HIGH };
  }

  // Storage errors
  if (message.includes("storage") || message.includes("quota")) {
    return { type: ERROR_TYPES.STORAGE, severity: ERROR_SEVERITY.MEDIUM };
  }

  // Validation errors
  if (
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("format")
  ) {
    return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.LOW };
  }

  return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
};

/**
 * Gets user-friendly error message based on error type
 * @param {AppError|Error} error - The error to get message for
 * @returns {string} - User-friendly error message
 */
const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }

  const { type } = categorizeError(error);

  switch (type) {
    case ERROR_TYPES.NETWORK:
      return "Network connection issue. Please check your internet connection and try again.";
    case ERROR_TYPES.API:
      return "Service temporarily unavailable. Please try again in a moment.";
    case ERROR_TYPES.AUTHENTICATION:
      return "Authentication required. Please check your credentials.";
    case ERROR_TYPES.STORAGE:
      return "Storage limit reached. Please clear some data and try again.";
    case ERROR_TYPES.VALIDATION:
      return "Please check your input and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
};

/**
 * Logs error to console and external services
 * @param {AppError|Error} error - The error to log
 * @param {Object} context - Additional context information
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    type: error.type || categorizeError(error).type,
    severity: error.severity || categorizeError(error).severity,
    timestamp: error.timestamp || new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.group("🚨 Application Error");
    console.error("Error:", error);
    console.table(errorInfo);
    console.groupEnd();
  }

  // Log to external service in production
  if (import.meta.env.PROD && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        type: errorInfo.type,
        severity: errorInfo.severity,
      },
      extra: errorInfo,
    });
  }
};

/**
 * Main error handler function
 * @param {Error} error - The error to handle
 * @param {Object} options - Options for error handling
 * @param {boolean} options.showToast - Whether to show toast notification
 * @param {boolean} options.logError - Whether to log the error
 * @param {Object} options.context - Additional context for logging
 * @param {string} options.customMessage - Custom user message
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    logError: shouldLog = true,
    context = {},
    customMessage = null,
  } = options;

  if (shouldLog) {
    logError(error, context);
  }

  if (showToast) {
    const message = customMessage || getUserFriendlyMessage(error);
    const { severity } = categorizeError(error);

    switch (severity) {
      case ERROR_SEVERITY.LOW:
        toast.info(message);
        break;
      case ERROR_SEVERITY.MEDIUM:
        toast.warn(message);
        break;
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        toast.error(message);
        break;
      default:
        toast.error(message);
    }
  }
};

/**
 * Async error handler for promises
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} errorOptions - Error handling options
 * @returns {Promise} - Promise that handles errors
 */
export const withErrorHandler = async (asyncFn, errorOptions = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, errorOptions);
    throw error; // Re-throw for caller to handle if needed
  }
};

/**
 * React component error handler (for use with error boundaries)
 * @param {Error} error - The error that occurred
 * @param {Object} errorInfo - React error info
 */
export const handleComponentError = (error, errorInfo) => {
  const context = {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  };

  handleError(
    new AppError(
      `Component Error: ${error.message}`,
      ERROR_TYPES.UNKNOWN,
      ERROR_SEVERITY.HIGH,
      error
    ),
    { context, showToast: false }
  ); // Don't show toast for component errors
};

/**
 * Network-specific error handler
 * @param {Response|Error} response - Fetch response or error
 * @param {string} operation - Description of the operation that failed
 */
export const handleNetworkError = async (response, operation = "API call") => {
  let error;

  if (response instanceof Error) {
    error = new AppError(
      `Network error during ${operation}: ${response.message}`,
      ERROR_TYPES.NETWORK,
      ERROR_SEVERITY.MEDIUM,
      response
    );
  } else if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    error = new AppError(
      `${operation} failed (${response.status}): ${errorText}`,
      ERROR_TYPES.API,
      response.status >= 500 ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM
    );
  }

  if (error) {
    handleError(error, { context: { operation, status: response.status } });
    throw error;
  }

  return response;
};

/**
 * Retry mechanism for failed operations
 * @param {Function} operation - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} - Promise that resolves with operation result
 */
export const retryOperation = async (
  operation,
  maxRetries = 3,
  delay = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw new AppError(
          `Operation failed after ${maxRetries} attempts: ${error.message}`,
          ERROR_TYPES.NETWORK,
          ERROR_SEVERITY.HIGH,
          error
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

export default handleError;
