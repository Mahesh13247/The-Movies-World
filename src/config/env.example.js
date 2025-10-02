// Environment Configuration Example
// Copy this file to create your actual environment setup

export const ENV_EXAMPLE = {
  // TMDB API Configuration
  VITE_API_KEY: "your_tmdb_api_key_here",
  VITE_API_BASE_URL: "https://api.themoviedb.org/3",

  // Application Configuration
  VITE_APP_NAME: "Movie Finder",
  VITE_APP_VERSION: "1.0.0",
  VITE_APP_ENV: "development",

  // Security Settings
  VITE_ENABLE_DEV_TOOLS_BLOCKING: "true",
  VITE_DEFAULT_ADMIN_PIN: "9137",

  // External Services (Optional)
  VITE_SENTRY_DSN: "your_sentry_dsn_here",
  VITE_ANALYTICS_ID: "your_analytics_id_here",

  // Feature Flags
  VITE_ENABLE_ADULT_SECTION: "true",
  VITE_ENABLE_PWA: "false",
  VITE_ENABLE_OFFLINE_MODE: "false",

  // Performance Settings
  VITE_API_CACHE_DURATION: "300000",
  VITE_SEARCH_DEBOUNCE_DELAY: "300",
  VITE_INFINITE_SCROLL_THRESHOLD: "200",

  // Streaming Sources
  VITE_PRIMARY_STREAM_SOURCE: "vidsrc",
  VITE_FALLBACK_STREAM_SOURCES: "flixhq,mat6tube",
};

// Instructions:
// 1. Create a .env file in your project root
// 2. Copy the variables above (without quotes around keys)
// 3. Set your actual values
// 4. Never commit your .env file to version control
