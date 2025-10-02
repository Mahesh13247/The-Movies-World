import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "./PinLock.css";
import {
  isAdmin,
  getSectionPin,
  setSectionPin,
  resetSectionPin,
  switchToAdmin,
  switchToUser,
  startSession,
  updateActivity,
  checkAndAutoLock,
  getRemainingSessionTime,
  formatTimeRemaining,
  getAutoLockSettings,
} from "../utils/userRoles";

const PinLock = ({
  children,
  sectionName = "Protected Section",
  isVideoPlaying = false,
}) => {
  const [pin, setPin] = useState(() => getSectionPin(sectionName));
  const [pinInput, setPinInput] = useState("");
  const [pinSet, setPinSet] = useState(() => !!getSectionPin(sectionName));
  const [pinUnlocked, setPinUnlocked] = useState(
    () => localStorage.getItem(`${sectionName}PinUnlocked`) === "1"
  );
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showAdminSwitch, setShowAdminSwitch] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    const role = localStorage.getItem("userRole") || "user";
    return role;
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [autoLockSettings, setAutoLockSettings] = useState(() =>
    getAutoLockSettings()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const activityTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const pinInputRef = useRef(null);
  const adminPinInputRef = useRef(null);

  // Update current user role when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUserRole(localStorage.getItem("userRole") || "user");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Auto-lock functionality
  useEffect(() => {
    if (pinUnlocked && autoLockSettings.enabled && !isVideoPlaying) {
      // Start session when unlocked
      startSession(sectionName);

      // Set up activity tracking
      const handleActivity = () => {
        updateActivity(sectionName);
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
      };

      // Add activity listeners with passive option for better performance
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ];
      events.forEach((event) => {
        document.addEventListener(event, handleActivity, {
          passive: true,
          capture: true,
        });
      });

      // Set up countdown timer
      const updateCountdown = () => {
        const remaining = getRemainingSessionTime(sectionName);
        setTimeRemaining(remaining);

        // Auto-lock when time expires
        if (remaining <= 0) {
          handleAutoLock();
        }
      };

      updateCountdown();
      countdownTimerRef.current = setInterval(updateCountdown, 1000);

      // Set up activity timer
      activityTimerRef.current = setInterval(() => {
        if (checkAndAutoLock(sectionName)) {
          handleAutoLock();
        }
      }, 5000); // Check every 5 seconds

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleActivity, {
            passive: true,
            capture: true,
          });
        });
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        if (activityTimerRef.current) {
          clearInterval(activityTimerRef.current);
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
      };
    }
  }, [pinUnlocked, autoLockSettings.enabled, sectionName, isVideoPlaying]);

  // Update auto-lock settings when they change
  useEffect(() => {
    const handleSettingsChange = () => {
      setAutoLockSettings(getAutoLockSettings());
    };

    window.addEventListener("storage", handleSettingsChange);
    return () => window.removeEventListener("storage", handleSettingsChange);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (showAdminSwitch && adminPinInputRef.current) {
      adminPinInputRef.current.focus();
    } else if (pinInputRef.current && !pinUnlocked) {
      pinInputRef.current.focus();
    }
  }, [showAdminSwitch, pinUnlocked]);

  const handleAutoLock = () => {
    setPinUnlocked(false);
    setTimeRemaining(0);
    toast.warning(`🔒 ${sectionName} has been auto-locked due to inactivity`);
  };

  const clearPinInput = () => {
    setTimeout(() => {
      setPinInput("");
    }, 500); // Clear after 500ms to show success message
  };

  const handlePinSet = async () => {
    if (!isAdmin()) {
      toast.error("Only admins can set section PINs");
      setPinInput("");
      return;
    }

    if (pinInput.length === 4) {
      setIsLoading(true);
      try {
        const result = setSectionPin(sectionName, pinInput);
        if (result.success) {
          setPin(pinInput);
          setPinSet(true);
          setPinUnlocked(true);
          localStorage.setItem(`${sectionName}PinUnlocked`, "1");
          toast.success(result.message);
          clearPinInput();
        } else {
          toast.error(result.message);
          setPinInput("");
        }
      } catch {
        toast.error("An error occurred while setting the PIN");
        setPinInput("");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("PIN must be 4 digits");
      setPinInput("");
    }
  };

  const handlePinUnlock = async () => {
    if (pinInput === pin) {
      setIsLoading(true);
      try {
        setPinUnlocked(true);
        localStorage.setItem(`${sectionName}PinUnlocked`, "1");
        toast.success("Access granted!");
        clearPinInput();
      } catch {
        toast.error("An error occurred while unlocking");
        setPinInput("");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Incorrect PIN");
      setPinInput("");
    }
  };

  const handlePinLock = () => {
    setPinUnlocked(false);
    localStorage.setItem(`${sectionName}PinUnlocked`, "0");
    toast.info("Section locked");
  };

  const handleResetRequest = () => {
    if (!isAdmin()) {
      toast.error("Only admins can reset section PINs");
      return;
    }
    setShowResetConfirmation(true);
    setPinInput("");
  };

  const handleResetConfirm = async () => {
    if (!isAdmin()) {
      toast.error("Only admins can reset section PINs");
      setPinInput("");
      return;
    }

    setIsLoading(true);
    try {
      const result = resetSectionPin(sectionName);
      if (result.success) {
        setPin("");
        setPinSet(false);
        setPinUnlocked(false);
        setShowResetConfirmation(false);
        toast.info(result.message);
        clearPinInput();
      } else {
        toast.error(result.message);
        setPinInput("");
      }
    } catch {
      toast.error("An error occurred while resetting the PIN");
      setPinInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetConfirmation(false);
    setPinInput("");
  };

  const handleAdminSwitch = async () => {
    if (adminPinInput.length === 4) {
      setIsLoading(true);
      try {
        const result = switchToAdmin(adminPinInput);
        if (result.success) {
          setCurrentUserRole("admin");
          setShowAdminSwitch(false);
          setAdminPinInput("");
          toast.success(result.message);
        } else {
          toast.error(result.message);
          setAdminPinInput("");
        }
      } catch {
        toast.error("An error occurred while switching to admin");
        setAdminPinInput("");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Admin PIN must be 4 digits");
      setAdminPinInput("");
    }
  };

  const handleSwitchToUser = async () => {
    setIsLoading(true);
    try {
      const result = switchToUser();
      if (result.success) {
        setCurrentUserRole("user");
        toast.success(result.message);
      }
    } catch {
      toast.error("An error occurred while switching to user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      if (!pinSet && isAdmin()) {
        handlePinSet();
      } else if (showResetConfirmation && isAdmin()) {
        handleResetConfirm();
      } else if (showAdminSwitch) {
        handleAdminSwitch();
      } else {
        handlePinUnlock();
      }
    } else if (e.key === "Escape") {
      if (showAdminSwitch) {
        setShowAdminSwitch(false);
        setAdminPinInput("");
      } else if (showResetConfirmation) {
        handleResetCancel();
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setPinInput(value);
    }
  };

  const handleAdminPinInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setAdminPinInput(value);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!pinUnlocked) {
    return (
      <div
        className="pin-lock-container"
        role="main"
        aria-label={`${sectionName} Lock Screen`}
      >
        <h2>🔒 {sectionName} Locked</h2>

        {/* Role Display */}
        <div className="role-display" role="status" aria-live="polite">
          <span
            className={`role-badge ${currentUserRole}`}
            aria-label={`Current role: ${currentUserRole}`}
          >
            {currentUserRole === "admin" ? "👑 Admin" : "👤 User"}
          </span>
          {currentUserRole === "admin" && (
            <button
              onClick={handleSwitchToUser}
              className="role-switch-btn"
              title="Switch to User Role"
              aria-label="Switch to user role"
              disabled={isLoading}
            >
              👤 Switch to User
            </button>
          )}
          {currentUserRole === "user" && (
            <button
              onClick={() => setShowAdminSwitch(true)}
              className="role-switch-btn"
              title="Switch to Admin Role"
              aria-label="Switch to admin role"
              disabled={isLoading}
            >
              👑 Switch to Admin
            </button>
          )}
        </div>

        {/* Admin Switch Modal */}
        {showAdminSwitch && (
          <div
            className="admin-switch-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-switch-title"
          >
            <div className="admin-switch-content">
              <h3 id="admin-switch-title">Switch to Admin Role</h3>
              <p>Enter admin PIN to switch to admin role:</p>
              <div className="pin-input-container">
                <input
                  ref={adminPinInputRef}
                  type={showPassword ? "text" : "password"}
                  maxLength={4}
                  value={adminPinInput}
                  onChange={handleAdminPinInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter admin PIN"
                  className="pin-input"
                  autoComplete="off"
                  aria-label="Admin PIN input"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div className="admin-switch-buttons">
                <button
                  onClick={handleAdminSwitch}
                  className="pin-button confirm"
                  disabled={isLoading || adminPinInput.length !== 4}
                  aria-label="Switch to admin role"
                >
                  {isLoading ? "Switching..." : "Switch to Admin"}
                </button>
                <button
                  onClick={() => {
                    setShowAdminSwitch(false);
                    setAdminPinInput("");
                  }}
                  className="pin-button cancel"
                  disabled={isLoading}
                  aria-label="Cancel admin switch"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pin-input-container">
          {pinSet ? (
            <>
              <div className="pin-input-wrapper">
                <input
                  ref={pinInputRef}
                  type={showPassword ? "text" : "password"}
                  maxLength={4}
                  value={pinInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    showResetConfirmation
                      ? "Enter current PIN to reset"
                      : "Enter 4-digit PIN"
                  }
                  className="pin-input"
                  autoComplete="off"
                  aria-label={
                    showResetConfirmation
                      ? "Current PIN for reset"
                      : "Section PIN"
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {showResetConfirmation ? (
                <div className="reset-confirmation-buttons">
                  <button
                    onClick={handleResetConfirm}
                    className="pin-button confirm"
                    disabled={isLoading || pinInput.length !== 4}
                    aria-label="Confirm PIN reset"
                  >
                    {isLoading ? "Resetting..." : "Confirm Reset"}
                  </button>
                  <button
                    onClick={handleResetCancel}
                    className="pin-button cancel"
                    disabled={isLoading}
                    aria-label="Cancel PIN reset"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="pin-buttons">
                  <button
                    onClick={handlePinUnlock}
                    className="pin-button unlock"
                    disabled={isLoading || pinInput.length !== 4}
                    aria-label="Unlock section"
                  >
                    {isLoading ? "Unlocking..." : "Unlock"}
                  </button>
                  {isAdmin() && (
                    <button
                      onClick={handleResetRequest}
                      className="pin-button reset"
                      disabled={isLoading}
                      aria-label="Reset section PIN"
                    >
                      Reset PIN
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {isAdmin() ? (
                <>
                  <div className="pin-input-wrapper">
                    <input
                      ref={pinInputRef}
                      type={showPassword ? "text" : "password"}
                      maxLength={4}
                      value={pinInput}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Set 4-digit PIN"
                      className="pin-input"
                      autoComplete="off"
                      aria-label="New section PIN"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <button
                    onClick={handlePinSet}
                    className="pin-button set"
                    disabled={isLoading || pinInput.length !== 4}
                    aria-label="Set section PIN"
                  >
                    {isLoading ? "Setting..." : "Set PIN"}
                  </button>
                </>
              ) : (
                <div className="no-pin-set" role="status" aria-live="polite">
                  <p>No PIN set for this section.</p>
                  <p>Please contact an admin to set up access.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div
          className="keyboard-hints"
          role="note"
          aria-label="Keyboard shortcuts"
        >
          <p>💡 Press Enter to submit • Press Escape to cancel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="protected-content" role="main">
      <div
        className="lock-control"
        role="toolbar"
        aria-label="Section controls"
      >
        <div className="role-info">
          <span
            className={`role-badge ${currentUserRole}`}
            aria-label={`Current role: ${currentUserRole}`}
          >
            {currentUserRole === "admin" ? "👑 Admin" : "👤 User"}
          </span>
        </div>

        {/* Auto-lock countdown */}
        {autoLockSettings.enabled && timeRemaining > 0 && (
          <div className="auto-lock-countdown" role="timer" aria-live="polite">
            <span className="countdown-label">Auto-lock in:</span>
            <span
              className={`countdown-timer ${
                timeRemaining <= 60000 ? "warning" : ""
              }`}
            >
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        )}

        <button
          onClick={handlePinLock}
          className="lock-button"
          aria-label="Lock section"
          title="Lock section"
        >
          🔒 Lock Section
        </button>
      </div>

      {children}
    </div>
  );
};

export default PinLock;
