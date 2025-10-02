import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

/**
 * Enhanced Notification System Component
 */
export const NotificationSystem = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter(n => n.unread).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    if (notification.unread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  return (
    <div className="notification-system">
      <button 
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read"
                  onClick={() => {
                    if (onMarkAllAsRead) onMarkAllAsRead();
                  }}
                >
                  Mark all read
                </button>
              )}
              <button 
                className="close-notifications"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.unread ? 'unread' : ''} ${notification.type || 'info'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-main">
                      <span className="notification-type-icon">
                        {notification.icon || getNotificationIcon(notification.type)}
                      </span>
                      <div className="notification-text">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-message">{notification.message}</span>
                      </div>
                    </div>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                  {notification.unread && <div className="unread-indicator"></div>}
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <span className="no-notifications-icon">📭</span>
                <span className="no-notifications-text">No notifications</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Toast Notification Component
 */
export const ToastNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300);
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`toast-notification ${notification.type || 'info'} ${isVisible ? 'visible' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {notification.icon || getToastIcon(notification.type)}
        </span>
        <div className="toast-text">
          <span className="toast-title">{notification.title}</span>
          {notification.message && (
            <span className="toast-message">{notification.message}</span>
          )}
        </div>
        <button className="toast-close" onClick={() => setIsVisible(false)}>
          ×
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar"
          style={{ 
            animationDuration: `${notification.duration || 5000}ms` 
          }}
        ></div>
      </div>
    </div>
  );
};

/**
 * Alert Banner Component
 */
export const AlertBanner = ({ alert, onDismiss }) => {
  if (!alert) return null;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '🚨';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`alert-banner ${alert.type || 'info'}`}>
      <div className="alert-content">
        <span className="alert-icon">
          {alert.icon || getAlertIcon(alert.type)}
        </span>
        <div className="alert-text">
          <span className="alert-title">{alert.title}</span>
          {alert.message && (
            <span className="alert-message">{alert.message}</span>
          )}
        </div>
        {alert.action && (
          <button className="alert-action" onClick={alert.action.onClick}>
            {alert.action.text}
          </button>
        )}
        <button className="alert-close" onClick={onDismiss}>
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * System Status Indicator
 */
export const SystemStatusIndicator = ({ status, metrics }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'fair': return '🟠';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="system-status-indicator">
      <div className="status-main">
        <span className="status-icon">{getStatusIcon(status)}</span>
        <span className="status-text" style={{ color: getStatusColor(status) }}>
          System {status || 'Unknown'}
        </span>
      </div>
      {metrics && (
        <div className="status-metrics">
          <div className="metric-item">
            <span className="metric-label">CPU</span>
            <span className="metric-value">{metrics.cpu}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Memory</span>
            <span className="metric-value">{metrics.memory}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Response</span>
            <span className="metric-value">{metrics.responseTime}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Live Activity Ticker
 */
export const LiveActivityTicker = ({ activities }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activities && activities.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activities]);

  if (!activities || activities.length === 0) return null;

  const currentActivity = activities[currentIndex];

  return (
    <div className="live-activity-ticker">
      <div className="ticker-content">
        <span className="ticker-icon">🔴</span>
        <span className="ticker-text">
          <strong>Live:</strong> {currentActivity.message}
        </span>
        <span className="ticker-time">{currentActivity.time}</span>
      </div>
      <div className="ticker-progress">
        <div className="ticker-progress-bar"></div>
      </div>
    </div>
  );
};

