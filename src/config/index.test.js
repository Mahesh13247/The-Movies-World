// Tests for configuration module
import { describe, it, expect, beforeEach, vi } from "vitest";
import { config } from "./index.js";

describe("Configuration Module", () => {
  beforeEach(() => {
    // Reset console mocks
    vi.clearAllMocks();
  });

  describe("config object", () => {
    it("should have all required configuration sections", () => {
      expect(config).toHaveProperty("api");
      expect(config).toHaveProperty("app");
      expect(config).toHaveProperty("security");
      expect(config).toHaveProperty("features");
      expect(config).toHaveProperty("performance");
      expect(config).toHaveProperty("services");
      expect(config).toHaveProperty("streaming");
    });

    it("should have valid API configuration", () => {
      expect(config.api).toHaveProperty("key");
      expect(config.api).toHaveProperty("baseUrl");
      expect(config.api).toHaveProperty("cacheTimeout");
      expect(typeof config.api.cacheTimeout).toBe("number");
    });

    it("should have valid app configuration", () => {
      expect(config.app).toHaveProperty("name");
      expect(config.app).toHaveProperty("version");
      expect(config.app).toHaveProperty("environment");
      expect(config.app).toHaveProperty("isDevelopment");
      expect(config.app).toHaveProperty("isProduction");
      expect(typeof config.app.isDevelopment).toBe("boolean");
      expect(typeof config.app.isProduction).toBe("boolean");
    });

    it("should have valid security configuration", () => {
      expect(config.security).toHaveProperty("enableDevToolsBlocking");
      expect(config.security).toHaveProperty("defaultAdminPin");
      expect(typeof config.security.enableDevToolsBlocking).toBe("boolean");
      expect(typeof config.security.defaultAdminPin).toBe("string");
    });

    it("should have valid feature flags", () => {
      expect(config.features).toHaveProperty("enableAdultSection");
      expect(config.features).toHaveProperty("enablePWA");
      expect(config.features).toHaveProperty("enableOfflineMode");
      expect(typeof config.features.enableAdultSection).toBe("boolean");
      expect(typeof config.features.enablePWA).toBe("boolean");
      expect(typeof config.features.enableOfflineMode).toBe("boolean");
    });

    it("should have valid performance settings", () => {
      expect(config.performance).toHaveProperty("searchDebounceDelay");
      expect(config.performance).toHaveProperty("infiniteScrollThreshold");
      expect(typeof config.performance.searchDebounceDelay).toBe("number");
      expect(typeof config.performance.infiniteScrollThreshold).toBe("number");
      expect(config.performance.searchDebounceDelay).toBeGreaterThan(0);
      expect(config.performance.infiniteScrollThreshold).toBeGreaterThan(0);
    });

    it("should have valid streaming configuration", () => {
      expect(config.streaming).toHaveProperty("primarySource");
      expect(config.streaming).toHaveProperty("fallbackSources");
      expect(typeof config.streaming.primarySource).toBe("string");
      expect(Array.isArray(config.streaming.fallbackSources)).toBe(true);
    });
  });

  describe("environment handling", () => {
    it("should use test environment variables", () => {
      expect(config.api.key).toBe("test-api-key");
      expect(config.api.baseUrl).toBe("https://api.themoviedb.org/3");
      expect(config.app.name).toBe("Movie Finder Test");
    });

    it("should handle boolean environment variables correctly", () => {
      expect(config.security.enableDevToolsBlocking).toBe(false);
      expect(config.features.enableAdultSection).toBe(true);
      expect(config.features.enablePWA).toBe(false);
    });

    it("should handle numeric environment variables correctly", () => {
      expect(config.performance.searchDebounceDelay).toBe(100);
      expect(config.performance.infiniteScrollThreshold).toBe(200);
      expect(config.api.cacheTimeout).toBe(300000);
    });

    it("should handle array environment variables correctly", () => {
      expect(config.streaming.fallbackSources).toEqual(["flixhq", "mat6tube"]);
    });
  });

  describe("validation", () => {
    it("should have required API configuration", () => {
      expect(config.api.key).toBeTruthy();
      expect(config.api.baseUrl).toBeTruthy();
      expect(config.api.baseUrl).toMatch(/^https?:\/\//);
    });

    it("should have reasonable performance defaults", () => {
      expect(config.performance.searchDebounceDelay).toBeGreaterThanOrEqual(50);
      expect(config.performance.searchDebounceDelay).toBeLessThanOrEqual(1000);
      expect(config.performance.infiniteScrollThreshold).toBeGreaterThanOrEqual(
        100
      );
      expect(config.performance.infiniteScrollThreshold).toBeLessThanOrEqual(
        500
      );
    });
  });
});
