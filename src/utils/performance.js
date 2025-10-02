// Performance monitoring and optimization utilities
import React from "react";
import { config } from "../config";

/**
 * Web Vitals tracking
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = this.checkSupport();

    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  /**
   * Check if performance monitoring is supported
   */
  checkSupport() {
    return (
      typeof window !== "undefined" &&
      "performance" in window &&
      "PerformanceObserver" in window
    );
  }

  /**
   * Initialize performance observers
   */
  initializeObservers() {
    // Largest Contentful Paint
    this.observeLCP();

    // First Input Delay
    this.observeFID();

    // Cumulative Layout Shift
    this.observeCLS();

    // First Contentful Paint
    this.observeFCP();

    // Time to First Byte
    this.observeTTFB();
  }

  /**
   * Observe Largest Contentful Paint
   */
  observeLCP() {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric("LCP", lastEntry.startTime);
    });

    try {
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.set("LCP", observer);
    } catch (error) {
      console.warn("LCP observer not supported:", error);
    }
  }

  /**
   * Observe First Input Delay
   */
  observeFID() {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        this.recordMetric("FID", entry.processingStart - entry.startTime);
      });
    });

    try {
      observer.observe({ entryTypes: ["first-input"] });
      this.observers.set("FID", observer);
    } catch (error) {
      console.warn("FID observer not supported:", error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  observeCLS() {
    let clsValue = 0;
    let clsEntries = [];

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();

      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      });

      this.recordMetric("CLS", clsValue);
    });

    try {
      observer.observe({ entryTypes: ["layout-shift"] });
      this.observers.set("CLS", observer);
    } catch (error) {
      console.warn("CLS observer not supported:", error);
    }
  }

  /**
   * Observe First Contentful Paint
   */
  observeFCP() {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          this.recordMetric("FCP", entry.startTime);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ["paint"] });
      this.observers.set("FCP", observer);
    } catch (error) {
      console.warn("FCP observer not supported:", error);
    }
  }

  /**
   * Observe Time to First Byte
   */
  observeTTFB() {
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.recordMetric("TTFB", ttfb);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.metrics.set(name, metric);

    // Log in development
    if (config.app.isDevelopment) {
      console.log(`Performance Metric - ${name}:`, value);
    }

    // Send to analytics in production
    if (config.app.isProduction && config.services.analyticsId) {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Send metrics to analytics service
   */
  sendToAnalytics(metric) {
    // Example: Send to Google Analytics 4
    if (window.gtag) {
      window.gtag("event", metric.name, {
        custom_map: { metric_value: metric.value },
        metric_value: metric.value,
      });
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Get performance score based on Web Vitals thresholds
   */
  getPerformanceScore() {
    const metrics = this.getMetrics();
    let score = 100;

    // LCP: Good < 2.5s, Poor > 4s
    if (metrics.LCP) {
      if (metrics.LCP.value > 4000) score -= 30;
      else if (metrics.LCP.value > 2500) score -= 15;
    }

    // FID: Good < 100ms, Poor > 300ms
    if (metrics.FID) {
      if (metrics.FID.value > 300) score -= 25;
      else if (metrics.FID.value > 100) score -= 10;
    }

    // CLS: Good < 0.1, Poor > 0.25
    if (metrics.CLS) {
      if (metrics.CLS.value > 0.25) score -= 25;
      else if (metrics.CLS.value > 0.1) score -= 10;
    }

    // FCP: Good < 1.8s, Poor > 3s
    if (metrics.FCP) {
      if (metrics.FCP.value > 3000) score -= 20;
      else if (metrics.FCP.value > 1800) score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Disconnect all observers
   */
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Custom hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const [monitor] = React.useState(() => new PerformanceMonitor());
  const [metrics, setMetrics] = React.useState({});

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    // Update immediately
    updateMetrics();

    return () => {
      clearInterval(interval);
      monitor.disconnect();
    };
  }, [monitor]);

  return {
    metrics,
    score: monitor.getPerformanceScore(),
    isSupported: monitor.isSupported,
  };
};

/**
 * Mark custom performance timings
 */
export const markPerformance = (name) => {
  if ("performance" in window && "mark" in performance) {
    performance.mark(name);
  }
};

/**
 * Measure time between two marks
 */
export const measurePerformance = (name, startMark, endMark) => {
  if ("performance" in window && "measure" in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure ? measure.duration : null;
    } catch (error) {
      console.warn("Performance measurement failed:", error);
      return null;
    }
  }
  return null;
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = () => {
  if ("memory" in performance) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      percentage:
        (performance.memory.usedJSHeapSize /
          performance.memory.totalJSHeapSize) *
        100,
    };
  }
  return null;
};

/**
 * Bundle size analyzer helper
 */
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );

  return {
    scripts: scripts.length,
    styles: styles.length,
    estimatedSize: scripts.length * 50 + styles.length * 10, // Rough estimate in KB
  };
};

/**
 * Network information (if available)
 */
export const getNetworkInfo = () => {
  if ("navigator" in window && "connection" in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
};

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
