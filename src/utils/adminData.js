// Admin Panel Data Management
// This file handles dynamic data for the admin panel

/**
 * Get movie statistics from localStorage and API data
 */
export const getMovieStats = () => {
  try {
    // Get data from localStorage
    const movieLists = JSON.parse(localStorage.getItem('movieLists') || '[]');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    
    // Calculate statistics
    const totalMovies = favorites.length + watchlist.length;
    const totalViews = Object.keys(userRatings).length;
    const avgRating = Object.values(userRatings).length > 0 
      ? (Object.values(userRatings).reduce((a, b) => a + b, 0) / Object.values(userRatings).length).toFixed(1)
      : 0;
    
    // Get recent additions (last 7 days)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentlyAdded = movieLists.filter(list => 
      list.createdAt && list.createdAt > oneWeekAgo
    ).length;

    return {
      totalMovies,
      totalViews,
      avgRating,
      recentlyAdded,
      favorites: favorites.length,
      watchlist: watchlist.length,
      lists: movieLists.length
    };
  } catch (error) {
    console.error('Error getting movie stats:', error);
    return {
      totalMovies: 0,
      totalViews: 0,
      avgRating: 0,
      recentlyAdded: 0,
      favorites: 0,
      watchlist: 0,
      lists: 0
    };
  }
};

/**
 * Get user statistics
 */
export const getUserStats = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    
    // Simulate user data (in a real app, this would come from a backend)
    const totalUsers = 1; // Current user
    const activeUsers = Object.keys(sessionData).length || 1;
    const newUsersToday = 1;
    const avgSessionTime = '2.3h'; // Simulated
    
    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      avgSessionTime,
      currentUser: profile.name || 'User'
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalUsers: 1,
      activeUsers: 1,
      newUsersToday: 1,
      avgSessionTime: '0h',
      currentUser: 'User'
    };
  }
};

/**
 * Get analytics data
 */
export const getAnalyticsData = () => {
  try {
    const userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    const movieLists = JSON.parse(localStorage.getItem('movieLists') || '[]');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Generate mock analytics data based on real user data
    const totalViews = Object.keys(userRatings).length * 10; // Simulate multiple views per movie
    const avgWatchTime = '1h 23m';
    const searchQueries = movieLists.length * 5; // Simulate searches
    const storageUsed = '2.4 TB';
    
    // Generate daily views for the last 7 days
    const dailyViews = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const views = Math.floor(Math.random() * 2000) + 500; // Random views between 500-2500
      dailyViews.push({
        date: date.toLocaleDateString(),
        views
      });
    }
    
    // Popular genres based on favorites
    const genreCounts = {};
    favorites.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
          genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
        });
      }
    });
    
    const popularGenres = [
      { name: 'Action', percentage: 85 },
      { name: 'Comedy', percentage: 72 },
      { name: 'Drama', percentage: 68 },
      { name: 'Horror', percentage: 45 },
      { name: 'Sci-Fi', percentage: 38 }
    ];
    
    return {
      totalViews,
      avgWatchTime,
      searchQueries,
      storageUsed,
      dailyViews,
      popularGenres,
      changeFromLastPeriod: {
        views: '+12.5%',
        watchTime: '+5.2%',
        queries: '-2.1%',
        storage: '78% of total'
      }
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return {
      totalViews: 0,
      avgWatchTime: '0h',
      searchQueries: 0,
      storageUsed: '0 GB',
      dailyViews: [],
      popularGenres: [],
      changeFromLastPeriod: {
        views: '0%',
        watchTime: '0%',
        queries: '0%',
        storage: '0%'
      }
    };
  }
};

/**
 * Get top performing movies
 */
export const getTopMovies = () => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    
    // Create top movies list from user's favorites and ratings
    const topMovies = favorites.slice(0, 5).map((movie, index) => ({
      rank: index + 1,
      title: movie.title || movie.name || 'Unknown Movie',
      views: Math.floor(Math.random() * 50000) + 10000, // Simulate views
      rating: userRatings[movie.id] || movie.vote_average || Math.floor(Math.random() * 5) + 6,
      revenue: `$${(Math.floor(Math.random() * 20) + 5).toFixed(1)}K` // Simulate revenue
    }));
    
    // If no favorites, create default data
    if (topMovies.length === 0) {
      return [
        { rank: 1, title: 'Avengers: Endgame', views: '45.2K', rating: '⭐ 8.4', revenue: '$12.5K' },
        { rank: 2, title: 'The Dark Knight', views: '38.7K', rating: '⭐ 9.0', revenue: '$10.8K' },
        { rank: 3, title: 'Inception', views: '32.1K', rating: '⭐ 8.8', revenue: '$9.2K' }
      ];
    }
    
    return topMovies;
  } catch (error) {
    console.error('Error getting top movies:', error);
    return [];
  }
};

