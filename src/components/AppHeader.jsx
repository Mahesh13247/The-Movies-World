import React, { useRef, useState } from "react";
import { FaUserCircle, FaCalendarAlt, FaSun, FaMoon } from "react-icons/fa";

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
  setSuggestions,
  showSuggestions,
  setShowSuggestions,
  searchMovie,
  handleKeyPress,
  theme,
  toggleTheme,
  fetchRandomMovie,
  handleAvatarUpload,
  handleProfileSave
}) => {
  // Avatar cropper state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropDataUrl, setCropDataUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 120 });
  const imgRef = useRef();
  const canvasRef = useRef();

  // Handle avatar file input
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(t("Please upload an image file"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t("Image size should be less than 5MB"));
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
    setCrop((c) => ({ ...c, x: Math.max(0, c.x + dx), y: Math.max(0, c.y + dy) }));
  };
  // Resize crop area
  const resizeCrop = (ds) => {
    setCrop((c) => ({ ...c, size: Math.max(40, Math.min(200, c.size + ds)) }));
  };

  return (
    <header className="custom-header">
      <div className="header-bg-shape"></div>
      <div className="header-content">
        <div className="header-row">
          <div className="logo-title">
            <span className="logo-icon">🌟</span>
            <h1 className="main-title">{t("title")}</h1>
          </div>
          <div className="author-badge">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="profile"
                className="main-profile-photo"
              />
            ) : (
              <span className="author-avatar">👨‍💻</span>
            )}
            <span className="author-name">K MAHESH KUMAR ACHARY</span>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => setShowProfile((v) => !v)}
              title="Profile"
            >
              <FaUserCircle size={22} />
            </button>
            <button
              style={{ marginLeft: 4 }}
              onClick={() => setShowCalendar((v) => !v)}
              title="Upcoming Movies"
            >
              <FaCalendarAlt size={20} />
            </button>
            <select
              aria-label="Language selector"
              style={{ marginLeft: 8 }}
              value={i18n.language}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                localStorage.setItem("lang", e.target.value);
              }}
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>
        <div className="search-row" style={{ position: "relative" }}>
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t("search_placeholder")}
              aria-label={t("search_placeholder")}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <button onClick={searchMovie} aria-label={t("search")}>🥵 {t("search")}</button>
            <select
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
              <span className="theme-icon">{theme === "dark" ? <FaMoon /> : <FaSun />}</span>
              <span>{theme === "dark" ? t("dark_mode") : t("light_mode")}</span>
            </button>
            <button
              onClick={fetchRandomMovie}
              className="theme-toggle"
              style={{ marginLeft: 8 }}
              aria-label={t("random_movie")}
            >
              🎲 {t("random_movie")}
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
              <button onClick={handleProfileSave}>Save</button>
            ) : (
              <button onClick={() => setEditProfile(true)}>Edit</button>
            )}
            <button onClick={() => setShowProfile(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Avatar Cropper Modal */}
      {cropModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, minWidth: 320, position: "relative" }}>
            <h3>Crop Avatar</h3>
            {cropImage && (
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ position: "relative" }}>
                  <img
                    ref={imgRef}
                    src={cropImage}
                    alt="To crop"
                    style={{ maxWidth: 200, maxHeight: 200, border: "1px solid #ccc" }}
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
                  <canvas ref={canvasRef} width={120} height={120} style={{ borderRadius: "50%", border: "1px solid #ccc" }} />
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
          <button style={{ marginTop: 10 }} onClick={() => setShowCalendar(false)}>
            Close
          </button>
        </div>
      )}
    </header>
  );
};

export default React.memo(AppHeader); 