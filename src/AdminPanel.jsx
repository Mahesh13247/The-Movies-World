import React, { useState, useEffect } from "react";
import "./AdminPanel.css";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { 
  isAdmin, 
  isUser, 
  switchToAdmin, 
  switchToUser, 
  changeAdminPin,
  setSectionPin,
  resetSectionPin,
  getAllSectionPins,
  updateAutoLockSettings,
  getAutoLockSettings,
  resetAdminPinToDefault,
  getSystemInfo
} from "./utils/userRoles";
import {
  getMovieStats,
  getUserStats,
  getAnalyticsData,
  getTopMovies,
  getRecentActivity,
  getBackupHistory,
  exportUserData,
  createBackup,
  restoreFromBackup,
  getStorageUsage
} from "./utils/adminData";
import {
  realTimeManager,
  generateLiveActivity,
  generateRealTimeStats,
  generateTrendingData,
  generatePerformanceMetrics,
  checkSystemHealth,
  generateActivityHeatmap,
  generateGeographicData,
  generateNotifications
} from "./utils/realTimeData";
import {
  LineChart,
  BarChart,
  ActivityFeed,
  SystemHealthMonitor,
  GeographicMap,
  RealTimeStats
} from "./components/InteractiveCharts";
import {
  NotificationSystem,
  ToastNotification,
  AlertBanner,
  SystemStatusIndicator,
  LiveActivityTicker
} from "./components/NotificationSystem";
import { MovieManagement } from "./components/MovieManagement";
import { MobileOptimizations, useMobilePerformance, useSafeArea } from "./components/MobileOptimizations";