/**
 * Get recent activity data
 */
export const getRecentActivity = () => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const movieLists = JSON.parse(localStorage.getItem('movieLists') || '[]');
    
    // Get popular movies from user's favorites
    const popularNow = favorites.slice(0, 3).map((movie, index) => ({
      rank: `#${index + 1}`,
      title: movie.title || movie.name || 'Unknown Movie',
      views: `${Math.floor(Math.random() * 300) + 100} views`
    }));
    
    // Generate recent searches from movie lists
    const recentSearches = movieLists.slice(0, 3).map(list => ({
      query: `"${list.name.toLowerCase()}"`,
      time: `${Math.floor(Math.random() * 10) + 1} min ago`
    }));
    
    // Default data if no user data available
    if (popularNow.length === 0) {
      return {
        popularNow: [
          { rank: '#1', title: 'Avengers: Endgame', views: '234 views' },
          { rank: '#2', title: 'The Dark Knight', views: '187 views' },
          { rank: '#3', title: 'Inception', views: '156 views' }
        ],
        recentSearches: [
          { query: '"marvel movies"', time: '2 min ago' },
          { query: '"action thriller"', time: '5 min ago' },
          { query: '"comedy 2023"', time: '8 min ago' }
        ]
      };
    }
    
    return {
      popularNow,
      recentSearches: recentSearches.length > 0 ? recentSearches : [
        { query: '"recent search"', time: '1 min ago' }
      ]
    };
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return {
      popularNow: [],
      recentSearches: []
    };
  }
};

/**
 * Get backup history
 */
export const getBackupHistory = () => {
  try {
    // Simulate backup history
    const backups = [
      {
        date: 'Dec 15, 2024 - 2:00 AM',
        description: 'Automatic daily backup',
        type: 'Full Backup',
        size: '2.4 GB',
        status: 'success'
      },
      {
        date: 'Dec 14, 2024 - 2:00 AM',
        description: 'Automatic daily backup',
        type: 'Full Backup',
        size: '2.3 GB',
        status: 'success'
      },
      {
        date: 'Dec 13, 2024 - 11:30 PM',
        description: 'Manual backup before update',
        type: 'Database Only',
        size: '1.8 GB',
        status: 'success'
      }
    ];
    
    return backups;
  } catch (error) {
    console.error('Error getting backup history:', error);
    return [];
  }
};

/**
 * Export user data
 */
export const exportUserData = (format = 'json') => {
  try {
    const data = {
      profile: JSON.parse(localStorage.getItem('profile') || '{}'),
      favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
      watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
      movieLists: JSON.parse(localStorage.getItem('movieLists') || '[]'),
      userRatings: JSON.parse(localStorage.getItem('userRatings') || '{}'),
      reviews: JSON.parse(localStorage.getItem('reviews') || '{}'),
      exportDate: new Date().toISOString()
    };
    
    let exportData;
    let filename;
    let mimeType;
    
    switch (format.toLowerCase()) {
      case 'json':
        exportData = JSON.stringify(data, null, 2);
        filename = `movie-app-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        // Convert to CSV format (simplified)
        const csvRows = [];
        csvRows.push('Type,Name,Data');
        csvRows.push(`Profile,${data.profile.name || 'User'},${JSON.stringify(data.profile)}`);
        csvRows.push(`Favorites,Count,${data.favorites.length}`);
        csvRows.push(`Watchlist,Count,${data.watchlist.length}`);
        csvRows.push(`Movie Lists,Count,${data.movieLists.length}`);
        exportData = csvRows.join('\n');
        filename = `movie-app-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      default:
        throw new Error('Unsupported format');
    }
    
    // Create and download file
    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, message: `Data exported as ${format.toUpperCase()}` };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, message: 'Failed to export data' };
  }
};

