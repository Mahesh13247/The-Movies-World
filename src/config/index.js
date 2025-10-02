// Application Configuration
// This module handles environment variables and app configuration

/**
 * Validates that required environment variables are set
 * @param {Object} env - Environment variables object
 * @throws {Error} - If required variables are missing
 */
const validateEnvironment = (env) => {
  const required = ["VITE_API_KEY", "VITE_API_BASE_URL"];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        `Please check your .env file or environment configuration.`
    );
  }
};

/**
 * Gets environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {any} fallback - Fallback value if not found
 * @returns {any} - Environment variable value or fallback
 */
const getEnvVar = (key, fallback = undefined) => {
  const value = import.meta.env[key];
  if (value === undefined && fallback === undefined) {
    console.warn(`Environment variable ${key} is not set and has no fallback`);
  }
  return value || fallback;
};

/**
 * Converts string to boolean for environment variables
 * @param {string} value - String value from environment
 * @param {boolean} fallback - Fallback boolean value
 * @returns {boolean} - Boolean value
 */
const getBooleanEnv = (value, fallback = false) => {
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return fallback;
};

// Validate environment on module load
try {
  validateEnvironment(import.meta.env);
} catch (error) {
  console.error("Environment Configuration Error:", error.message);
  // In development, show a helpful error
  if (import.meta.env.DEV) {
    console.error(
      "Please create a .env file with the required variables. See src/config/env.example.js for reference."
    );
  }
}

// Application configuration object
export const config = {
  // API Configuration
  api: {
    key: getEnvVar("VITE_API_KEY"),
    baseUrl: getEnvVar("VITE_API_BASE_URL", "https://api.themoviedb.org/3"),
    cacheTimeout: parseInt(getEnvVar("VITE_API_CACHE_DURATION", "300000")),
  },

  // Application Settings
  app: {
    name: getEnvVar("VITE_APP_NAME", "Movie Finder"),
    version: getEnvVar("VITE_APP_VERSION", "1.0.0"),
    environment: getEnvVar("VITE_APP_ENV", "development"),
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },

  // Security Settings
  security: {
    enableDevToolsBlocking: getBooleanEnv(
      getEnvVar("VITE_ENABLE_DEV_TOOLS_BLOCKING", "true")
    ),
    defaultAdminPin: getEnvVar("VITE_DEFAULT_ADMIN_PIN", "9137"),
  },

  // Feature Flags
  features: {
    enableAdultSection: getBooleanEnv(
      getEnvVar("VITE_ENABLE_ADULT_SECTION", "true")
    ),
    enablePWA: getBooleanEnv(getEnvVar("VITE_ENABLE_PWA", "false")),
    enableOfflineMode: getBooleanEnv(
      getEnvVar("VITE_ENABLE_OFFLINE_MODE", "false")
    ),
  },

  // Performance Settings
  performance: {
    searchDebounceDelay: parseInt(
      getEnvVar("VITE_SEARCH_DEBOUNCE_DELAY", "300")
    ),
    infiniteScrollThreshold: parseInt(
      getEnvVar("VITE_INFINITE_SCROLL_THRESHOLD", "200")
    ),
  },

  // External Services
  services: {
    sentryDsn: getEnvVar("VITE_SENTRY_DSN"),
    analyticsId: getEnvVar("VITE_ANALYTICS_ID"),
  },

  // Streaming Configuration
  streaming: {
    primarySource: getEnvVar("VITE_PRIMARY_STREAM_SOURCE", "vidsrc"),
    fallbackSources: getEnvVar(
      "VITE_FALLBACK_STREAM_SOURCES",
      "flixhq,mat6tube"
    ).split(","),
  },
};

// Export individual configurations for convenience
export const {
  api,
  app,
  security,
  features,
  performance,
  services,
  streaming,
} = config;

// Default export
export default config;
