// Real-time Data Management for Admin Panel
// This file handles live updates and interactive features

/**
 * Real-time data updater class
 */
export class RealTimeDataManager {
  constructor() {
    this.updateInterval = null;
    this.listeners = new Map();
    this.isActive = false;
  }

  /**
   * Start real-time updates
   */
  start(updateCallback, interval = 30000) { // Update every 30 seconds
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateInterval = setInterval(() => {
      if (updateCallback && typeof updateCallback === 'function') {
        updateCallback();
      }
    }, interval);
  }

  /**
   * Stop real-time updates
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isActive = false;
  }

  /**
   * Add listener for specific data type
   */
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of data changes
   */
  notifyListeners(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }
}

/**
 * Generate live activity data
 */
export const generateLiveActivity = () => {
  const activities = [
    { type: 'movie_view', icon: '🎬', message: 'New movie viewed', time: 'Just now' },
    { type: 'user_login', icon: '👤', message: 'User logged in', time: '2 min ago' },
    { type: 'favorite_added', icon: '❤️', message: 'Movie added to favorites', time: '5 min ago' },
    { type: 'search_query', icon: '🔍', message: 'Search performed', time: '8 min ago' },
    { type: 'rating_given', icon: '⭐', message: 'Movie rated', time: '12 min ago' },
    { type: 'playlist_created', icon: '📝', message: 'New playlist created', time: '15 min ago' }
  ];

  // Randomly select 3-5 activities
  const selectedActivities = [];
  const count = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * activities.length);
    selectedActivities.push({
      ...activities[randomIndex],
      id: Date.now() + i,
      timestamp: Date.now() - (i * 60000) // Each activity 1 minute apart
    });
  }

  return selectedActivities;
};

/**
 * Generate real-time statistics
 */
export const generateRealTimeStats = () => {
  const baseTime = Date.now();
  
  return {
    activeUsers: Math.floor(Math.random() * 50) + 10,
    currentViews: Math.floor(Math.random() * 100) + 20,
    searchesPerMinute: Math.floor(Math.random() * 15) + 5,
    serverLoad: Math.floor(Math.random() * 30) + 70, // 70-100%
    responseTime: Math.floor(Math.random() * 50) + 100, // 100-150ms
    errorRate: (Math.random() * 2).toFixed(2), // 0-2%
    timestamp: baseTime
  };
};

/**
 * Generate trending data
 */
export const generateTrendingData = () => {
  const trendingMovies = [
    'Avengers: Endgame', 'The Dark Knight', 'Inception', 'Interstellar',
    'Pulp Fiction', 'The Matrix', 'Forrest Gump', 'The Godfather',
    'Titanic', 'Avatar', 'Spider-Man', 'Iron Man', 'Batman Begins'
  ];

  const trending = [];
  const count = Math.min(5, trendingMovies.length);
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * trendingMovies.length);
    const movie = trendingMovies[randomIndex];
    
    trending.push({
      rank: i + 1,
      title: movie,
      views: Math.floor(Math.random() * 500) + 100,
      change: Math.floor(Math.random() * 20) - 10 // -10 to +10
    });
    
    // Remove selected movie to avoid duplicates
    trendingMovies.splice(randomIndex, 1);
  }

  return trending;
};

/**
 * Generate performance metrics
 */
export const generatePerformanceMetrics = () => {
  const hours = 24;
  const metrics = [];
  
  for (let i = 0; i < hours; i++) {
    const hour = new Date();
    hour.setHours(hour.getHours() - (hours - i - 1));
    
    metrics.push({
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      views: Math.floor(Math.random() * 200) + 50,
      users: Math.floor(Math.random() * 50) + 10,
      errors: Math.floor(Math.random() * 5),
      responseTime: Math.floor(Math.random() * 100) + 80
    });
  }
  
  return metrics;
};

/**
 * System health checker
 */
export const checkSystemHealth = () => {
  const metrics = {
    cpu: Math.floor(Math.random() * 40) + 30, // 30-70%
    memory: Math.floor(Math.random() * 50) + 40, // 40-90%
    disk: Math.floor(Math.random() * 30) + 50, // 50-80%
    network: Math.floor(Math.random() * 20) + 80, // 80-100%
  };

  const overall = Math.floor((metrics.cpu + metrics.memory + metrics.disk + metrics.network) / 4);
  
  let status = 'excellent';
  if (overall < 60) status = 'poor';
  else if (overall < 75) status = 'fair';
  else if (overall < 90) status = 'good';

  return {
    ...metrics,
    overall,
    status,
    timestamp: Date.now()
  };
};

/**
 * Generate user activity heatmap data
 */
export const generateActivityHeatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const heatmapData = [];
  
  days.forEach((day, dayIndex) => {
    hours.forEach(hour => {
      // Simulate higher activity during evening hours and weekends
      let baseActivity = Math.random() * 20;
      
      // Evening boost (6 PM - 11 PM)
      if (hour >= 18 && hour <= 23) {
        baseActivity += Math.random() * 30;
      }
      
      // Weekend boost
      if (dayIndex >= 5) {
        baseActivity += Math.random() * 15;
      }
      
      heatmapData.push({
        day,
        hour,
        activity: Math.floor(baseActivity),
        dayIndex,
        hourIndex: hour
      });
    });
  });
  
  return heatmapData;
};

/**
 * Generate geographic distribution data
 */
export const generateGeographicData = () => {
  const countries = [
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
    { name: 'Mexico', code: 'MX', flag: '🇲🇽' }
  ];

  let remainingPercentage = 100;
  const geoData = [];

  countries.forEach((country, index) => {
    let percentage;
    
    if (index === countries.length - 1) {
      percentage = remainingPercentage;
    } else {
      const maxPercentage = Math.min(remainingPercentage - (countries.length - index - 1), 
                                   remainingPercentage * 0.4);
      percentage = Math.floor(Math.random() * maxPercentage) + 1;
      remainingPercentage -= percentage;
    }

    if (percentage > 0) {
      geoData.push({
        ...country,
        percentage,
        users: Math.floor(percentage * 10) + Math.floor(Math.random() * 50)
      });
    }
  });

  return geoData.sort((a, b) => b.percentage - a.percentage);
};

/**
 * Create singleton instance
 */
export const realTimeManager = new RealTimeDataManager();

/**
 * Utility function to format numbers
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Utility function to calculate percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
};

/**
 * Generate notification data
 */
export const generateNotifications = () => {
  const notifications = [
    {
      id: Date.now() + 1,
      type: 'info',
      icon: '📊',
      title: 'Weekly Report Ready',
      message: 'Your weekly analytics report is now available',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: Date.now() + 2,
      type: 'success',
      icon: '💾',
      title: 'Backup Completed',
      message: 'Daily backup completed successfully',
      time: '1 hour ago',
      unread: true
    },
    {
      id: Date.now() + 3,
      type: 'warning',
      icon: '⚠️',
      title: 'High Server Load',
      message: 'Server load is above 85%. Consider optimization.',
      time: '2 hours ago',
      unread: false
    },
    {
      id: Date.now() + 4,
      type: 'info',
      icon: '👥',
      title: 'New User Registrations',
      message: '25 new users registered today',
      time: '3 hours ago',
      unread: false
    }
  ];

  return notifications;
};

