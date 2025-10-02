import React, { useRef, useState } from "react";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaSun,
  FaMoon,
  FaBell,
  FaChevronDown,
  FaCheckCircle,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaPaintBrush,
  FaGlobe,
} from "react-icons/fa";
import { toast } from "react-toastify";

const AppHeader = ({
  profile,
  setProfile,
  editProfile,
  setEditProfile,
  profileName,
  setProfileName,
  showProfile,
  setShowProfile,
  showCalendar,
  setShowCalendar,
  upcoming,
  t,
  i18n,
  genres,
  selectedGenre,
  setSelectedGenre,
  searchInput,
  setSearchInput,
  searchInputRef,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  searchMovie,
  handleKeyPress,
  theme,
  toggleTheme,
  fetchRandomMovie,
}) => {
  // Avatar cropper state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropDataUrl, setCropDataUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 120 });
  const imgRef = useRef();
  const canvasRef = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const badgeRef = useRef(null);
  const notifRef = useRef(null);
  const [presence, setPresence] = useState("online"); // online | busy | away | invisible
  const [compactMode, setCompactMode] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Welcome to Movie Finder!", unread: true },
    { id: 2, title: "New trending list available.", unread: true },
    { id: 3, title: "Tip: Try the theme toggler.", unread: false },
  ]);
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close menus on outside click or Escape
  React.useEffect(() => {
    const handleDocClick = (e) => {
      if (!badgeRef.current) return;
      if (!badgeRef.current.contains(e.target)) {
        if (menuOpen) setMenuOpen(false);
        if (notifOpen) setNotifOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (menuOpen) setMenuOpen(false);
        if (notifOpen) setNotifOpen(false);
      }
      // Alt+U toggles user menu
      if (e.altKey && (e.key === "u" || e.key === "U")) {
        setMenuOpen((o) => !o);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, notifOpen]);

  // Handle avatar file input
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("Please upload an image file"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("Image size should be less than 5MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Draw crop preview
  const drawCrop = () => {
    if (!imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y, size } = crop;
    const img = imgRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(img, x, y, size, size, 0, 0, 120, 120);
    setCropDataUrl(canvasRef.current.toDataURL());
  };

  // Save cropped avatar
  const saveCroppedAvatar = () => {
    setProfile((p) => ({ ...p, avatar: cropDataUrl }));
    setCropModalOpen(false);
    setCropImage(null);
  };

  // Move crop area
  const moveCrop = (dx, dy) => {
    setCrop((c) => ({
      ...c,
      x: Math.max(0, c.x + dx),
      y: Math.max(0, c.y + dy),
    }));
  };
  // Resize crop area
  const resizeCrop = (ds) => {
    setCrop((c) => ({ ...c, size: Math.max(40, Math.min(200, c.size + ds)) }));
  };

  return (
    <header className="custom-header">
      <div className="header-gradient" />
      <div className="header-content">
        <div className="header-row">
          <div className="logo-title">
            <a href="/" className="logo-link" aria-label="Home">
              <span className="logo-icon">🌟</span>
            </a>
            <h1 className="main-title">{t("title")}</h1>
          </div>

          <div
            ref={badgeRef}
            className={`author-badge-modern${compactMode ? " compact" : ""}`}
            role="navigation"
            aria-label="User controls"
          >
            <button
              className="badge-btn notif-btn"
              aria-label="Notifications"
              onClick={() => setNotifOpen((o) => !o)}
              title="Notifications"
            >
              <FaBell />
              {unreadCount > 0 && (
                <span
                  className="notif-dot"
                  aria-label={`${unreadCount} new notifications`}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                ref={notifRef}
                className="notif-menu"
                role="menu"
                aria-label="Notifications"
              >
                <div className="notif-header">
                  <span>Notifications</span>
                  <button
                    className="mark-all"
                    onClick={() =>
                      setNotifications((list) =>
                        list.map((n) => ({ ...n, unread: false }))
                      )
                    }
                  >
                    Mark all read
                  </button>
                </div>
                <ul className="notif-list">
                  {notifications.length === 0 && (
                    <li className="notif-empty">No notifications</li>
                  )}
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`notif-item ${n.unread ? "unread" : ""}`}
                    >
                      <span>{n.title}</span>
                      {n.unread && (
                        <button
                          className="notif-mark"
                          onClick={() =>
                            setNotifications((list) =>
                              list.map((x) =>
                                x.id === n.id ? { ...x, unread: false } : x
                              )
                            )
                          }
                          aria-label="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className="badge-profile"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={`avatar-wrap ${presence}`}>
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="profile"
                    className="badge-avatar"
                  />
                ) : (
                  <span className="badge-avatar placeholder">🙂</span>
                )}
                <span className="presence-dot" aria-hidden="true" />
              </span>
              <span className="badge-info">
                <span className="badge-name">{profile.name || "Guest"}</span>
                <span className="badge-sub">
                  <FaCheckCircle className="verified" aria-hidden="true" />{" "}
                  Verified
                </span>
              </span>
              <FaChevronDown className={`chev ${menuOpen ? "open" : ""}`} />
            </button>

            {menuOpen && (
              <div className="user-menu" role="menu" aria-label="User menu">
                <button
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowProfile(true);
                  }}
                >
                  <FaUser /> Profile
                </button>
                <div className="menu-section">
                  <div className="menu-section-title">Presence</div>
                  <div className="presence-group">
                    {[
                      ["online", "Online"],
                      ["busy", "Busy"],
                      ["away", "Away"],
                      ["invisible", "Invisible"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className={`presence-btn ${
                          presence === key ? "active" : ""
                        } ${key}`}
                        onClick={() => setPresence(key)}
                        aria-pressed={presence === key}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    toggleTheme();
                  }}
                >
                  <FaPaintBrush /> Toggle theme
                </button>
                <div className="menu-section">
                  <div className="menu-section-title">Theme</div>
                  <div className="theme-group">
                    {[
                      ["dark", "Dark"],
                      ["light", "Light"],
                      ["system", "System"],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        className={`theme-btn ${label.toLowerCase()}`}
                        onClick={() => {
                          if (mode === "system") {
                            const prefersDark =
                              window.matchMedia &&
                              window.matchMedia("(prefers-color-scheme: dark)")
                                .matches;
                            toggleTheme(prefersDark ? "dark" : "light");
                          } else {
                            toggleTheme(mode);
                          }
                          setMenuOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="menu-row">
                  <FaGlobe />
                  <select
                    className="lang-select compact"
                    aria-label="Language selector"
                    value={i18n.language}
                    onChange={(e) => {
                      i18n.changeLanguage(e.target.value);
                      localStorage.setItem("lang", e.target.value);
                    }}
                  >
                    <option value="en">EN</option>
                    <option value="hi">HI</option>
                  </select>
                </div>
                <button
                  role="menuitem"
                  className="menu-item"
                  onClick={async () => {
                    try {
                      const url = `${
                        window.location.origin
                      }/?user=${encodeURIComponent(profile.name || "guest")}`;
                      await navigator.clipboard.writeText(url);
                      toast.success("Profile link copied!");
                    } catch {
                      toast.error("Failed to copy link");
                    }
                  }}
                >
                  <FaCog /> Copy profile link
                </button>
                <button
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowCalendar((v) => !v);
                  }}
                >
                  <FaCalendarAlt /> Upcoming
                </button>
                <button
                  role="menuitem"
                  className="menu-item"
                  onClick={() => setCompactMode((c) => !c)}
                >
                  <FaCog /> {compactMode ? "Disable" : "Enable"} compact mode
                </button>
                <button
                  role="menuitem"
                  className="menu-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    toast.info("Signed out (demo)");
                  }}
                >
                  <FaSignOutAlt /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="search-row" style={{ position: "relative" }}>
          <div className="search-container search-elevated">
            <input
              ref={searchInputRef}
              className="search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t("search_placeholder")}
              aria-label={t("search_placeholder")}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <button
              className="btn-primary soft"
              onClick={searchMovie}
              aria-label={t("search")}
            >
              🔎 {t("search")}
            </button>
            <select
              className="genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              aria-label={t("all_genres")}
            >
              <option value="">{t("all_genres")}</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
              data-theme={theme}
            >
              <span className="theme-icon">
                {theme === "dark" ? <FaMoon /> : <FaSun />}
              </span>
              <span>{theme === "dark" ? t("dark_mode") : t("light_mode")}</span>
            </button>
            <button
              onClick={fetchRandomMovie}
              className="btn-secondary soft"
              aria-label={t("random_movie")}
            >
              🤔 {t("random_movie")}
            </button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="autocomplete-suggestions">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="autocomplete-suggestion"
                  onMouseDown={() => {
                    setSearchInput(s.title);
                    setShowSuggestions(false);
                    searchMovie();
                  }}
                >
                  {s.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showProfile && (
        <div className="profile-page">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="avatar"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <FaUserCircle />
            )}
          </div>
          <div className="profile-info">
            <label>Name:</label>
            {editProfile ? (
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            ) : (
              <span>{profile.name}</span>
            )}
          </div>
          {editProfile && (
            <div style={{ marginBottom: 12 }}>
              <label>Upload Avatar: </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                aria-label={t("Upload avatar")}
              />
            </div>
          )}
          <div className="profile-actions">
            {editProfile ? (
              <button
                onClick={() => {
                  const updated = { ...profile, name: profileName };
                  setProfile(updated);
                  try {
                    localStorage.setItem("profile", JSON.stringify(updated));
                  } catch {
                    // Ignore localStorage errors
                  }
                  setEditProfile(false);
                  // reflect the latest name in header badge immediately
                  setShowProfile(false);
                  setShowProfile(true);
                  toast.success("Profile updated!");
                }}
              >
                Save
              </button>
            ) : (
              <button onClick={() => setEditProfile(true)}>Edit</button>
            )}
            <button onClick={() => setShowProfile(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Avatar Cropper Modal */}
      {cropModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              minWidth: 320,
              position: "relative",
            }}
          >
            <h3>Crop Avatar</h3>
            {cropImage && (
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ position: "relative" }}>
                  <img
                    ref={imgRef}
                    src={cropImage}
                    alt="To crop"
                    style={{
                      maxWidth: 200,
                      maxHeight: 200,
                      border: "1px solid #ccc",
                    }}
                    onLoad={drawCrop}
                  />
                  {/* Simple crop controls */}
                  <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                    <button onClick={() => moveCrop(-10, 0)}>←</button>
                    <button onClick={() => moveCrop(10, 0)}>→</button>
                    <button onClick={() => moveCrop(0, -10)}>↑</button>
                    <button onClick={() => moveCrop(0, 10)}>↓</button>
                    <button onClick={() => resizeCrop(10)}>Zoom In</button>
                    <button onClick={() => resizeCrop(-10)}>Zoom Out</button>
                  </div>
                </div>
                <div>
                  <canvas
                    ref={canvasRef}
                    width={120}
                    height={120}
                    style={{ borderRadius: "50%", border: "1px solid #ccc" }}
                  />
                  <div style={{ marginTop: 8 }}>Preview</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button onClick={saveCroppedAvatar}>Save</button>
              <button onClick={() => setCropModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showCalendar && (
        <div className="movie-calendar">
          <div className="calendar-header">🎬 Upcoming Movies</div>
          <ul className="calendar-list">
            {upcoming.length === 0 && <li>Loading...</li>}
            {upcoming.map((m) => (
              <li key={m.id}>
                <span className="calendar-movie-title">{m.title}</span>
                <span className="calendar-movie-date">{m.release_date}</span>
              </li>
            ))}
          </ul>
          <button
            style={{ marginTop: 10 }}
            onClick={() => setShowCalendar(false)}
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
};

export default React.memo(AppHeader);