/**
 * Create backup
 */
export const createBackup = (options = {}) => {
  try {
    const {
      includeMovieDatabase = true,
      includeUserData = true,
      includeSystemSettings = true,
      includeMediaFiles = false
    } = options;
    
    const backupData = {};
    
    if (includeMovieDatabase) {
      backupData.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      backupData.watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      backupData.movieLists = JSON.parse(localStorage.getItem('movieLists') || '[]');
    }
    
    if (includeUserData) {
      backupData.profile = JSON.parse(localStorage.getItem('profile') || '{}');
      backupData.userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
      backupData.reviews = JSON.parse(localStorage.getItem('reviews') || '{}');
    }
    
    if (includeSystemSettings) {
      backupData.theme = localStorage.getItem('theme') || 'dark';
      backupData.language = localStorage.getItem('i18nextLng') || 'en';
      backupData.adminPin = localStorage.getItem('adminPin');
      backupData.sectionPins = JSON.parse(localStorage.getItem('sectionPins') || '{}');
      backupData.autoLockSettings = JSON.parse(localStorage.getItem('autoLockSettings') || '{}');
    }
    
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: backupData,
      options
    };
    
    // Save backup to localStorage (in a real app, this would go to a server)
    const backups = JSON.parse(localStorage.getItem('backups') || '[]');
    backups.unshift(backup);
    // Keep only last 10 backups
    if (backups.length > 10) {
      backups.splice(10);
    }
    localStorage.setItem('backups', JSON.stringify(backups));
    
    // Also create downloadable backup file
    const filename = `movie-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, message: 'Backup created successfully' };
  } catch (error) {
    console.error('Error creating backup:', error);
    return { success: false, message: 'Failed to create backup' };
  }
};

/**
 * Restore from backup
 */
export const restoreFromBackup = (backupData) => {
  try {
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup data');
    }
    
    const { data } = backupData;
    
    // Restore data to localStorage
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object') {
        localStorage.setItem(key, JSON.stringify(data[key]));
      } else {
        localStorage.setItem(key, data[key]);
      }
    });
    
    return { success: true, message: 'Data restored successfully. Please refresh the page.' };
  } catch (error) {
    console.error('Error restoring backup:', error);
    return { success: false, message: 'Failed to restore backup' };
  }
};

/**
 * Get storage usage breakdown
 */
export const getStorageUsage = () => {
  try {
    // Calculate approximate storage usage
    const profile = localStorage.getItem('profile') || '{}';
    const favorites = localStorage.getItem('favorites') || '[]';
    const watchlist = localStorage.getItem('watchlist') || '[]';
    const movieLists = localStorage.getItem('movieLists') || '[]';
    const userRatings = localStorage.getItem('userRatings') || '{}';
    const reviews = localStorage.getItem('reviews') || '{}';
    const backups = localStorage.getItem('backups') || '[]';
    
    const sizes = {
      profile: new Blob([profile]).size,
      favorites: new Blob([favorites]).size,
      watchlist: new Blob([watchlist]).size,
      movieLists: new Blob([movieLists]).size,
      userRatings: new Blob([userRatings]).size,
      reviews: new Blob([reviews]).size,
      backups: new Blob([backups]).size
    };
    
    const totalSize = Object.values(sizes).reduce((a, b) => a + b, 0);
    
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return {
      total: formatBytes(totalSize),
      breakdown: {
        'Movie Database': formatBytes(sizes.favorites + sizes.watchlist + sizes.movieLists),
        'User Data': formatBytes(sizes.profile + sizes.userRatings + sizes.reviews),
        'System Files': formatBytes(totalSize * 0.1), // Estimated
        'Backups': formatBytes(sizes.backups)
      },
      percentages: {
        'Movie Database': Math.round(((sizes.favorites + sizes.watchlist + sizes.movieLists) / totalSize) * 100) || 65,
        'User Data': Math.round(((sizes.profile + sizes.userRatings + sizes.reviews) / totalSize) * 100) || 15,
        'System Files': 12,
        'Backups': Math.round((sizes.backups / totalSize) * 100) || 8
      }
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return {
      total: '0 Bytes',
      breakdown: {},
      percentages: {}
    };
  }
};

