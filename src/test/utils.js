// Test utilities and custom render functions
import { render } from "@testing-library/react";
import { AppProvider } from "../context/AppContext";
import { vi } from "vitest";

// Mock movie data for testing
export const mockMovie = {
  id: 1,
  title: "Test Movie",
  overview: "A test movie for unit testing",
  poster_path: "/test-poster.jpg",
  backdrop_path: "/test-backdrop.jpg",
  release_date: "2024-01-01",
  vote_average: 8.5,
  vote_count: 1000,
  genre_ids: [28, 12],
};

export const mockMovies = [
  mockMovie,
  {
    id: 2,
    title: "Another Test Movie",
    overview: "Another test movie",
    poster_path: "/test-poster-2.jpg",
    backdrop_path: "/test-backdrop-2.jpg",
    release_date: "2024-02-01",
    vote_average: 7.2,
    vote_count: 500,
    genre_ids: [35, 18],
  },
];

export const mockGenres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
];

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

export const mockApiError = (status = 500, message = "Server Error") => ({
  ok: false,
  status,
  statusText: message,
  json: async () => {
    throw new Error("Invalid JSON");
  },
  text: async () => message,
});

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;

  // Mock the useAppContext hook if needed
  const Wrapper = ({ children }) => (
    <AppProvider initialState={initialState}>{children}</AppProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock translation function
export const mockT = (key) => key;

// Mock react-i18next
export const mockUseTranslation = () => ({
  t: mockT,
  i18n: {
    language: "en",
    changeLanguage: vi.fn(),
  },
});

// Helper to wait for async operations
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock intersection observer entry
export const mockIntersectionObserverEntry = (isIntersecting = true) => ({
  isIntersecting,
  intersectionRatio: isIntersecting ? 1 : 0,
  target: document.createElement("div"),
  boundingClientRect: {},
  intersectionRect: {},
  rootBounds: {},
  time: Date.now(),
});

// Mock window resize
export const mockWindowResize = (width = 1024, height = 768) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event("resize"));
};

// Mock scroll event
export const mockScroll = (scrollY = 0) => {
  Object.defineProperty(window, "scrollY", {
    writable: true,
    configurable: true,
    value: scrollY,
  });

  Object.defineProperty(document.documentElement, "scrollTop", {
    writable: true,
    configurable: true,
    value: scrollY,
  });

  window.dispatchEvent(new Event("scroll"));
};

// Mock user preferences
export const mockUserPreferences = (preferences = {}) => {
  const defaultPreferences = {
    theme: "dark",
    language: "en",
    autoplay: true,
    notifications: true,
    ...preferences,
  };

  return defaultPreferences;
};

// Create mock event
export const createMockEvent = (type = "click", properties = {}) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, properties);
  return event;
};

export default {
  mockMovie,
  mockMovies,
  mockGenres,
  mockApiResponse,
  mockApiError,
  renderWithProviders,
  mockT,
  mockUseTranslation,
  waitForAsync,
  mockIntersectionObserverEntry,
  mockWindowResize,
  mockScroll,
  mockUserPreferences,
  createMockEvent,
};
