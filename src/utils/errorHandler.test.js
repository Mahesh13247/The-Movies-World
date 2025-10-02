// Tests for error handling utilities
import { describe, it, expect, beforeEach, vi } from "vitest";
import { toast } from "react-toastify";
import {
  AppError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  handleError,
  withErrorHandler,
  retryOperation,
} from "./errorHandler.js";

// Mock react-toastify
vi.mock("react-toastify", () => ({
  toast: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("Error Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console mocks
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  describe("AppError class", () => {
    it("should create an AppError with all properties", () => {
      const originalError = new Error("Original error");
      const appError = new AppError(
        "Test error",
        ERROR_TYPES.API,
        ERROR_SEVERITY.HIGH,
        originalError
      );

      expect(appError.message).toBe("Test error");
      expect(appError.type).toBe(ERROR_TYPES.API);
      expect(appError.severity).toBe(ERROR_SEVERITY.HIGH);
      expect(appError.originalError).toBe(originalError);
      expect(appError.timestamp).toBeDefined();
      expect(appError.name).toBe("AppError");
    });

    it("should create an AppError with default values", () => {
      const appError = new AppError("Test error");

      expect(appError.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(appError.severity).toBe(ERROR_SEVERITY.MEDIUM);
      expect(appError.originalError).toBe(null);
    });
  });

  describe("handleError function", () => {
    it("should show appropriate toast based on error severity", () => {
      const lowError = new AppError(
        "Low error",
        ERROR_TYPES.VALIDATION,
        ERROR_SEVERITY.LOW
      );
      const mediumError = new AppError(
        "Medium error",
        ERROR_TYPES.API,
        ERROR_SEVERITY.MEDIUM
      );
      const highError = new AppError(
        "High error",
        ERROR_TYPES.AUTHENTICATION,
        ERROR_SEVERITY.HIGH
      );

      handleError(lowError, { logError: false });
      expect(toast.info).toHaveBeenCalledWith("Low error");

      handleError(mediumError, { logError: false });
      expect(toast.warn).toHaveBeenCalledWith("Medium error");

      handleError(highError, { logError: false });
      expect(toast.error).toHaveBeenCalledWith("High error");
    });

    it("should use custom message when provided", () => {
      const error = new AppError("Original message");
      const customMessage = "Custom error message";

      handleError(error, { customMessage, logError: false });
      expect(toast.warn).toHaveBeenCalledWith(customMessage);
    });

    it("should not show toast when showToast is false", () => {
      const error = new AppError("Test error");

      handleError(error, { showToast: false, logError: false });
      expect(toast.warn).not.toHaveBeenCalled();
    });

    it("should provide user-friendly messages for standard errors", () => {
      const networkError = new Error("fetch failed");
      const apiError = new Error("HTTP 500 error");

      handleError(networkError, { logError: false });
      expect(toast.warn).toHaveBeenCalledWith(
        "Network connection issue. Please check your internet connection and try again."
      );

      handleError(apiError, { logError: false });
      expect(toast.warn).toHaveBeenCalledWith(
        "Service temporarily unavailable. Please try again in a moment."
      );
    });
  });

  describe("withErrorHandler function", () => {
    it("should execute async function and return result on success", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");

      const result = await withErrorHandler(mockFn, { logError: false });

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it("should handle errors and re-throw them", async () => {
      const error = new Error("Async error");
      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(
        withErrorHandler(mockFn, { logError: false })
      ).rejects.toThrow("Async error");
      expect(toast.warn).toHaveBeenCalled();
    });

    it("should pass custom options to error handler", async () => {
      const error = new Error("Test error");
      const mockFn = vi.fn().mockRejectedValue(error);
      const customMessage = "Custom async error";

      await expect(
        withErrorHandler(mockFn, { customMessage, logError: false })
      ).rejects.toThrow();

      expect(toast.warn).toHaveBeenCalledWith(customMessage);
    });
  });

  describe("retryOperation function", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");

      const result = await retryOperation(mockFn, 3, 10);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it("should retry failed operations", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockRejectedValueOnce(new Error("Second failure"))
        .mockResolvedValue("success");

      const result = await retryOperation(mockFn, 3, 10);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should throw AppError after max retries", async () => {
      const originalError = new Error("Persistent failure");
      const mockFn = vi.fn().mockRejectedValue(originalError);

      await expect(retryOperation(mockFn, 2, 10)).rejects.toThrow(AppError);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should wait between retries", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValue("success");

      const startTime = Date.now();
      await retryOperation(mockFn, 2, 100);
      const endTime = Date.now();

      // Should have waited at least 100ms for the retry
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("error categorization", () => {
    it("should categorize network errors correctly", () => {
      const networkError = new Error("fetch failed");
      handleError(networkError, { logError: false });

      expect(toast.warn).toHaveBeenCalledWith(
        expect.stringContaining("Network connection issue")
      );
    });

    it("should categorize API errors correctly", () => {
      const apiError = new Error("HTTP 500 error");
      handleError(apiError, { logError: false });

      expect(toast.warn).toHaveBeenCalledWith(
        expect.stringContaining("Service temporarily unavailable")
      );
    });

    it("should categorize authentication errors correctly", () => {
      const authError = new Error("unauthorized access");
      handleError(authError, { logError: false });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Authentication required")
      );
    });
  });
});
