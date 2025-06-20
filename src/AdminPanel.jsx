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
            <h2>Admin Access Required</h2>
            <p>You need admin privileges to access the admin panel.</p>
            
            <button 
              onClick={() => setShowAdminSwitch(true)}
              className="admin-button primary"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "👑 Switch to Admin"}
            </button>
          </div>
          
          {showAdminSwitch && (
            <div className="modal-overlay" onClick={() => {
              setShowAdminSwitch(false);
              setAdminPinInput("");
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>🔐 Admin Authentication</h3>
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
                  <p>Enter your admin PIN to access the admin panel:</p>
                  <div className="pin-input-container">
                    <input
                      type="password"
                      maxLength={4}
                      value={adminPinInput}
                      onChange={(e) => handleInputChange(e, setAdminPinInput)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter 4-digit PIN"
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
                    {isLoading ? "Authenticating..." : "Switch to Admin"}
                  </button>
                  <button 
                    onClick={() => {
                      setShowAdminSwitch(false);
                      setAdminPinInput("");
                    }} 
                    className="admin-button secondary"
                  >
                    Cancel
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
      <div className="admin-header">
        <h1 className="admin-title">🔐 Admin Panel</h1>
        <div className="admin-status">
          <div className="status-indicator">
            <span className="status-icon">👑</span>
            <span>Admin Mode</span>
          </div>
          <button 
            onClick={handleSwitchToUser}
            className="logout-btn"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "👤 Switch to User"}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button 
            className={`tab-button ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🔐 Security
          </button>
          <button
            className={`tab-button ${activeTab === "autolock" ? "active" : ""}`}
            onClick={() => setActiveTab("autolock")}
          >
            ⏰ Auto-Lock
          </button>
          <button
            className={`tab-button ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            ℹ️ System
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "dashboard" && (
            <div className="dashboard-content">
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <div className="card-icon">👑</div>
                  <h3>Admin Status</h3>
                  <p className="card-value">Active</p>
                  <p className="card-description">You have full administrative privileges</p>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-icon">🔒</div>
                  <h3>Protected Sections</h3>
                  <p className="card-value">{systemInfo.sectionCount}</p>
                  <p className="card-description">Sections with PIN protection</p>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-icon">⏰</div>
                  <h3>Auto-Lock</h3>
                  <p className="card-value">{systemInfo.autoLockEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p className="card-description">Automatic section locking</p>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-icon">🔐</div>
                  <h3>Admin PIN</h3>
                  <p className="card-value">
                    {systemInfo.currentAdminPin === systemInfo.defaultAdminPin ? 'Default' : 'Custom'}
                  </p>
                  <p className="card-description">PIN configuration status</p>
                </div>
              </div>
              
              <div className="quick-actions">
                <h3>🚀 Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    onClick={() => setActiveTab("security")}
                    className="action-button"
                  >
                    🔐 Manage PINs
                  </button>
                  <button 
                    onClick={() => setActiveTab("autolock")}
                    className="action-button"
                  >
                    ⏰ Auto-Lock Settings
                  </button>
                  <button 
                    onClick={() => setActiveTab("system")}
                    className="action-button"
                  >
                    ℹ️ System Info
                  </button>
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
    </div>
  );
}

export default AdminPanel;
