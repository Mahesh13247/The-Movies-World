import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
beforeAll(() => {
  // Mock import.meta.env
  Object.defineProperty(import.meta, "env", {
    value: {
      VITE_API_KEY: "test-api-key",
      VITE_API_BASE_URL: "https://api.themoviedb.org/3",
      VITE_APP_NAME: "Movie Finder Test",
      VITE_APP_VERSION: "1.0.0-test",
      VITE_APP_ENV: "test",
      VITE_ENABLE_DEV_TOOLS_BLOCKING: "false",
      VITE_DEFAULT_ADMIN_PIN: "1234",
      VITE_ENABLE_ADULT_SECTION: "true",
      VITE_ENABLE_PWA: "false",
      VITE_ENABLE_OFFLINE_MODE: "false",
      VITE_API_CACHE_DURATION: "300000",
      VITE_SEARCH_DEBOUNCE_DELAY: "100",
      VITE_INFINITE_SCROLL_THRESHOLD: "200",
      VITE_PRIMARY_STREAM_SOURCE: "vidsrc",
      VITE_FALLBACK_STREAM_SOURCES: "flixhq,mat6tube",
      DEV: false,
      PROD: false,
    },
    writable: true,
  });

  // Mock react-toastify
  vi.mock("react-toastify", () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }));
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
globalThis.fetch = vi.fn();

// Mock console methods
console.warn = vi.fn();
console.error = vi.fn();

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();
