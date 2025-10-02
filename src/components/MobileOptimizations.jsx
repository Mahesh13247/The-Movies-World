import React, { useEffect, useState } from 'react';

/**
 * Mobile Optimizations Component
 * Handles mobile-specific features and optimizations
 */
export const MobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      const landscape = window.innerWidth > window.innerHeight;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(mobile);
      setIsLandscape(landscape);
      setTouchDevice(touch);
      
      // Add classes to body for CSS targeting
      document.body.classList.toggle('mobile-device', mobile);
      document.body.classList.toggle('landscape-mode', landscape && mobile);
      document.body.classList.toggle('touch-device', touch);
    };

    // Initial check
    checkMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100); // Delay to ensure accurate measurements
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  useEffect(() => {
    // Prevent zoom on double tap for iOS
    if (touchDevice) {
      let lastTouchEnd = 0;
      const preventZoom = (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };
      
      document.addEventListener('touchend', preventZoom, { passive: false });
      
      return () => {
        document.removeEventListener('touchend', preventZoom);
      };
    }
  }, [touchDevice]);

  useEffect(() => {
    // Add viewport meta tag for proper mobile scaling
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    // Set optimal viewport settings
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Add theme-color meta tag for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = '#667eea';
      document.head.appendChild(themeColorMeta);
    }
    
    // Add apple-mobile-web-app-capable for iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-capable';
      appleMeta.content = 'yes';
      document.head.appendChild(appleMeta);
    }
    
    // Add apple-mobile-web-app-status-bar-style
    let appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusMeta) {
      appleStatusMeta = document.createElement('meta');
      appleStatusMeta.name = 'apple-mobile-web-app-status-bar-style';
      appleStatusMeta.content = 'black-translucent';
      document.head.appendChild(appleStatusMeta);
    }
  }, []);

  // This component doesn't render anything visible
  return null;
};

/**
 * Mobile Navigation Helper Hook
 */
export const useMobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  const switchTab = (tab) => {
    setActiveTab(tab);
    closeMenu();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu')) {
        closeMenu();
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return {
    isMenuOpen,
    activeTab,
    toggleMenu,
    closeMenu,
    switchTab
  };
};

/**
 * Touch Gesture Handler Hook
 */
export const useTouchGestures = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      endX = e.touches[0].clientX;
      endY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
};

/**
 * Mobile Performance Optimizer Hook
 */
export const useMobilePerformance = () => {
  useEffect(() => {
    // Optimize scrolling performance
    const optimizeScrolling = () => {
      const scrollElements = document.querySelectorAll('[data-scroll-optimize]');
      scrollElements.forEach(element => {
        element.style.transform = 'translateZ(0)';
        element.style.willChange = 'transform';
      });
    };

    // Debounce resize events
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Trigger custom resize event
        window.dispatchEvent(new CustomEvent('optimizedResize'));
      }, 250);
    };

    // Optimize images for mobile
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-mobile-optimize]');
      images.forEach(img => {
        if (window.innerWidth <= 768) {
          // Add loading="lazy" for better performance
          img.loading = 'lazy';
          // Add smaller image sizes for mobile if available
          if (img.dataset.mobileSrc) {
            img.src = img.dataset.mobileSrc;
          }
        }
      });
    };

    optimizeScrolling();
    optimizeImages();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', optimizeImages);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', optimizeImages);
      clearTimeout(resizeTimeout);
    };
  }, []);
};

/**
 * Mobile Keyboard Handler Hook
 */
export const useMobileKeyboard = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Detect virtual keyboard on mobile
      const heightDifference = window.screen.height - window.visualViewport?.height;
      const isKeyboardVisible = heightDifference > 150; // Threshold for keyboard detection
      
      setKeyboardVisible(isKeyboardVisible);
      document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return { keyboardVisible };
};

/**
 * Safe Area Handler for devices with notches
 */
export const useSafeArea = () => {
  useEffect(() => {
    // Add CSS custom properties for safe area insets
    const updateSafeArea = () => {
      const root = document.documentElement;
      
      // Check if safe area insets are supported
      if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
        root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
      } else {
        // Fallback for older devices
        root.style.setProperty('--safe-area-top', '0px');
        root.style.setProperty('--safe-area-right', '0px');
        root.style.setProperty('--safe-area-bottom', '0px');
        root.style.setProperty('--safe-area-left', '0px');
      }
    };

    updateSafeArea();
    
    // Update on orientation change
    window.addEventListener('orientationchange', updateSafeArea);
    
    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);
};

export default MobileOptimizations;