function AdminPanel() {
  const { t } = useTranslation();
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    const role = localStorage.getItem('userRole') || 'user';
    return role;
  });
  const [adminPinInput, setAdminPinInput] = useState("");
  const [newAdminPin, setNewAdminPin] = useState("");
  const [confirmAdminPin, setConfirmAdminPin] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionPinValue, setSectionPinValue] = useState("");
  const [showAdminSwitch, setShowAdminSwitch] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-lock settings
  const [autoLockSettings, setAutoLockSettingsState] = useState(() => getAutoLockSettings());
  const [inactivityTimeout, setInactivityTimeout] = useState(() => Math.floor(getAutoLockSettings().inactivityTimeout / 60000));
  const [sessionTimeout, setSessionTimeout] = useState(() => Math.floor(getAutoLockSettings().sessionTimeout / 60000));
  const [autoLockEnabled, setAutoLockEnabled] = useState(() => getAutoLockSettings().enabled);
  const [systemInfo, setSystemInfo] = useState(() => getSystemInfo());

  // Enhanced admin panel state
  const [movieStats, setMovieStats] = useState(() => getMovieStats());
  const [userStats, setUserStats] = useState(() => getUserStats());
  const [analyticsData, setAnalyticsData] = useState(() => getAnalyticsData());
  const [topMovies, setTopMovies] = useState(() => getTopMovies());
  const [recentActivity, setRecentActivity] = useState(() => getRecentActivity());
  const [backupHistory, setBackupHistory] = useState(() => getBackupHistory());
  const [storageUsage, setStorageUsage] = useState(() => getStorageUsage());
  
  // Real-time data states
  const [liveActivity, setLiveActivity] = useState(() => generateLiveActivity());
  const [realTimeStats, setRealTimeStats] = useState(() => generateRealTimeStats());
  const [trendingData, setTrendingData] = useState(() => generateTrendingData());
  const [performanceMetrics, setPerformanceMetrics] = useState(() => generatePerformanceMetrics());
  const [systemHealth, setSystemHealth] = useState(() => checkSystemHealth());
  const [geoData, setGeoData] = useState(() => generateGeographicData());
  const [notifications, setNotifications] = useState(() => generateNotifications());
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [alertBanner, setAlertBanner] = useState(null);

  // Mobile optimizations
  useMobilePerformance();
  useSafeArea();

  // Update current user role when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUserRole(localStorage.getItem('userRole') || 'user');
      setSystemInfo(getSystemInfo());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update auto-lock settings when they change
  useEffect(() => {
    const handleSettingsChange = () => {
      const settings = getAutoLockSettings();
      setAutoLockSettingsState(settings);
      setInactivityTimeout(Math.floor(settings.inactivityTimeout / 60000));
      setSessionTimeout(Math.floor(settings.sessionTimeout / 60000));
      setAutoLockEnabled(settings.enabled);
    };
    
    window.addEventListener('storage', handleSettingsChange);
    return () => window.removeEventListener('storage', handleSettingsChange);
  }, []);

  // Refresh all admin data
  const refreshAdminData = () => {
    setMovieStats(getMovieStats());
    setUserStats(getUserStats());
    setAnalyticsData(getAnalyticsData());
    setTopMovies(getTopMovies());
    setRecentActivity(getRecentActivity());
    setBackupHistory(getBackupHistory());
    setStorageUsage(getStorageUsage());
  };

  // Refresh data when tab changes or when becoming admin
  useEffect(() => {
    if (isAdmin()) {
      refreshAdminData();
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  }, [activeTab, currentUserRole]);

  // Real-time updates management
  const startRealTimeUpdates = () => {
    if (!isRealTimeActive) {
      setIsRealTimeActive(true);
      realTimeManager.start(() => {
        setLiveActivity(generateLiveActivity());
        setRealTimeStats(generateRealTimeStats());
        setTrendingData(generateTrendingData());
        setSystemHealth(checkSystemHealth());
        
        // Update other data less frequently
        if (Math.random() < 0.3) { // 30% chance
          setPerformanceMetrics(generatePerformanceMetrics());
          setGeoData(generateGeographicData());
          refreshAdminData();
        }
      }, 5000); // Update every 5 seconds
    }
  };

  const stopRealTimeUpdates = () => {
    if (isRealTimeActive) {
      setIsRealTimeActive(false);
      realTimeManager.stop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  const handleAdminSwitch = async () => {
    if (adminPinInput.length !== 4) {
      toast.error("Admin PIN must be 4 digits");
      setAdminPinInput("");
      return;
    }

    setIsLoading(true);
    try {
      const result = switchToAdmin(adminPinInput);
      if (result.success) {
        setCurrentUserRole('admin');
        setShowAdminSwitch(false);
        setAdminPinInput("");
        setSystemInfo(getSystemInfo());
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setAdminPinInput("");
      }
    } catch (error) {
      toast.error("An error occurred while switching to admin");
      setAdminPinInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToUser = async () => {
    setIsLoading(true);
    try {
      const result = switchToUser();
      if (result.success) {
        setCurrentUserRole('user');
        setSystemInfo(getSystemInfo());
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while switching to user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAdminPin = async () => {
    if (newAdminPin !== confirmAdminPin) {
      toast.error("New PINs do not match");
      return;
    }

    if (newAdminPin.length !== 4 || !/^\d{4}$/.test(newAdminPin)) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsLoading(true);
    try {
      const result = changeAdminPin(adminPinInput, newAdminPin);
      if (result.success) {
        setAdminPinInput("");
        setNewAdminPin("");
        setConfirmAdminPin("");
        setSystemInfo(getSystemInfo());
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setAdminPinInput("");
      }
    } catch (error) {
      toast.error("An error occurred while changing admin PIN");
      setAdminPinInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAdminPin = async () => {
    setIsLoading(true);
    try {
      const result = resetAdminPinToDefault();
      if (result.success) {
        setSystemInfo(getSystemInfo());
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while resetting admin PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSectionPin = async () => {
    if (!sectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    if (sectionPinValue.length !== 4 || !/^\d{4}$/.test(sectionPinValue)) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsLoading(true);
    try {
      const result = setSectionPin(sectionName.trim(), sectionPinValue);
      if (result.success) {
        setSectionName("");
        setSectionPinValue("");
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while setting section PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSectionPin = async () => {
    if (!sectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    setIsLoading(true);
    try {
      const result = resetSectionPin(sectionName.trim());
      if (result.success) {
        setSectionName("");
        setSectionPinValue("");
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while resetting section PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLockSettingsChange = async () => {
    const settings = {
      enabled: autoLockEnabled,
      inactivityTimeout: inactivityTimeout * 60000,
      sessionTimeout: sessionTimeout * 60000
    };

    setIsLoading(true);
    try {
      const result = updateAutoLockSettings(settings);
      if (result.success) {
        setAutoLockSettingsState(settings);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while updating auto-lock settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (showAdminSwitch) {
        handleAdminSwitch();
      }
    } else if (e.key === "Escape") {
      if (showAdminSwitch) {
        setShowAdminSwitch(false);
        setAdminPinInput("");
      }
    }
  };

  const handleInputChange = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setter(value);
    }
  };

  // Export data handler
  const handleExportData = async (format = 'json') => {
    setIsLoading(true);
    showToast('info', 'Export Started', `Preparing ${format.toUpperCase()} export...`);
    
    try {
      const result = exportUserData(format);
      if (result.success) {
        toast.success(result.message);
        showToast('success', 'Export Complete', `Data exported successfully as ${format.toUpperCase()}`);
      } else {
        toast.error(result.message);
        showToast('error', 'Export Failed', result.message);
      }
    } catch (error) {
      toast.error("Failed to export data");
      showToast('error', 'Export Error', 'An unexpected error occurred during export');
    } finally {
      setIsLoading(false);
    }
  };

  // Create backup handler
  const handleCreateBackup = async (options = {}) => {
    setIsLoading(true);
    showToast('info', 'Backup Started', 'Creating system backup...');
    
    try {
      const result = createBackup(options);
      if (result.success) {
        toast.success(result.message);
        showToast('success', 'Backup Complete', 'System backup created successfully');
        setBackupHistory(getBackupHistory());
        
        // Show alert for successful backup
        showAlert('success', 'Backup Created', 'Your system backup has been created and is ready for download.', {
          text: 'View Backups',
          onClick: () => setActiveTab('backup')
        });
      } else {
        toast.error(result.message);
        showToast('error', 'Backup Failed', result.message);
      }
    } catch (error) {
      toast.error("Failed to create backup");
      showToast('error', 'Backup Error', 'An unexpected error occurred during backup');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore backup handler
  const handleRestoreBackup = async (backupData) => {
    setIsLoading(true);
    try {
      const result = restoreFromBackup(backupData);
      if (result.success) {
        toast.success(result.message);
        refreshAdminData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to restore backup");
    } finally {
      setIsLoading(false);
    }
  };

  // Add movie handler (placeholder)
  const handleAddMovie = () => {
    toast.info("Add movie functionality would be implemented here");
  };

  // Add user handler (placeholder)
  const handleAddUser = () => {
    toast.info("Add user functionality would be implemented here");
  };

  // Search handler
  const handleGlobalSearch = (query) => {
    if (query.trim()) {
      toast.info(`Searching for: ${query}`);
      // In a real implementation, this would search across movies, users, etc.
    }
  };

  // Notification handlers
  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, unread: false }))
    );
  };

  const showToast = (type, title, message, duration = 5000) => {
    setToastNotification({
      type,
      title,
      message,
      duration,
      id: Date.now()
    });
  };

  const showAlert = (type, title, message, action = null) => {
    setAlertBanner({
      type,
      title,
      message,
      action,
      id: Date.now()
    });
  };

  // If not admin, show admin switch interface
  if (!isAdmin()) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1 className="admin-title">🔐 Admin Panel</h1>
          <div className="admin-status">
            <div className="status-indicator">
              <span className="status-icon">👤</span>
              <span>User Mode</span>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <div className="access-required-card">
            <div className="card-icon">🔒</div>
            <h2>{t("access_required")}</h2>
            <p>{t("need_admin_privileges")}</p>
            
            <button 
              onClick={() => setShowAdminSwitch(true)}
              className="admin-button primary"
              disabled={isLoading}
            >
              {isLoading ? t("loading") : `👑 ${t("switch_to_admin")}`}
            </button>
          </div>
          
          {showAdminSwitch && (
            <div className="modal-overlay" onClick={() => {
              setShowAdminSwitch(false);
              setAdminPinInput("");
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>🔐 {t("admin_authentication")}</h3>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowAdminSwitch(false);
                      setAdminPinInput("");
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p>{t("enter_admin_pin_access")}</p>
                  <div className="pin-input-container">
                    <input
                      type="password"
                      maxLength={4}
                      value={adminPinInput}
                      onChange={(e) => handleInputChange(e, setAdminPinInput)}
                      onKeyPress={handleKeyPress}
                      placeholder={t("enter_4_digit_pin")}
                      className="pin-input"
                      autoComplete="off"
                      autoFocus
                    />
                    <div className="pin-dots">
                      {[...Array(4)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`pin-dot ${i < adminPinInput.length ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    onClick={handleAdminSwitch} 
                    className="admin-button primary"
                    disabled={isLoading || adminPinInput.length !== 4}
                  >
                    {isLoading ? t("authenticating") : t("switch_to_admin")}
                  </button>
                  <button 
                    onClick={() => {
                      setShowAdminSwitch(false);
                      setAdminPinInput("");
                    }} 
                    className="admin-button secondary"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <MobileOptimizations />
      <div className="admin-header">
        <h1 className="admin-title">🔐 Admin Panel</h1>
        <div className="global-search">
          <div className="search-container">
            <input 
              type="text" 
              placeholder={t("search_movies") + ", users, settings..."}
              className="global-search-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGlobalSearch(e.target.value);
                }
              }}
            />
            <button 
              className="search-btn"
              onClick={(e) => {
                const input = e.target.closest('.search-container').querySelector('input');
                handleGlobalSearch(input.value);
              }}
            >
              <span className="search-icon">🔍</span>
            </button>
          </div>
          <div className="search-suggestions">
            <div className="suggestion-category">
              <h5>Movies</h5>
              <div className="suggestion-item">
                <span className="suggestion-icon">🎬</span>
                <span className="suggestion-text">Avengers: Endgame</span>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-icon">🎬</span>
                <span className="suggestion-text">The Dark Knight</span>
              </div>
            </div>
            <div className="suggestion-category">
              <h5>Users</h5>
              <div className="suggestion-item">
                <span className="suggestion-icon">👤</span>
                <span className="suggestion-text">John Doe</span>
              </div>
            </div>
            <div className="suggestion-category">
              <h5>Settings</h5>
              <div className="suggestion-item">
                <span className="suggestion-icon">⚙️</span>
                <span className="suggestion-text">Auto-Lock Settings</span>
              </div>
            </div>
          </div>
        </div>
        <div className="admin-status">
          <div className="status-indicator">
            <span className="status-icon">👑</span>
            <span>Admin Mode</span>
          </div>
          <NotificationSystem 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
          <div className="theme-switcher">
            <button className="theme-btn">
              <span className="theme-icon">🌙</span>
            </button>
            <div className="theme-dropdown">
              <div className="theme-option active">
                <span className="theme-preview dark"></span>
                <span className="theme-name">Dark Mode</span>
              </div>
              <div className="theme-option">
                <span className="theme-preview light"></span>
                <span className="theme-name">Light Mode</span>
              </div>
              <div className="theme-option">
                <span className="theme-preview blue"></span>
                <span className="theme-name">Ocean Blue</span>
              </div>
              <div className="theme-option">
                <span className="theme-preview purple"></span>
                <span className="theme-name">Purple Haze</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSwitchToUser}
            className="logout-btn"
            disabled={isLoading}
          >
            {isLoading ? t("loading") : `👤 ${t("switch_to_user")}`}
          </button>
        </div>
      </div>

      <div className="admin-content">
        {alertBanner && (
          <AlertBanner 
            alert={alertBanner}
            onDismiss={() => setAlertBanner(null)}
          />
        )}
        
        <LiveActivityTicker activities={liveActivity.slice(0, 1)} />
        
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 {t("dashboard")}
          </button>
          <button 
            className={`tab-button ${activeTab === "movies" ? "active" : ""}`}
            onClick={() => setActiveTab("movies")}
          >
            🎬 {t("movies_management")}
          </button>
          <button 
            className={`tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 {t("users_management")}
          </button>
          <button 
            className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📈 {t("analytics")}
          </button>
          <button 
            className={`tab-button ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🔐 {t("security")}
          </button>
          <button
            className={`tab-button ${activeTab === "autolock" ? "active" : ""}`}
            onClick={() => setActiveTab("autolock")}
          >
            ⏰ {t("autolock")}
          </button>
          <button
            className={`tab-button ${activeTab === "backup" ? "active" : ""}`}
            onClick={() => setActiveTab("backup")}
          >
            💾 {t("backup")}
          </button>
          <button
            className={`tab-button ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            ℹ️ {t("system")}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "dashboard" && (
            <div className="dashboard-content">
              {/* Real-time Stats */}
              <RealTimeStats stats={realTimeStats} />
              
              {/* Overview Stats */}
              <div className="dashboard-overview">
                <h2>🎯 {t("system_overview")}</h2>
                <div className="overview-grid">
                  <div className="overview-card primary">
                    <div className="card-icon">🎬</div>
                    <div className="card-content">
                      <h3>{t("total_movies")}</h3>
                      <p className="card-value">{movieStats.totalMovies}</p>
                      <p className="card-trend positive">+{movieStats.recentlyAdded} {t("added_this_week")}</p>
                    </div>
                </div>
                
                  <div className="overview-card success">
                    <div className="card-icon">👥</div>
                    <div className="card-content">
                      <h3>{t("active_users")}</h3>
                      <p className="card-value">{userStats.activeUsers}</p>
                      <p className="card-trend positive">+{userStats.newUsersToday} {t("new_today")}</p>
                    </div>
                </div>
                
                  <div className="overview-card warning">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <h3>{t("total_views")}</h3>
                      <p className="card-value">{movieStats.totalViews}</p>
                      <p className="card-trend positive">{analyticsData.changeFromLastPeriod?.views || '+0%'} vs yesterday</p>
                    </div>
                </div>
                
                  <div className="overview-card info">
                    <div className="card-icon">⚡</div>
                    <div className="card-content">
                      <h3>{t("system_health")}</h3>
                      <p className="card-value">{systemHealth.overall}%</p>
                      <p className="card-trend neutral">{systemHealth.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Charts and Activity */}
              <div className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <ActivityFeed activities={liveActivity} />
                <SystemHealthMonitor healthData={systemHealth} />
              </div>
              
              <div className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <LineChart 
                  data={performanceMetrics.slice(-12)} 
                  title="📊 Performance Trends (Last 12 Hours)"
                  color="#4facfe"
                />
                <BarChart 
                  data={trendingData} 
                  title="🔥 Trending Movies"
                  color="#00f2fe"
                />
              </div>
              
              <GeographicMap geoData={geoData} />

              {/* System Status */}
              <div className="dashboard-section">
                <h3>🛡️ {t("system_status")}</h3>
                <div className="status-grid">
                  <div className="status-card">
                    <div className="status-header">
                      <span className="status-icon">👑</span>
                      <span className="status-title">{t("admin_status")}</span>
                      <span className="status-badge active">{t("active")}</span>
                    </div>
                    <p className="status-description">Full administrative privileges</p>
                  </div>
                  
                  <div className="status-card">
                    <div className="status-header">
                      <span className="status-icon">🔒</span>
                      <span className="status-title">{t("protected_sections")}</span>
                      <span className="status-badge">{systemInfo.sectionCount}</span>
                    </div>
                    <p className="status-description">Sections with PIN protection</p>
                  </div>
                  
                  <div className="status-card">
                    <div className="status-header">
                      <span className="status-icon">⏰</span>
                      <span className="status-title">{t("auto_lock")}</span>
                      <span className={`status-badge ${systemInfo.autoLockEnabled ? 'active' : 'inactive'}`}>
                        {systemInfo.autoLockEnabled ? t("enabled") : t("disabled")}
                      </span>
                    </div>
                    <p className="status-description">Automatic section locking</p>
                  </div>
                  
                  <div className="status-card">
                    <div className="status-header">
                      <span className="status-icon">🔐</span>
                      <span className="status-title">{t("admin_pin")}</span>
                      <span className={`status-badge ${systemInfo.currentAdminPin === systemInfo.defaultAdminPin ? 'warning' : 'success'}`}>
                    {systemInfo.currentAdminPin === systemInfo.defaultAdminPin ? t("default") : t("custom")}
                      </span>
                    </div>
                    <p className="status-description">PIN configuration status</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="dashboard-section">
                <h3>🚀 {t("quick_actions")}</h3>
                <div className="quick-actions-grid">
                  <button 
                    onClick={() => setActiveTab("movies")}
                    className="quick-action-btn primary"
                  >
                    <span className="action-icon">🎬</span>
                    <span className="action-text">{t("manage_movies")}</span>
                    <span className="action-desc">Add, edit, or remove movies</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("users")}
                    className="quick-action-btn success"
                  >
                    <span className="action-icon">👥</span>
                    <span className="action-text">{t("user_management")}</span>
                    <span className="action-desc">View and manage users</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("analytics")}
                    className="quick-action-btn info"
                  >
                    <span className="action-icon">📈</span>
                    <span className="action-text">{t("view_analytics")}</span>
                    <span className="action-desc">Detailed reports and insights</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("security")}
                    className="quick-action-btn warning"
                  >
                    <span className="action-icon">🔐</span>
                    <span className="action-text">{t("security_settings")}</span>
                    <span className="action-desc">Manage PINs and access</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "movies" && (
            <div className="movies-content">
              <MovieManagement
                movies={topMovies}
                onAddMovie={(movieData) => {
                  showToast('success', 'Movie Added', `"${movieData.title}" has been added successfully`);
                  // In a real app, this would make an API call
                  console.log('Adding movie:', movieData);
                }}
                onEditMovie={(movieId, movieData) => {
                  showToast('success', 'Movie Updated', `"${movieData.title}" has been updated successfully`);
                  // In a real app, this would make an API call
                  console.log('Editing movie:', movieId, movieData);
                }}
                onDeleteMovie={(movieId) => {
                  const movie = topMovies.find(m => m.id === movieId);
                  if (movie) {
                    showAlert('warning', 'Confirm Delete', `Are you sure you want to delete "${movie.title}"?`, {
                      text: 'Delete',
                      onClick: () => {
                        showToast('success', 'Movie Deleted', `"${movie.title}" has been deleted`);
                        setAlertBanner(null);
                        // In a real app, this would make an API call
                        console.log('Deleting movie:', movieId);
                      }
                    });
                  }
                }}
                onBulkAction={(action, movieIds) => {
                  showToast('info', 'Bulk Action', `${action} action performed on ${movieIds.length} movies`);
                  // In a real app, this would handle bulk operations
                  console.log('Bulk action:', action, movieIds);
                }}
              />
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-content">
              <div className="content-header">
                <h2>👥 {t("user_management")}</h2>
                <div className="header-actions">
                  <button className="export-btn" onClick={() => handleExportData('json')}>📊 {t("export_data")}</button>
                  <button className="add-user-btn" onClick={handleAddUser}>➕ {t("add_user")}</button>
                </div>
              </div>

              <div className="users-stats">
                <div className="stat-card primary">
                  <span className="stat-icon">👤</span>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.totalUsers}</span>
                    <span className="stat-label">{t("total_users")}</span>
                  </div>
                </div>
                <div className="stat-card success">
                  <span className="stat-icon">🟢</span>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.activeUsers}</span>
                    <span className="stat-label">{t("online_now")}</span>
                  </div>
                </div>
                <div className="stat-card warning">
                  <span className="stat-icon">📈</span>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.newUsersToday}</span>
                    <span className="stat-label">{t("new_today")}</span>
                  </div>
                </div>
                <div className="stat-card info">
                  <span className="stat-icon">⏱️</span>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.avgSessionTime}</span>
                    <span className="stat-label">{t("avg_session")}</span>
                  </div>
                </div>
              </div>

              <div className="users-filters">
                <input type="text" placeholder="Search users..." className="search-input" />
                <select className="filter-select">
                  <option>All Roles</option>
                  <option>Admin</option>
                  <option>User</option>
                  <option>Moderator</option>
                </select>
                <select className="filter-select">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Banned</option>
                </select>
              </div>

              <div className="users-grid">
                <div className="user-card">
                  <div className="user-avatar">
                    <img src="/api/placeholder/60/60" alt="User" />
                    <span className="status-indicator online"></span>
                  </div>
                  <div className="user-info">
                    <h4>John Doe</h4>
                    <p className="user-email">john@example.com</p>
                    <div className="user-meta">
                      <span className="user-role admin">Admin</span>
                      <span className="user-joined">Joined 2 years ago</span>
                    </div>
                  </div>
                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="stat-value">156</span>
                      <span className="stat-label">Movies Watched</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">4.2h</span>
                      <span className="stat-label">Avg Session</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button className="action-btn">✏️ Edit</button>
                    <button className="action-btn">🔒 Suspend</button>
                  </div>
                </div>
                {/* More user cards would be dynamically generated */}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="analytics-content">
              <div className="content-header">
                <h2>📈 {t("analytics_reports")}</h2>
                <div className="date-range-picker">
                  <select className="date-select">
                    <option>{t("last_7_days")}</option>
                    <option>{t("last_30_days")}</option>
                    <option>{t("last_3_months")}</option>
                    <option>{t("last_year")}</option>
                  </select>
                </div>
              </div>
              
              {/* Interactive Analytics Charts */}
              <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <LineChart 
                  data={analyticsData.dailyViews} 
                  title="📊 Daily Views Trend"
                  color="#667eea"
                />
                <BarChart 
                  data={analyticsData.popularGenres} 
                  title="🎭 Popular Genres"
                  color="#764ba2"
                />
              </div>
              
              <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <LineChart 
                  data={performanceMetrics} 
                  title="⚡ Server Performance"
                  color="#4facfe"
                />
                <GeographicMap geoData={geoData} />
              </div>

              <div className="analytics-overview">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">👁️</span>
                    <span className="metric-title">Total Views</span>
                  </div>
                  <div className="metric-value">45,234</div>
                  <div className="metric-change positive">+12.5% vs last period</div>
                </div>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">⏱️</span>
                    <span className="metric-title">Avg Watch Time</span>
                  </div>
                  <div className="metric-value">1h 23m</div>
                  <div className="metric-change positive">+5.2% vs last period</div>
                </div>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">🔍</span>
                    <span className="metric-title">Search Queries</span>
                  </div>
                  <div className="metric-value">8,921</div>
                  <div className="metric-change negative">-2.1% vs last period</div>
                </div>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-icon">💾</span>
                    <span className="metric-title">Storage Used</span>
                  </div>
                  <div className="metric-value">2.4 TB</div>
                  <div className="metric-change neutral">78% of total</div>
                </div>
              </div>

              <div className="analytics-charts">
                <div className="chart-container">
                  <h3>📊 Daily Views Trend</h3>
                  <div className="chart-placeholder">
                    <div className="chart-bars">
                      <div className="bar" style={{height: '60%'}} data-value="1,245">
                        <span className="bar-value">1.2K</span>
                      </div>
                      <div className="bar" style={{height: '80%'}} data-value="1,680">
                        <span className="bar-value">1.7K</span>
                      </div>
                      <div className="bar" style={{height: '45%'}} data-value="945">
                        <span className="bar-value">945</span>
                      </div>
                      <div className="bar" style={{height: '90%'}} data-value="1,890">
                        <span className="bar-value">1.9K</span>
                      </div>
                      <div className="bar" style={{height: '70%'}} data-value="1,470">
                        <span className="bar-value">1.5K</span>
                      </div>
                      <div className="bar" style={{height: '85%'}} data-value="1,785">
                        <span className="bar-value">1.8K</span>
                      </div>
                      <div className="bar" style={{height: '95%'}} data-value="1,995">
                        <span className="bar-value">2.0K</span>
                      </div>
                    </div>
                    <div className="chart-labels">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <h3>🎭 Popular Genres</h3>
                  <div className="genre-stats">
                    <div className="genre-item">
                      <span className="genre-name">Action</span>
                      <div className="genre-bar">
                        <div className="genre-fill action" style={{width: '85%'}}></div>
                      </div>
                      <span className="genre-percent">85%</span>
                    </div>
                    <div className="genre-item">
                      <span className="genre-name">Comedy</span>
                      <div className="genre-bar">
                        <div className="genre-fill comedy" style={{width: '72%'}}></div>
                      </div>
                      <span className="genre-percent">72%</span>
                    </div>
                    <div className="genre-item">
                      <span className="genre-name">Drama</span>
                      <div className="genre-bar">
                        <div className="genre-fill drama" style={{width: '68%'}}></div>
                      </div>
                      <span className="genre-percent">68%</span>
                    </div>
                    <div className="genre-item">
                      <span className="genre-name">Horror</span>
                      <div className="genre-bar">
                        <div className="genre-fill horror" style={{width: '45%'}}></div>
                      </div>
                      <span className="genre-percent">45%</span>
                    </div>
                    <div className="genre-item">
                      <span className="genre-name">Sci-Fi</span>
                      <div className="genre-bar">
                        <div className="genre-fill scifi" style={{width: '38%'}}></div>
                      </div>
                      <span className="genre-percent">38%</span>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <h3>⏰ Peak Hours</h3>
                  <div className="time-chart">
                    <div className="time-bars">
                      {[...Array(24)].map((_, i) => {
                        const heights = [20, 15, 10, 8, 5, 3, 8, 15, 25, 35, 30, 40, 45, 50, 55, 60, 70, 85, 95, 90, 75, 60, 45, 30];
                        return (
                          <div key={i} className="time-bar" style={{height: `${heights[i]}%`}}>
                            <span className="time-tooltip">{i}:00 - {heights[i]}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="time-labels">
                      <span>00</span>
                      <span>06</span>
                      <span>12</span>
                      <span>18</span>
                      <span>24</span>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <h3>🌍 Geographic Distribution</h3>
                  <div className="geo-stats">
                    <div className="geo-item">
                      <div className="geo-info">
                        <span className="country-flag">🇺🇸</span>
                        <span className="country-name">United States</span>
                      </div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '45%'}}></div>
                      </div>
                      <span className="geo-percent">45%</span>
                    </div>
                    <div className="geo-item">
                      <div className="geo-info">
                        <span className="country-flag">🇮🇳</span>
                        <span className="country-name">India</span>
                      </div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '28%'}}></div>
                      </div>
                      <span className="geo-percent">28%</span>
                    </div>
                    <div className="geo-item">
                      <div className="geo-info">
                        <span className="country-flag">🇬🇧</span>
                        <span className="country-name">United Kingdom</span>
                      </div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '12%'}}></div>
                      </div>
                      <span className="geo-percent">12%</span>
                    </div>
                    <div className="geo-item">
                      <div className="geo-info">
                        <span className="country-flag">🇨🇦</span>
                        <span className="country-name">Canada</span>
                      </div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '8%'}}></div>
                      </div>
                      <span className="geo-percent">8%</span>
                    </div>
                    <div className="geo-item">
                      <div className="geo-info">
                        <span className="country-flag">🇦🇺</span>
                        <span className="country-name">Australia</span>
                      </div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '7%'}}></div>
                      </div>
                      <span className="geo-percent">7%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-tables">
                <div className="table-container">
                  <h3>🏆 Top Performing Movies</h3>
                  <div className="performance-table">
                    <div className="table-row header">
                      <span>Rank</span>
                      <span>Movie</span>
                      <span>Views</span>
                      <span>Rating</span>
                      <span>Revenue</span>
                    </div>
                    <div className="table-row">
                      <span className="rank">#1</span>
                      <span className="movie">Avengers: Endgame</span>
                      <span className="views">45.2K</span>
                      <span className="rating">⭐ 8.4</span>
                      <span className="revenue">$12.5K</span>
                    </div>
                    <div className="table-row">
                      <span className="rank">#2</span>
                      <span className="movie">The Dark Knight</span>
                      <span className="views">38.7K</span>
                      <span className="rating">⭐ 9.0</span>
                      <span className="revenue">$10.8K</span>
                    </div>
                    <div className="table-row">
                      <span className="rank">#3</span>
                      <span className="movie">Inception</span>
                      <span className="views">32.1K</span>
                      <span className="rating">⭐ 8.8</span>
                      <span className="revenue">$9.2K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="security-content">
              <div className="security-grid">
                <div className="security-card">
                  <h3>👑 Admin PIN Management</h3>
                  <div className="form-group">
                    <label>Current Admin PIN</label>
                    <div className="pin-input-container">
                      <input
                        type="password"
                        maxLength={4}
                        value={adminPinInput}
                        onChange={(e) => handleInputChange(e, setAdminPinInput)}
                        placeholder="Enter current PIN"
                        className="pin-input"
                        autoComplete="off"
                      />
                      <div className="pin-dots">
                        {[...Array(4)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`pin-dot ${i < adminPinInput.length ? 'filled' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>New Admin PIN</label>
                    <div className="pin-input-container">
                      <input
                        type="password"
                        maxLength={4}
                        value={newAdminPin}
                        onChange={(e) => handleInputChange(e, setNewAdminPin)}
                        placeholder="Enter new PIN"
                        className="pin-input"
                        autoComplete="off"
                      />
                      <div className="pin-dots">
                        {[...Array(4)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`pin-dot ${i < newAdminPin.length ? 'filled' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm New PIN</label>
                    <div className="pin-input-container">
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmAdminPin}
                        onChange={(e) => handleInputChange(e, setConfirmAdminPin)}
                        placeholder="Confirm new PIN"
                        className="pin-input"
                        autoComplete="off"
                      />
                      <div className="pin-dots">
                        {[...Array(4)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`pin-dot ${i < confirmAdminPin.length ? 'filled' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleChangeAdminPin} 
                    className="admin-button primary"
                    disabled={isLoading || !adminPinInput || !newAdminPin || !confirmAdminPin}
                  >
                    {isLoading ? "Updating..." : "Change Admin PIN"}
                  </button>
                </div>

                <div className="security-card">
                  <h3>🔒 Section PIN Management</h3>
                  <div className="form-group">
                    <label>Section Name</label>
                    <input
                      type="text"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      placeholder="e.g., Adult 18+ Section"
                      className="text-input"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Section PIN</label>
                    <div className="pin-input-container">
                      <input
                        type="password"
                        maxLength={4}
                        value={sectionPinValue}
                        onChange={(e) => handleInputChange(e, setSectionPinValue)}
                        placeholder="Enter 4-digit PIN"
                        className="pin-input"
                        autoComplete="off"
                      />
                      <div className="pin-dots">
                        {[...Array(4)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`pin-dot ${i < sectionPinValue.length ? 'filled' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="button-group">
                    <button 
                      onClick={handleSetSectionPin} 
                      className="admin-button success"
                      disabled={isLoading || !sectionName.trim() || !sectionPinValue}
                    >
                      {isLoading ? "Setting..." : "Set Section PIN"}
                    </button>
                    <button 
                      onClick={handleResetSectionPin} 
                      className="admin-button warning"
                      disabled={isLoading || !sectionName.trim()}
                    >
                      {isLoading ? "Resetting..." : "Reset Section PIN"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="current-pins-section">
                <h3>📋 Current Section PINs</h3>
                <div className="pins-grid">
                  {Object.keys(getAllSectionPins()).length > 0 ? (
                    Object.entries(getAllSectionPins()).map(([section, pin]) => (
                      <div key={section} className="pin-item">
                        <div className="pin-item-header">
                          <span className="section-name">{section}</span>
                          <span className="pin-status">Protected</span>
                        </div>
                        <div className="pin-display">
                          <span className="pin-dots-display">{'•'.repeat(pin.length)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-pins">
                      <div className="no-pins-icon">🔒</div>
                      <p>No section PINs configured</p>
                      <p className="no-pins-hint">Add PINs to protect sensitive sections</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "autolock" && (
            <div className="autolock-content">
              <div className="autolock-grid">
                <div className="autolock-card">
                  <h3>⚙️ Auto-Lock Settings</h3>
                  
                  <div className="form-group">
                    <label className="toggle-label">
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={autoLockEnabled}
                          onChange={(e) => setAutoLockEnabled(e.target.checked)}
                          className="toggle-input"
                        />
                        <span className="toggle-slider"></span>
                      </div>
                      <span className="toggle-text">Enable Auto-Lock</span>
                    </label>
                    <p className="setting-description">
                      Automatically lock sections after inactivity
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label>Inactivity Timeout (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={inactivityTimeout}
                      onChange={(e) => setInactivityTimeout(parseInt(e.target.value) || 5)}
                      className="number-input"
                      disabled={!autoLockEnabled}
                    />
                    <p className="setting-description">
                      Time before section auto-locks due to inactivity
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                      className="number-input"
                      disabled={!autoLockEnabled}
                    />
                    <p className="setting-description">
                      Maximum session duration before auto-lock
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleAutoLockSettingsChange} 
                    className="admin-button primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Auto-Lock Settings"}
                  </button>
                </div>

                <div className="autolock-info-card">
                  <h3>ℹ️ Auto-Lock Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-icon">🔒</div>
                      <div className="info-content">
                        <strong>Status</strong>
                        <span className={`status-badge ${autoLockEnabled ? 'enabled' : 'disabled'}`}>
                          {autoLockEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-icon">⏱️</div>
                      <div className="info-content">
                        <strong>Inactivity Timeout</strong>
                        <span>{inactivityTimeout} minutes</span>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-icon">⏰</div>
                      <div className="info-content">
                        <strong>Session Timeout</strong>
                        <span>{sessionTimeout} minutes</span>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-icon">⚠️</div>
                      <div className="info-content">
                        <strong>Warning</strong>
                        <span>Shows 1 minute before auto-lock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="backup-content">
              <div className="content-header">
                <h2>💾 {t("backup_restore")}</h2>
                <div className="header-actions">
                  <button className="backup-now-btn" onClick={() => handleCreateBackup()}>
                    <span className="btn-icon">⬇️</span>
                    {t("create_backup")}
                  </button>
                </div>
              </div>

              {/* Backup Overview */}
              <div className="backup-overview">
                <div className="backup-stats">
                  <div className="backup-stat-card">
                    <div className="stat-icon">💾</div>
                    <div className="stat-content">
                      <h3>{t("total_backups")}</h3>
                      <p className="stat-value">{backupHistory.length}</p>
                      <p className="stat-trend">Last: 2 {t("hours_ago")}</p>
                    </div>
                  </div>
                  <div className="backup-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <h3>{t("database_size")}</h3>
                      <p className="stat-value">{storageUsage.total}</p>
                      <p className="stat-trend">+120MB this week</p>
                    </div>
                  </div>
                  <div className="backup-stat-card">
                    <div className="stat-icon">☁️</div>
                    <div className="stat-content">
                      <h3>{t("cloud_storage")}</h3>
                      <p className="stat-value">78%</p>
                      <p className="stat-trend">15.6GB used</p>
                    </div>
                  </div>
                  <div className="backup-stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                      <h3>{t("auto_backup")}</h3>
                      <p className="stat-value">{t("enabled")}</p>
                      <p className="stat-trend">{t("daily")} at 2:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup Actions */}
              <div className="backup-actions-section">
                <div className="backup-actions-grid">
                  <div className="backup-action-card">
                    <div className="action-header">
                      <span className="action-icon">⬇️</span>
                      <h3>Create Backup</h3>
                    </div>
                    <p className="action-description">Create a complete backup of your movie database, user data, and system settings.</p>
                    <div className="backup-options">
                      <label className="backup-option">
                        <input type="checkbox" defaultChecked />
                        <span>Movie Database</span>
                      </label>
                      <label className="backup-option">
                        <input type="checkbox" defaultChecked />
                        <span>User Data</span>
                      </label>
                      <label className="backup-option">
                        <input type="checkbox" defaultChecked />
                        <span>System Settings</span>
                      </label>
                      <label className="backup-option">
                        <input type="checkbox" />
                        <span>Media Files</span>
                      </label>
                    </div>
                    <button className="action-btn primary" onClick={() => handleCreateBackup({
                      includeMovieDatabase: true,
                      includeUserData: true,
                      includeSystemSettings: true,
                      includeMediaFiles: false
                    })}>{t("create_full_backup")}</button>
                  </div>

                  <div className="backup-action-card">
                    <div className="action-header">
                      <span className="action-icon">⬆️</span>
                      <h3>Restore Data</h3>
                    </div>
                    <p className="action-description">Restore your system from a previous backup. This will overwrite current data.</p>
                    <div className="restore-options">
                      <select className="restore-select">
                        <option>Select backup to restore...</option>
                        <option>Full Backup - Dec 15, 2024 (2.4GB)</option>
                        <option>Full Backup - Dec 14, 2024 (2.3GB)</option>
                        <option>Database Only - Dec 13, 2024 (1.8GB)</option>
                      </select>
                    </div>
                    <button className="action-btn warning">Restore from Backup</button>
                  </div>

                  <div className="backup-action-card">
                    <div className="action-header">
                      <span className="action-icon">📤</span>
                      <h3>Export Data</h3>
                    </div>
                    <p className="action-description">Export specific data sets in various formats for analysis or migration.</p>
                    <div className="export-options">
                      <select className="export-format">
                        <option>JSON Format</option>
                        <option>CSV Format</option>
                        <option>XML Format</option>
                        <option>SQL Dump</option>
                      </select>
                      <select className="export-data">
                        <option>All Data</option>
                        <option>Movies Only</option>
                        <option>Users Only</option>
                        <option>Analytics Data</option>
                      </select>
                    </div>
                    <button className="action-btn success" onClick={() => handleExportData('json')}>{t("export_data")}</button>
                  </div>

                  <div className="backup-action-card">
                    <div className="action-header">
                      <span className="action-icon">⚙️</span>
                      <h3>Backup Settings</h3>
                    </div>
                    <p className="action-description">Configure automatic backup schedules and retention policies.</p>
                    <div className="backup-settings">
                      <label className="setting-item">
                        <span>Auto Backup</span>
                        <div className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="toggle-slider"></span>
                        </div>
                      </label>
                      <label className="setting-item">
                        <span>Backup Frequency</span>
                        <select className="setting-select">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </label>
                    </div>
                    <button className="action-btn info">Update Settings</button>
                  </div>
                </div>
              </div>

              {/* Backup History */}
              <div className="backup-history-section">
                <h3>📋 Backup History</h3>
                <div className="backup-history-table">
                  <div className="history-header">
                    <span>Date & Time</span>
                    <span>Type</span>
                    <span>Size</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  <div className="history-body">
                    <div className="history-row">
                      <div className="backup-info">
                        <span className="backup-date">Dec 15, 2024 - 2:00 AM</span>
                        <span className="backup-desc">Automatic daily backup</span>
                      </div>
                      <span className="backup-type">Full Backup</span>
                      <span className="backup-size">2.4 GB</span>
                      <span className="backup-status success">✅ Completed</span>
                      <div className="backup-actions">
                        <button className="history-btn download">⬇️</button>
                        <button className="history-btn restore">🔄</button>
                        <button className="history-btn delete">🗑️</button>
                      </div>
                    </div>
                    <div className="history-row">
                      <div className="backup-info">
                        <span className="backup-date">Dec 14, 2024 - 2:00 AM</span>
                        <span className="backup-desc">Automatic daily backup</span>
                      </div>
                      <span className="backup-type">Full Backup</span>
                      <span className="backup-size">2.3 GB</span>
                      <span className="backup-status success">✅ Completed</span>
                      <div className="backup-actions">
                        <button className="history-btn download">⬇️</button>
                        <button className="history-btn restore">🔄</button>
                        <button className="history-btn delete">🗑️</button>
                      </div>
                    </div>
                    <div className="history-row">
                      <div className="backup-info">
                        <span className="backup-date">Dec 13, 2024 - 11:30 PM</span>
                        <span className="backup-desc">Manual backup before update</span>
                      </div>
                      <span className="backup-type">Database Only</span>
                      <span className="backup-size">1.8 GB</span>
                      <span className="backup-status success">✅ Completed</span>
                      <div className="backup-actions">
                        <button className="history-btn download">⬇️</button>
                        <button className="history-btn restore">🔄</button>
                        <button className="history-btn delete">🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Analytics */}
              <div className="storage-analytics">
                <h3>📊 Storage Analytics</h3>
                <div className="storage-grid">
                  <div className="storage-chart">
                    <h4>Storage Usage Breakdown</h4>
                    <div className="storage-items">
                      <div className="storage-item">
                        <span className="storage-label">Movie Database</span>
                        <div className="storage-bar">
                          <div className="storage-fill movies" style={{width: '65%'}}></div>
                        </div>
                        <span className="storage-value">1.56 GB (65%)</span>
                      </div>
                      <div className="storage-item">
                        <span className="storage-label">User Data</span>
                        <div className="storage-bar">
                          <div className="storage-fill users" style={{width: '15%'}}></div>
                        </div>
                        <span className="storage-value">360 MB (15%)</span>
                      </div>
                      <div className="storage-item">
                        <span className="storage-label">System Files</span>
                        <div className="storage-bar">
                          <div className="storage-fill system" style={{width: '12%'}}></div>
                        </div>
                        <span className="storage-value">288 MB (12%)</span>
                      </div>
                      <div className="storage-item">
                        <span className="storage-label">Backups</span>
                        <div className="storage-bar">
                          <div className="storage-fill backups" style={{width: '8%'}}></div>
                        </div>
                        <span className="storage-value">192 MB (8%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="storage-recommendations">
                    <h4>💡 Recommendations</h4>
                    <div className="recommendation-list">
                      <div className="recommendation-item">
                        <span className="rec-icon">🗑️</span>
                        <div className="rec-content">
                          <span className="rec-title">Clean Old Backups</span>
                          <span className="rec-desc">Remove backups older than 30 days to free up 1.2GB</span>
                        </div>
                        <button className="rec-action">Clean Now</button>
                      </div>
                      <div className="recommendation-item">
                        <span className="rec-icon">📦</span>
                        <div className="rec-content">
                          <span className="rec-title">Compress Database</span>
                          <span className="rec-desc">Optimize database to reduce size by ~15%</span>
                        </div>
                        <button className="rec-action">Optimize</button>
                      </div>
                      <div className="recommendation-item">
                        <span className="rec-icon">☁️</span>
                        <div className="rec-content">
                          <span className="rec-title">Cloud Backup</span>
                          <span className="rec-desc">Enable cloud backup for better redundancy</span>
                        </div>
                        <button className="rec-action">Enable</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="system-content">
              <div className="system-grid">
                <div className="system-card">
                  <h3>ℹ️ System Information</h3>
                  <div className="system-info-grid">
                    <div className="system-info-item">
                      <div className="info-icon">👑</div>
                      <div className="info-content">
                        <strong>Default Admin PIN</strong>
                        <span className="pin-display">{systemInfo.defaultAdminPin}</span>
                      </div>
                    </div>
                    
                    <div className="system-info-item">
                      <div className="info-icon">🔐</div>
                      <div className="info-content">
                        <strong>Current Admin PIN</strong>
                        <span className={`pin-display ${systemInfo.currentAdminPin === systemInfo.defaultAdminPin ? 'default' : 'custom'}`}>
                          {systemInfo.currentAdminPin === systemInfo.defaultAdminPin ? 
                            `${systemInfo.currentAdminPin} (Default)` : 
                            `${systemInfo.currentAdminPin} (Custom)`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="system-info-item">
                      <div className="info-icon">👤</div>
                      <div className="info-content">
                        <strong>Current User Role</strong>
                        <span className="role-badge">{systemInfo.currentUserRole}</span>
                      </div>
                    </div>
                    
                    <div className="system-info-item">
                      <div className="info-icon">🔒</div>
                      <div className="info-content">
                        <strong>Protected Sections</strong>
                        <span>{systemInfo.sectionCount}</span>
                      </div>
                    </div>
                    
                    <div className="system-info-item">
                      <div className="info-icon">⏰</div>
                      <div className="info-content">
                        <strong>Auto-Lock Status</strong>
                        <span className={`status-badge ${systemInfo.autoLockEnabled ? 'enabled' : 'disabled'}`}>
                          {systemInfo.autoLockEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="system-card">
                  <h3>🔄 Admin PIN Reset</h3>
                  <p>Reset the admin PIN back to the default value ({systemInfo.defaultAdminPin})</p>
                  <div className="warning-box">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                      <strong>Warning</strong>
                      <p>This will reset the admin PIN to the default value. Use this if you've forgotten your custom PIN.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleResetAdminPin} 
                    className="admin-button warning"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset Admin PIN to Default"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Notifications */}
      {toastNotification && (
        <ToastNotification 
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
        />
      )}
    </div>
  );
}

export default AdminPanel;

