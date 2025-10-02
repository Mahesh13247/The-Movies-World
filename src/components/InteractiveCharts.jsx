import React, { useState, useEffect, useRef } from 'react';
import './InteractiveCharts.css';

/**
 * Interactive Line Chart Component
 */
export const LineChart = ({ data, title, color = '#4facfe', height = 200 }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max values
    const values = data.map(d => d.value || d.views || d.users || 0);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const stepX = chartWidth / (data.length - 1);
    for (let i = 0; i < data.length; i++) {
      const x = padding + stepX * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.value || point.views || point.users || 0) - minValue) / valueRange * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.value || point.views || point.users || 0) - minValue) / valueRange * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, hoveredPoint === index ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.value || point.views || point.users || 0) - minValue) / valueRange * chartHeight;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.closePath();
    ctx.fill();

  }, [data, hoveredPoint, color, height]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const pointIndex = Math.round(((x - padding) / chartWidth) * (data.length - 1));

    if (pointIndex >= 0 && pointIndex < data.length) {
      setHoveredPoint(pointIndex);
      const point = data[pointIndex];
      setTooltip({
        show: true,
        x: e.clientX,
        y: e.clientY,
        content: `${point.label || point.time || `Point ${pointIndex + 1}`}: ${point.value || point.views || point.users || 0}`
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  };

  return (
    <div className="interactive-chart">
      <h4 className="chart-title">{title}</h4>
      <div className="chart-container" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="chart-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip.show && (
          <div 
            className="chart-tooltip"
            style={{ 
              left: tooltip.x + 10, 
              top: tooltip.y - 10,
              position: 'fixed',
              zIndex: 1000
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Interactive Bar Chart Component
 */
export const BarChart = ({ data, title, color = '#4facfe', height = 200 }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div className="interactive-chart">
      <h4 className="chart-title">{title}</h4>
      <div className="bar-chart-container" style={{ height: `${height}px` }}>
        <div className="bar-chart">
          {data.map((item, index) => {
            const maxValue = Math.max(...data.map(d => d.value || d.views || d.users || 0));
            const barHeight = ((item.value || item.views || item.users || 0) / maxValue) * (height - 40);
            
            return (
              <div
                key={index}
                className={`bar ${hoveredBar === index ? 'hovered' : ''}`}
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: hoveredBar === index ? '#00f2fe' : color,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
                title={`${item.label || item.name}: ${item.value || item.views || item.users || 0}`}
              >
                <span className="bar-value">
                  {item.value || item.views || item.users || 0}
                </span>
              </div>
            );
          })}
        </div>
        <div className="bar-labels">
          {data.map((item, index) => (
            <span key={index} className="bar-label">
              {item.label || item.name || `Item ${index + 1}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Real-time Activity Feed Component
 */
export const ActivityFeed = ({ activities, maxItems = 10 }) => {
  const [visibleActivities, setVisibleActivities] = useState([]);

  useEffect(() => {
    if (activities && activities.length > 0) {
      setVisibleActivities(activities.slice(0, maxItems));
    }
  }, [activities, maxItems]);

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h4>🔴 Live Activity</h4>
        <span className="activity-count">{visibleActivities.length} recent</span>
      </div>
      <div className="activity-list">
        {visibleActivities.map((activity, index) => (
          <div 
            key={activity.id || index} 
            className="activity-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="activity-icon">{activity.icon}</span>
            <div className="activity-content">
              <span className="activity-message">{activity.message}</span>
              <span className="activity-time">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * System Health Monitor Component
 */
export const SystemHealthMonitor = ({ healthData }) => {
  const getHealthColor = (value) => {
    if (value >= 90) return '#4caf50';
    if (value >= 75) return '#ff9800';
    if (value >= 60) return '#f44336';
    return '#e91e63';
  };

  const getHealthStatus = (value) => {
    if (value >= 90) return 'Excellent';
    if (value >= 75) return 'Good';
    if (value >= 60) return 'Fair';
    return 'Poor';
  };

  if (!healthData) return null;

  return (
    <div className="system-health-monitor">
      <div className="health-header">
        <h4>🛡️ System Health</h4>
        <span className={`health-status ${healthData.status}`}>
          {getHealthStatus(healthData.overall)}
        </span>
      </div>
      <div className="health-metrics">
        {Object.entries(healthData).map(([key, value]) => {
          if (key === 'overall' || key === 'status' || key === 'timestamp') return null;
          
          return (
            <div key={key} className="health-metric">
              <div className="metric-header">
                <span className="metric-name">{key.toUpperCase()}</span>
                <span className="metric-value">{value}%</span>
              </div>
              <div className="metric-bar">
                <div 
                  className="metric-fill"
                  style={{
                    width: `${value}%`,
                    backgroundColor: getHealthColor(value)
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Geographic Distribution Map Component
 */
export const GeographicMap = ({ geoData }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);

  return (
    <div className="geographic-map">
      <h4>🌍 Geographic Distribution</h4>
      <div className="geo-list">
        {geoData.map((country, index) => (
          <div
            key={country.code}
            className={`geo-item ${selectedCountry === index ? 'selected' : ''}`}
            onClick={() => setSelectedCountry(selectedCountry === index ? null : index)}
          >
            <div className="geo-info">
              <span className="country-flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
            </div>
            <div className="geo-stats">
              <span className="geo-percentage">{country.percentage}%</span>
              <span className="geo-users">{country.users} users</span>
            </div>
            <div className="geo-bar">
              <div 
                className="geo-fill"
                style={{ width: `${country.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Real-time Stats Cards Component
 */
export const RealTimeStats = ({ stats }) => {
  const [animatedStats, setAnimatedStats] = useState(stats);

  useEffect(() => {
    if (stats) {
      // Animate number changes
      const interval = setInterval(() => {
        setAnimatedStats(prevStats => {
          const newStats = { ...prevStats };
          Object.keys(stats).forEach(key => {
            if (typeof stats[key] === 'number' && key !== 'timestamp') {
              const diff = stats[key] - (prevStats[key] || 0);
              if (Math.abs(diff) > 0.1) {
                newStats[key] = prevStats[key] + (diff * 0.1);
              } else {
                newStats[key] = stats[key];
              }
            } else {
              newStats[key] = stats[key];
            }
          });
          return newStats;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [stats]);

  if (!animatedStats) return null;

  return (
    <div className="realtime-stats">
      <div className="stats-grid">
        <div className="stat-card active-users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{Math.round(animatedStats.activeUsers || 0)}</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-pulse"></div>
        </div>
        
        <div className="stat-card current-views">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <span className="stat-value">{Math.round(animatedStats.currentViews || 0)}</span>
            <span className="stat-label">Current Views</span>
          </div>
          <div className="stat-pulse"></div>
        </div>
        
        <div className="stat-card searches">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <span className="stat-value">{Math.round(animatedStats.searchesPerMinute || 0)}</span>
            <span className="stat-label">Searches/min</span>
          </div>
          <div className="stat-pulse"></div>
        </div>
        
        <div className="stat-card server-load">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-value">{Math.round(animatedStats.serverLoad || 0)}%</span>
            <span className="stat-label">Server Load</span>
          </div>
          <div className="stat-pulse"></div>
        </div>
      </div>
    </div>
  );
};

