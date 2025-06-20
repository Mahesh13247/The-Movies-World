import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import "./App.css";
import "./i18n";
import debounce from "lodash.debounce";
import {
  FaHeart,
  FaRegHeart,
  FaStar,
  FaUserCircle,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaCalendarAlt,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import AnimatedBackground from "./AnimatedBackground";
import ThemeCustomizer from "./ThemeCustomizer";
import AdminPanel from "./AdminPanel";
import MovieLists from "./MovieLists";
import ExternalLinks from "./components/ExternalLinks";
import AdultSearchBar from "./components/AdultSearchBar";
import ErrorBoundary from "./components/ErrorBoundary";
import LogoAnimation from "./components/LogoAnimation";
import PinLock from "./components/PinLock";

// Loading component
const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
  </div>
);

export default function App() {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, i18n } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [lastWatched, setLastWatched] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );
  const [trending, setTrending] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userRatings, setUserRatings] = useState(() =>
    JSON.parse(localStorage.getItem("userRatings") || "{}")
  );
  const [reviews, setReviews] = useState(() =>
    JSON.parse(localStorage.getItem("reviews") || "{}")
  );
  const [reviewInput, setReviewInput] = useState("");
  const [reviewMovieId, setReviewMovieId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(() =>
    JSON.parse(
      localStorage.getItem("profile") || '{"name":"Guest","avatar":""}'
    )
  );
  const [editProfile, setEditProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile.name);
  const [showCalendar, setShowCalendar] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("favorites") || "[]")
  );
  const [watchlist, setWatchlist] = useState(() =>
    JSON.parse(localStorage.getItem("watchlist") || "[]")
  );
  const searchInputRef = useRef();
  const [showLogoAnimation, setShowLogoAnimation] = useState(true);

  useEffect(() => {
    const storedMovie = JSON.parse(localStorage.getItem("lastWatchedMovie"));
    if (storedMovie) {
      setLastWatched(storedMovie);
      setBackgroundImage(storedMovie.movieID);
    }
    return () => {
      // Cleanup background image when component unmounts
      document.body.style.backgroundImage = "";
    };
  }, []);

  useEffect(() => {
    // Fetch genres on mount
    const fetchGenres = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
        );
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (error) {
        console.error("Error fetching genres:", error);
        toast.error(t("Error fetching genres"));
      }
    };
    fetchGenres();
  }, [BASE_URL, API_KEY, t]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Optimize API calls with error handling
  const fetchWithErrorHandling = useCallback(
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("API Error:", error);
        toast.error(t("Error fetching data"));
        return null;
      }
    },
    [t]
  );

  // Optimize search with debounce
  const debouncedSearch = useCallback(
    debounce(async () => {
      if (!searchInput.trim()) return;

      setLoading(true);
      try {
        let url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
          searchInput
        )}`;
        if (selectedGenre) url += `&with_genres=${selectedGenre}`;

        const data = await fetchWithErrorHandling(url);
        if (data) {
          setMovies(data.results || []);
          setHasMore(data.page < data.total_pages);
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error(t("Error searching movies"));
      } finally {
        setLoading(false);
      }
    }, 300),
    [API_KEY, BASE_URL, selectedGenre, searchInput, fetchWithErrorHandling, t]
  );

  // Optimize scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200 &&
      !loading &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Optimize movie fetching
  const loadMoreMovies = useCallback(async () => {
    if (page === 1) return;

    setLoading(true);
    try {
      let url = "";
      if (searchInput.trim()) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
          searchInput
        )}&page=${page}`;
        if (selectedGenre) url += `&with_genres=${selectedGenre}`;
      } else if (selectedGenre) {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&page=${page}`;
      } else {
        setLoading(false);
        setHasMore(false);
        return;
      }

      const data = await fetchWithErrorHandling(url);
      if (data?.results?.length > 0) {
        setMovies((prev) => [...prev, ...data.results]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more movies:", error);
      toast.error(t("Error loading more movies"));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    searchInput,
    selectedGenre,
    API_KEY,
    BASE_URL,
    fetchWithErrorHandling,
    t,
  ]);

  // Load more movies when page changes
  useEffect(() => {
    loadMoreMovies();
  }, [page, loadMoreMovies]);

  // Trending movies fetch
  useEffect(() => {
    const fetchTrendingPages = async () => {
      let allResults = [];
      const totalPages = 3; // Fetch first 3 pages (can increase if needed)
      for (let page = 1; page <= totalPages; page++) {
        try {
          const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&page=${page}`);
          const data = await res.json();
          if (data.results) {
            allResults = allResults.concat(data.results);
          }
        } catch (e) {
          // Optionally handle error for each page
        }
      }
      setTrending(allResults);
    };
    fetchTrendingPages();
  }, [BASE_URL, API_KEY]);

  useEffect(() => {
    if (page === 1) return;
    loadMoreMovies();
    // eslint-disable-next-line
  }, [page]);

  const setBackgroundImage = (movieId) => {
    if (!movieId) {
      document.body.style.backgroundImage = "url('default-background.jpg')";
      return;
    }

    fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.backdrop_path) {
          const imageUrl = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
          document.body.style.backgroundImage = `url('${imageUrl}')`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundRepeat = "no-repeat";
        } else {
          document.body.style.backgroundImage = "url('default-background.jpg')";
        }
      })
      .catch((err) => {
        console.error("Error fetching movie details:", err);
        document.body.style.backgroundImage = "url('default-background.jpg')";
        toast.error(t("Error loading background image"));
      });
  };

  const fetchTrailer = async (movieId) => {
    try {
      setTrailerUrl("");
      const res = await fetch(
        `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const yt = (data.results || []).find(
        (v) => v.site === "YouTube" && v.type === "Trailer"
      );
      if (yt) setTrailerUrl(`https://www.youtube.com/embed/${yt.key}`);
    } catch (error) {
      console.error("Error fetching trailer:", error);
      toast.error(t("Error loading trailer"));
    }
  };

  const watchMovie = (movieId, movieTitle) => {
    const movieData = { movieID: movieId, movieTitle };
    localStorage.setItem("lastWatchedMovie", JSON.stringify(movieData));
    setLastWatched(movieData);
    setSelectedMovie(movieData);
    setBackgroundImage(movieId);
    fetchTrailer(movieId);
  };

  const switchSource = (movieId) => {
    console.warn("First source failed, switching to FlixHQ...");
    // In a real implementation, you would update the iframe source here
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchMovie();
    }
  };

  const streamingSources = [
    {
      name: "VidSrc",
      url: `https://vidsrc.to/embed/movie/${
        selectedMovie?.movieID || lastWatched?.movieID
      }`,
    },
    {
      name: "FlixHQ",
      url: `https://flixhq.to/embed/${
        selectedMovie?.movieID || lastWatched?.movieID
      }`,
    },
    { name: "Mat6Tube", url: "https://mat6tube.com/recent" },
  ];

  // Favorite logic
  const toggleFavorite = (movie) => {
    let updated;
    if (isFavorite(movie)) {
      updated = favorites.filter((f) => f.id !== movie.id);
    } else {
      updated = [...favorites, movie];
    }
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };
  const isFavorite = (movie) => favorites.some((f) => f.id === movie.id);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Random movie
  const fetchRandomMovie = async () => {
    try {
      toast.info("Fetching a random movie...");
      let totalPages = 500; // TMDb max
      let pageNum = Math.floor(Math.random() * totalPages) + 1;
      const res = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${pageNum}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const random =
          data.results[Math.floor(Math.random() * data.results.length)];
        setMovies([random]);
        setSelectedMovie({ movieID: random.id, movieTitle: random.title });
        setBackgroundImage(random.id);
        fetchTrailer(random.id);
        toast.success(`Random movie: ${random.title}`);
      } else {
        throw new Error("No movies found");
      }
    } catch (error) {
      console.error("Error fetching random movie:", error);
      toast.error(t("Error loading random movie"));
    }
  };

  // User ratings
  const rateMovie = (movieId, rating) => {
    const updated = { ...userRatings, [movieId]: rating };
    setUserRatings(updated);
    localStorage.setItem("userRatings", JSON.stringify(updated));
    toast.success("Thanks for rating!");
  };

  const handleReviewSubmit = (movieId) => {
    if (!reviewInput.trim()) return;
    const newReview = {
      text: reviewInput,
      date: new Date().toLocaleString(),
    };
    const updated = {
      ...reviews,
      [movieId]: [...(reviews[movieId] || []), newReview],
    };
    setReviews(updated);
    localStorage.setItem("reviews", JSON.stringify(updated));
    setReviewInput("");
    setReviewMovieId(null);
    toast.success("Review added!");
  };

  const currentMovieId = selectedMovie?.movieID || lastWatched?.movieID;
  const currentReviews = reviews[currentMovieId] || [];

  // Fetch search suggestions
  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      if (searchInput.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await fetch(
          `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
            searchInput
          )}&page=1`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setSuggestions((data.results || []).slice(0, 6));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        if (isMounted) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };

    const debouncedFetch = debounce(fetchSuggestions, 300);
    debouncedFetch();

    return () => {
      isMounted = false;
      debouncedFetch.cancel();
    };
  }, [searchInput, BASE_URL, API_KEY]);

  // Fetch upcoming movies for calendar
  useEffect(() => {
    let isMounted = true;
    const fetchUpcoming = async () => {
      if (!showCalendar) return;
      try {
        const res = await fetch(
          `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setUpcoming(data.results || []);
        }
      } catch (error) {
        console.error("Error fetching upcoming movies:", error);
        if (isMounted) {
          setUpcoming([]);
          toast.error(t("Error loading upcoming movies"));
        }
      }
    };

    fetchUpcoming();
    return () => {
      isMounted = false;
    };
  }, [showCalendar, BASE_URL, API_KEY, t]);

  // Profile save
  const handleProfileSave = () => {
    try {
      if (!profileName.trim()) {
        throw new Error("Name cannot be empty");
      }
      const updated = { ...profile, name: profileName };
      setProfile(updated);
      localStorage.setItem("profile", JSON.stringify(updated));
      setEditProfile(false);
      toast.success("Profile updated!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error.message || t("Error updating profile"));
    }
  };

  // Profile avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("Please upload an image file"));
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 5MB limit
      toast.error(t("Image size should be less than 50MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setProfile((p) => ({ ...p, avatar: ev.target.result }));
      } catch (error) {
        console.error("Error setting avatar:", error);
        toast.error(t("Error setting avatar"));
      }
    };
    reader.onerror = () => {
      toast.error(t("Error reading file"));
    };
    reader.readAsDataURL(file);
  };

  // Social share
  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this awesome movie site!`;
    let shareUrl = "";
    if (platform === "facebook")
      shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`;
    if (platform === "twitter")
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(text)}`;
    if (platform === "whatsapp")
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(shareUrl, "_blank");
  };

  // Add this function to fix the ReferenceError
  const searchMovie = () => {
    debouncedSearch();
  };

  const handleLogoAnimationComplete = () => {
    setShowLogoAnimation(false);
  };

  return (
    <ErrorBoundary>
      {showLogoAnimation ? (
        <LogoAnimation onAnimationComplete={handleLogoAnimationComplete} />
      ) : (
        <div className="app">
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <nav
            className="feature-nav"
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            <button
              className={activePage === "home" ? "active" : ""}
              onClick={() => setActivePage("home")}
            >
              Home
            </button>
            <button
              className={activePage === "admin" ? "active" : ""}
              onClick={() => setActivePage("admin")}
            >
              {t("admin_panel")}
            </button>
            <button
              className={activePage === "theme" ? "active" : ""}
              onClick={() => setActivePage("theme")}
            >
              {t("theme_customization")}
            </button>
            <button
              className={activePage === "animatedbg" ? "active" : ""}
              onClick={() => setActivePage("animatedbg")}
            >
              {t("animated_background")}
            </button>
            <button
              className={activePage === "lists" ? "active" : ""}
              onClick={() => setActivePage("lists")}
            >
              {t("movie_lists")}
            </button>
            <button
              className={activePage === "adult" ? "active" : ""}
              onClick={() => setActivePage("adult")}
            >
              StudyMatrial
            </button>
          </nav>
          {activePage === "admin" && <AdminPanel />}
          {activePage === "theme" && <ThemeCustomizer />}
          {activePage === "animatedbg" && <AnimatedBackground />}
          {activePage === "lists" && <MovieLists />}
          {activePage === "adult" && (
            <PinLock sectionName="Adult 18+ Section">
              <div className="adult-section">
                <AdultSearchBar />
                <AdultSection BASE_URL={BASE_URL} API_KEY={API_KEY} t={t} />
              </div>
            </PinLock>
          )}
          {activePage === "home" && (
            <>
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
                        onFocus={() =>
                          setShowSuggestions(suggestions.length > 0)
                        }
                        onBlur={() =>
                          setTimeout(() => setShowSuggestions(false), 200)
                        }
                      />
                      <button onClick={searchMovie} aria-label={t("search")}>
                        🥵 {t("search")}
                      </button>
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
                      >
                        {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
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
              </header>
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
                        onChange={handleAvatarUpload}
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
              {showCalendar && (
                <div className="movie-calendar">
                  <div className="calendar-header">🎬 Upcoming Movies</div>
                  <ul className="calendar-list">
                    {upcoming.length === 0 && <li>Loading...</li>}
                    {upcoming.map((m) => (
                      <li key={m.id}>
                        <span className="calendar-movie-title">{m.title}</span>
                        <span className="calendar-movie-date">
                          {m.release_date}
                        </span>
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
              <main>
                {/* Trending Carousel */}
                <section className="carousel-section">
                  <h2>{t("trending")}</h2>
                  <div className="carousel">
                    {trending.map((movie) => (
                      <div
                        key={movie.id}
                        className="carousel-card"
                        onClick={() =>
                          watchMovie(movie.id, movie.title, movie.release_date)
                        }
                      >
                        <img
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                              : "https://via.placeholder.com/100x150?text=No+Image"
                          }
                          alt={movie.title}
                        />
                        <div className="carousel-title">{movie.title}</div>
                        <div className="carousel-release-date">
                          {movie.release_date}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="movies-grid" aria-live="polite">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="movie-card skeleton"
                          aria-busy="true"
                        >
                          <div className="skeleton-img" />
                          <div className="skeleton-title" />
                          <div className="skeleton-btn" />
                        </div>
                      ))
                    : movies.map((movie) => (
                        <div key={movie.id} className="movie-card">
                          <img
                            src={
                              movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : "https://via.placeholder.com/200x300?text=No+Image"
                            }
                            alt={movie.title}
                          />
                          <h3>{movie.title}</h3>
                          <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                color={
                                  userRatings[movie.id] >= star
                                    ? "#fc0"
                                    : "#ccc"
                                }
                                style={{ cursor: "pointer" }}
                                onClick={() => rateMovie(movie.id, star)}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => watchMovie(movie.id, movie.title)}
                            aria-label={t("watch_now")}
                          >
                            {t("watch_now")}
                          </button>
                          <button
                            className="heart-btn"
                            onClick={() => toggleFavorite(movie)}
                          >
                            {isFavorite(movie) ? (
                              <FaHeart color="red" />
                            ) : (
                              <FaRegHeart />
                            )}
                          </button>
                          <div className="share-buttons">
                            <button
                              className="share-btn"
                              title="Share on Facebook"
                              onClick={() => handleShare("facebook")}
                            >
                              <FaFacebook />
                            </button>
                            <button
                              className="share-btn"
                              title="Share on Twitter"
                              onClick={() => handleShare("twitter")}
                            >
                              <FaTwitter />
                            </button>
                            <button
                              className="share-btn"
                              title="Share on WhatsApp"
                              onClick={() => handleShare("whatsapp")}
                            >
                              <FaWhatsapp />
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
                {(selectedMovie || lastWatched) && (
                  <div className="player-container">
                    <h2>
                      Streaming:{" "}
                      {selectedMovie?.movieTitle || lastWatched?.movieTitle}
                    </h2>
                    <iframe
                      id="videoPlayer"
                      src={streamingSources[0].url}
                      width="800"
                      height="450"
                      allowFullScreen
                      onError={() =>
                        switchSource(
                          selectedMovie?.movieID || lastWatched?.movieID
                        )
                      }
                    ></iframe>
                    {trailerUrl && (
                      <div className="trailer-section">
                        <h3>Trailer</h3>
                        <iframe
                          width="560"
                          height="315"
                          src={trailerUrl}
                          title="YouTube trailer"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                    {/* Reviews Section */}
                    <div className="reviews-section">
                      <h3>{t("reviews_comments")}</h3>
                      <div className="reviews-list">
                        {currentReviews.length === 0 && (
                          <div className="no-reviews">{t("no_reviews")}</div>
                        )}
                        {currentReviews.map((r, i) => (
                          <div key={i} className="review-item">
                            <div className="review-text">{r.text}</div>
                            <div className="review-date">{r.date}</div>
                          </div>
                        ))}
                      </div>
                      <div className="review-form">
                        <textarea
                          value={
                            reviewMovieId === currentMovieId ? reviewInput : ""
                          }
                          onChange={(e) => {
                            setReviewInput(e.target.value);
                            setReviewMovieId(currentMovieId);
                          }}
                          placeholder={t("write_review")}
                          rows={2}
                          aria-label={t("write_review")}
                        />
                        <button
                          onClick={() => handleReviewSubmit(currentMovieId)}
                          style={{ marginLeft: 8 }}
                          aria-label={t("submit")}
                        >
                          {t("submit")}
                        </button>
                      </div>
                    </div>
                    <div className="alternative-links">
                      <p>{t("alternative_sources")}</p>
                      <a
                        href={`https://prmovies.land/?s=${encodeURIComponent(
                          selectedMovie?.movieTitle || lastWatched?.movieTitle
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alt-link"
                      >
                        PRMovies
                      </a>
                      <a
                        href={`https://yomovies.horse/?s=${encodeURIComponent(
                          selectedMovie?.movieTitle || lastWatched?.movieTitle
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alt-link"
                      >
                        YoMovies
                      </a>
                      <a
                        href={streamingSources[1].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alt-link"
                      >
                        FlixHQ
                      </a>
                      <a
                        href={streamingSources[2].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alt-link"
                      >
                        Mat6Tube
                      </a>
                    </div>
                  </div>
                )}
              </main>
              <div className="fottercontainer">
                <footer className="footer">
                  <p>
                    {t("designed_by")}{" "}
                    <span className="author-name">K Mahesh Kumar Achary</span>
                  </p>
                </footer>
              </div>
            </>
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}

function AdultSection({ BASE_URL, API_KEY, t }) {
  // iOS-inspired design for AdultSection
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "adult-section-style";
    style.innerHTML = `
      body.adult-section-bg {
        background: linear-gradient(135deg, #f7f7fa 0%, #e9e9ef 100%);
        background-attachment: fixed;
      }
      .adult-section-main {
        position: relative;
        min-height: 100vh;
        padding-bottom: 40px;
        background: none;
      }
      .adult-section-main h2, .adult-section-main h3 {
        color: #222;
        font-family: 'San Francisco', 'Segoe UI', Arial, sans-serif;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 0.5em;
      }
      .adult-movie-card, .adult-movie-card-glass {
        background: rgba(255,255,255,0.85);
        border-radius: 22px;
        box-shadow: 0 4px 18px 0 rgba(0,0,0,0.08);
        border: 1px solid #ececec;
        backdrop-filter: blur(10px) saturate(1.1);
        transition: box-shadow 0.18s, transform 0.18s;
        position: relative;
        overflow: hidden;
      }
      .adult-movie-card:hover, .adult-movie-card-glass:hover {
        box-shadow: 0 8px 32px 0 rgba(0,0,0,0.13);
        transform: translateY(-4px) scale(1.02);
      }
      .adult-movie-card img, .adult-movie-card-glass img {
        border-radius: 18px 18px 0 0;
        filter: none;
        background: #f2f2f7;
      }
      .adult-movie-card .adult-18-badge, .adult-movie-card-glass .adult-18-badge {
        position: absolute;
        top: 12px; right: 12px;
        background: #e5e5ea;
        color: #ff3b30;
        font-size: 1em;
        font-weight: 700;
        padding: 3px 12px;
        border-radius: 12px;
        letter-spacing: 1px;
        z-index: 2;
        box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
      }
      .adult-section-main .movies-grid {
        gap: 24px 18px;
      }
      .adult-section-main .carousel-card {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 10px 0 rgba(0,0,0,0.07);
        border: 1px solid #ececec;
      }
      .adult-section-main button, .adult-section-main select, .adult-section-main input {
        font-family: inherit;
        border-radius: 12px;
        border: 1px solid #e5e5ea;
        background: #fff;
        color: #222;
        padding: 8px 16px;
        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.03);
        transition: background 0.15s, box-shadow 0.15s;
        outline: none;
        top: 231px;
        left: 50px;
      }
      .adult-section-main button:active {
        background: #f2f2f7;
      }
      .adult-section-main input:focus, .adult-section-main select:focus {
        border-color: #007aff;
        box-shadow: 0 0 0 2px #007aff22;
      }
      .adult-section-main .carousel-card img {
        border-radius: 14px 14px 0 0;
        background: #f2f2f7;
      }
      .adult-section-main .carousel-title {
        color: #222;
        font-weight: 600;
        font-size: 1em;
        padding: 6px 0 10px 0;
      }
      .adult-section-main .movies-grid .movie-card h3 {
        color: #111;
        font-size: 1.1em;
        font-weight: 700;
        margin: 10px 0 4px 0;
      }
      .adult-section-main .rating-stars span {
        color: #ffcc00;
        font-size: 1.2em;
        margin: 0 1px;
      }
      .adult-section-main .rating-stars span:not(:last-child) {
        margin-right: 2px;
      }
      .adult-section-main .movies-grid .movie-card button {
        margin-top: 8px;
        background: #f7f7fa;
        color: #007aff;
        border: 1px solid #e5e5ea;
        font-weight: 600;
      }
      .adult-section-main .movies-grid .movie-card button:active {
        background: #e5e5ea;
      }
      .adult-section-main .movies-grid .movie-card .adult-18-badge {
        font-size: 0.95em;
        background: #e5e5ea;
        color: #ff3b30;
      }
      .adult-section-main .carousel {
        background: none;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add("adult-section-bg");
    return () => {
      document.body.classList.remove("adult-section-bg");
      const prev = document.getElementById("adult-section-style");
      if (prev) prev.remove();
    };
  }, []);

  // --- PIN Lock ---
  const [pin, setPin] = useState(() => localStorage.getItem("adultPin") || "");
  const [pinInput, setPinInput] = useState("");
  const [pinSet, setPinSet] = useState(
    () => !!localStorage.getItem("adultPin")
  );
  const [pinUnlocked, setPinUnlocked] = useState(
    () => localStorage.getItem("adultPinUnlocked") === "1"
  );
  const handlePinSet = () => {
    if (pinInput.length === 4) {
      localStorage.setItem("adultPin", pinInput);
      setPin(pinInput);
      setPinSet(true);
      setPinUnlocked(true);
      localStorage.setItem("adultPinUnlocked", "1");
    }
  };
  const handlePinUnlock = () => {
    if (pinInput === pin) {
      setPinUnlocked(true);
      localStorage.setItem("adultPinUnlocked", "1");
    } else {
      toast.error("Incorrect PIN");
    }
  };
  const handlePinLock = () => {
    setPinUnlocked(false);
    localStorage.setItem("adultPinUnlocked", "0");
  };
  // --- End PIN Lock ---

  // --- Filtering ---
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  useEffect(() => {
    fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []));
  }, [BASE_URL, API_KEY]);
  // --- End Filtering ---

  // --- Trending & Latest ---
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  useEffect(() => {
    fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&include_adult=true`
    )
      .then((res) => res.json())
      .then((data) => setTrending((data.results || []).filter((m) => m.adult)));
    fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&include_adult=true`)
      .then((res) => res.json())
      .then((data) => setLatest((data.results || []).filter((m) => m.adult)));
  }, [BASE_URL, API_KEY]);
  // --- End Trending & Latest ---

  // --- Watchlist ---
  const [watchlist, setWatchlist] = useState(() =>
    JSON.parse(localStorage.getItem("adultWatchlist") || "[]")
  );
  const toggleWatchlist = (item, type) => {
    const id = `${type}-${item.id}`;
    let updated;
    if (watchlist.some((f) => f.id === id)) {
      updated = watchlist.filter((f) => f.id !== id);
    } else {
      updated = [...watchlist, { ...item, id, type }];
    }
    setWatchlist(updated);
    localStorage.setItem("adultWatchlist", JSON.stringify(updated));
  };
  const isInWatchlist = (item, type) =>
    watchlist.some((f) => f.id === `${type}-${item.id}`);
  // --- End Watchlist ---

  // --- Ratings & Reviews ---
  const [ratings, setRatings] = useState(() =>
    JSON.parse(localStorage.getItem("adultRatings") || "{}")
  );
  const [reviews, setReviews] = useState(() =>
    JSON.parse(localStorage.getItem("adultReviews") || "{}")
  );
  const [reviewInput, setReviewInput] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null); // {id, type}
  const rate = (id, type, value) => {
    const key = `${type}-${id}`;
    const updated = { ...ratings, [key]: value };
    setRatings(updated);
    localStorage.setItem("adultRatings", JSON.stringify(updated));
  };
  const submitReview = (id, type) => {
    if (!reviewInput.trim()) return;
    const key = `${type}-${id}`;
    const newReview = { text: reviewInput, date: new Date().toLocaleString() };
    const updated = { ...reviews, [key]: [...(reviews[key] || []), newReview] };
    setReviews(updated);
    localStorage.setItem("adultReviews", JSON.stringify(updated));
    setReviewInput("");
    setReviewTarget(null);
    toast.success("Review added!");
  };
  // --- End Ratings & Reviews ---

  // --- Continue Watching ---
  const [continueWatching, setContinueWatching] = useState(() =>
    JSON.parse(localStorage.getItem("adultContinue") || "{}")
  );
  const markContinue = (id, type, title) => {
    const key = `${type}-${id}`;
    const updated = {
      ...continueWatching,
      [key]: { id, type, title, date: new Date().toLocaleString() },
    };
    setContinueWatching(updated);
    localStorage.setItem("adultContinue", JSON.stringify(updated));
  };
  // --- End Continue Watching ---

  // --- Report ---
  const [reports, setReports] = useState(() =>
    JSON.parse(localStorage.getItem("adultReports") || "{}")
  );
  const reportContent = (id, type) => {
    const key = `${type}-${id}`;
    const updated = { ...reports, [key]: true };
    setReports(updated);
    localStorage.setItem("adultReports", JSON.stringify(updated));
    toast.info("Reported. Thank you!");
  };
  // --- End Report ---

  // --- Player Source Selection ---
  const DIRECT_SOURCES = [
    "VidSrc",
    "FlixHQ",
    "PRMovies",
    "YoMovies",
    "https://vidsrc.me",
    "https://vidsrc.in",
    "https://vidsrc.pm",
    "https://vidsrc.net",
    "https://vidsrc.xyz",
    "https://vidsrc.io",
    "https://vidsrc.vc",
    "https://dbgo.fun",
    "https://2embed.ru",
    "https://vidsrc.stream",
    "https://godriveplayer.com",
  ];
  const EXTERNAL_SOURCES = [
    "https://fullmovieshow.com",
    "https://isputlockers.com",
    "https://teh-movie.com",
    "https://solarmovieru.com",
    "https://movie4kto.life",
    "https://123moviesgo.bar",
    "https://freeforyou.site/watchserieshd",
    "https://tih-movie.com",
    "http://www.streamlord.com/index.html",
    "https://www.couchtuner.show",
    "https://en.bmovies-official.live/movies",
    "https://en.watchfree-official.live/movies",
    "https://prmovies.repair",
    "https://pikahd.com",
    "https://moviesbaba.cam",
    "https://moviesmod.surf",
    "https://animeflix.ltd",
    "https://1337x.hashhackers.com",
    "https://movie4nx.site",
    "https://animehub.ac/animehub.to",
    "https://uhdmovies.wales",
    "https://watchomovies.support",
    "https://www.javmov.com",
    "https://www.javhd.com",
    "https://www.javdoe.com",
    "https://www.javmost.com",
    "https://www.javbus.com",
    "https://www.javfinder.com",
    "https://www.jav321.com",
    "https://www.javlibrary.com",
    "https://www.javdb.com",
    "https://www.javzoo.com",
    "https://www.javplay.com",
    "https://www.javstream.com",
    "https://www.javmoo.com",
    "https://www.javfap.com",
    "https://www.javxxx.com",
    "https://www.javsex.com",
    "https://www.javtube.com",
    "https://www.manyvids.com",
    "https://kemono.su",
    "https://javheo.com",
    "https://clip18x.com",
    "https://javeng.com",
    "https://www.eporner.com",
    "https://www.miruro.tv",
    "https://katmovie18.mov",
    "https://katmoviehd.rodeo",
    "https://hentaigasm.com",
    "https://www4.javdock.com",
    "https://www.cartoonporn.com",
    "https://mat6tube.com/recent",
    "https://www.qorno.com",
    "https://avple.tv",
    "https://hotleaks.tv",
    "https://en.pornohd.blue",
    "https://missav123.com/dm22/en",
    "https://chiggywiggy.com",
    "https://hanimehub.site",
    "https://nxprime.in/home.html",
    "https://hanime.tv",
    "https://supjav.com",
    "https://javgg.net",
    "https://sextb.net/",
    "https://123av.com/en/dm5",
    "https://ppp.porn/pp1",
    "https://www.tnaflix.com/",
  ];
  const [player, setPlayer] = useState(null); // {id, type, title}
  const [source, setSource] = useState(DIRECT_SOURCES[0]);
  const getSourceUrl = (id, type, title) => {
    // Handle known direct sources
    if (source === "VidSrc")
      return type === "movie"
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}`;
    if (source === "FlixHQ") return `https://flixhq.to/embed/${id}`;
    if (source === "PRMovies")
      return `https://prmovies.land/?s=${encodeURIComponent(title)}`;
    if (source === "YoMovies")
      return `https://yomovies.horse/?s=${encodeURIComponent(title)}`;
    // Handle new direct sources (try /embed/movie/:id or /embed/tv/:id)
    if (DIRECT_SOURCES.includes(source)) {
      if (source.match(/vidsrc/)) {
        return type === "movie"
          ? `${source}/embed/movie/${id}`
          : `${source}/embed/tv/${id}`;
      }
      if (source === "https://dbgo.fun") {
        return `https://dbgo.fun/embed/${id}`;
      }
      if (source === "https://2embed.ru") {
        return type === "movie"
          ? `https://2embed.ru/embed/${id}`
          : `https://2embed.ru/embedtv/${id}`;
      }
      if (source === "https://vidsrc.stream") {
        return type === "movie"
          ? `https://vidsrc.stream/embed/movie/${id}`
          : `https://vidsrc.stream/embed/tv/${id}`;
      }
      if (source === "https://godriveplayer.com") {
        return `https://godriveplayer.com/embed.php?imdb=${id}`;
      }
      // fallback
      return `${source}`;
    }
    return "";
  };
  // --- End Player Source Selection ---

  // --- Data Fetching (with filters) ---
  const [adultMovies, setAdultMovies] = useState([]);
  const [adultWebSeries, setAdultWebSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popularity.desc");
  useEffect(() => {
    setLoading(true);
    let movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&include_adult=true&sort_by=${sortBy}`;
    let tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&include_adult=true&sort_by=${sortBy}`;
    if (search.trim()) {
      movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&include_adult=true&query=${encodeURIComponent(
        search
      )}&sort_by=${sortBy}`;
      tvUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&include_adult=true&query=${encodeURIComponent(
        search
      )}&sort_by=${sortBy}`;
    }
    if (selectedGenre) {
      movieUrl += `&with_genres=${selectedGenre}`;
      tvUrl += `&with_genres=${selectedGenre}`;
    }
    if (year) {
      movieUrl += `&primary_release_year=${year}`;
      tvUrl += `&first_air_date_year=${year}`;
    }
    fetch(movieUrl)
      .then((res) => res.json())
      .then((data) => {
        setAdultMovies(
          (data.results || []).filter(
            (m) => m.adult && (!minRating || m.vote_average >= minRating)
          )
        );
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
      });
    fetch(tvUrl)
      .then((res) => res.json())
      .then((data) => {
        // TMDb does not set the 'adult' flag for TV series, so do not filter by m.adult
        setAdultWebSeries(
          (data.results || []).filter(
            (m) => !minRating || m.vote_average >= minRating
          )
        );
      })
      .catch((e) => {});
  }, [BASE_URL, API_KEY, search, sortBy, selectedGenre, year, minRating]);
  // --- End Data Fetching ---

  // --- PIN Lock UI ---
  if (!pinUnlocked) {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <h2 style={{ color: "#ff3333" }}>🔞 Adult 18+ Section Locked</h2>
        <div style={{ margin: "20px 0" }}>
          {pinSet ? (
            <>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN"
                style={{
                  padding: "8px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  fontSize: "1.2em",
                }}
              />
              <button
                style={{
                  marginLeft: 8,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "#ff3333",
                  color: "#fff",
                  border: "none",
                }}
                onClick={handlePinUnlock}
              >
                Unlock
              </button>
              <button
                style={{
                  marginLeft: 8,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "#888",
                  color: "#fff",
                  border: "none",
                }}
                onClick={() => {
                  localStorage.removeItem("adultPin");
                  localStorage.removeItem("adultPinUnlocked");
                  setPin("");
                  setPinSet(false);
                  setPinUnlocked(false);
                  setPinInput("");
                  toast.info("PIN reset. Please set a new PIN.");
                }}
              >
                Reset PIN
              </button>
            </>
          ) : (
            <>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Set 4-digit PIN"
                style={{
                  padding: "8px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  fontSize: "1.2em",
                }}
              />
              <button
                style={{
                  marginLeft: 8,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "#ff3333",
                  color: "#fff",
                  border: "none",
                }}
                onClick={handlePinSet}
              >
                Set PIN
              </button>
            </>
          )}
        </div>
      </main>
    );
  }
  // --- End PIN Lock UI ---

  // --- Favorites ---
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("adultFavorites") || "[]")
  );
  const toggleFavorite = (item, type) => {
    const id = `${type}-${item.id}`;
    let updated;
    if (favorites.some((f) => f.id === id)) {
      updated = favorites.filter((f) => f.id !== id);
    } else {
      updated = [...favorites, { ...item, id, type }];
    }
    setFavorites(updated);
    localStorage.setItem("adultFavorites", JSON.stringify(updated));
  };
  const isFavorite = (item, type) =>
    favorites.some((f) => f.id === `${type}-${item.id}`);
  // --- End Favorites ---

  // --- Recently Watched ---
  const [recentlyWatched, setRecentlyWatched] = useState(() =>
    JSON.parse(localStorage.getItem("adultRecentlyWatched") || "[]")
  );
  const addRecentlyWatched = (item, type) => {
    const id = `${type}-${item.id}`;
    const updated = [
      { ...item, id, type },
      ...recentlyWatched.filter((f) => f.id !== id),
    ].slice(0, 10);
    setRecentlyWatched(updated);
    localStorage.setItem("adultRecentlyWatched", JSON.stringify(updated));
  };
  // --- End Recently Watched ---

  return (
    <main className="adult-section-main">
      {/* Filtering Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          margin: "10px 0 20px 0",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            minWidth: 180,
          }}
        />
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8 }}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, width: 90 }}
        />
        <input
          type="number"
          placeholder="Min Rating"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, width: 110 }}
          min={0}
          max={10}
          step={0.1}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8 }}
        >
          <option value="popularity.desc">Most Popular</option>
          <option value="release_date.desc">Latest</option>
          <option value="vote_average.desc">Top Rated</option>
        </select>
      </div>
      {/* Trending & Latest */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ color: "#ff3333" }}>Trending</h3>
        <div className="carousel">
          {trending.map((movie) => (
            <div
              key={movie.id}
              className="carousel-card"
              onClick={() =>
                setPlayer({ id: movie.id, type: "movie", title: movie.title })
              }
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : "https://via.placeholder.com/100x150?text=No+Image"
                }
                alt={movie.title}
              />
              <div className="carousel-title">{movie.title}</div>
            </div>
          ))}
        </div>
        <h3 style={{ color: "#ff3333", marginTop: 10 }}>Recently Added</h3>
        <div className="carousel">
          {latest.map((movie) => (
            <div
              key={movie.id}
              className="carousel-card"
              onClick={() =>
                setPlayer({ id: movie.id, type: "movie", title: movie.title })
              }
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : "https://via.placeholder.com/100x150?text=No+Image"
                }
                alt={movie.title}
              />
              <div className="carousel-title">{movie.title}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>💖 Your Watchlist</h3>
          <div className="movies-grid">
            {watchlist.map((fav) => fav && (
              <div key={fav.id} className="adult-movie-card-glass movie-card">
                <span className="adult-18-badge">18+</span>
                <img
                  src={
                    fav.poster_path
                      ? `https://image.tmdb.org/t/p/w500${fav.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={fav.title || fav.name}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setPlayer({
                      id: fav.id,
                      type: fav.type,
                      title: fav.title || fav.name,
                    })
                  }
                />
                <h3>{fav.title || fav.name}</h3>
                <div style={{ fontSize: "0.95em", color: "#888" }}>
                  {fav.type === "movie"
                    ? `Release: ${fav.release_date || "N/A"}`
                    : `First Air: ${fav.first_air_date || "N/A"}`} {" "}
                  | Rating: {fav.vote_average || "N/A"}
                </div>
                <button
                  onClick={() => toggleWatchlist(fav, fav.type)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Remove from Watchlist"
                >
                  💖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>💖 Favorites</h3>
          <div className="movies-grid">
            {favorites.map((fav) => fav && (
              <div key={fav.id} className="adult-movie-card-glass movie-card">
                <span className="adult-18-badge">18+</span>
                <img
                  src={
                    fav.poster_path
                      ? `https://image.tmdb.org/t/p/w500${fav.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={fav.title || fav.name}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setPlayer({
                      id: fav.id,
                      type: fav.type,
                      title: fav.title || fav.name,
                    })
                  }
                />
                <h3>{fav.title || fav.name}</h3>
                <div style={{ fontSize: "0.95em", color: "#888" }}>
                  {fav.type === "movie"
                    ? `Release: ${fav.release_date || "N/A"}`
                    : `First Air: ${fav.first_air_date || "N/A"}`} {" "}
                  | Rating: {fav.vote_average || "N/A"}
                </div>
                <button
                  onClick={() => toggleFavorite(fav, fav.type)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Remove from Favorites"
                >
                  💖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Recently Watched Section */}
      {recentlyWatched.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>🕒 Recently Watched</h3>
          <div className="movies-grid">
            {recentlyWatched.map((item) => item && (
              <div key={item.id} className="adult-movie-card-glass movie-card">
                <span className="adult-18-badge">18+</span>
                <img
                  src={
                    item.poster_path
                      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={item.title || item.name}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setPlayer({
                      id: item.id,
                      type: item.type,
                      title: item.title || item.name,
                    })
                  }
                />
                <h3>{item.title || item.name}</h3>
                <div style={{ fontSize: "0.95em", color: "#888" }}>
                  {item.type === "movie"
                    ? `Release: ${item.release_date || "N/A"}`
                    : `First Air: ${item.first_air_date || "N/A"}`} {" "}
                  | Rating: {item.vote_average || "N/A"}
                </div>
                <button
                  onClick={() => toggleFavorite(item, item.type)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title={
                    isFavorite(item, item.type)
                      ? "Remove from Favorites"
                      : "Add to Favorites"
                  }
                >
                  {isFavorite(item, item.type) ? "💖" : "🤍"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Movies */}
      <h3 style={{ color: "#ff3333", marginTop: 10 }}>Movies</h3>
      <div className="movies-grid">
        {loading ? (
          <div>Loading...</div>
        ) : adultMovies.length === 0 ? (
          <div>No adult movies found.</div>
        ) : (
          adultMovies.map((movie) => {
            const key = `movie-${movie.id}`;
            return (
              <div key={movie.id} className="adult-movie-card movie-card">
                <span className="adult-18-badge">18+</span>
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={movie.title}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setPlayer({
                      id: movie.id,
                      type: "movie",
                      title: movie.title,
                    })
                  }
                />
                <h3>{movie.title}</h3>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    margin: "8px 0",
                  }}
                >
                  <button
                    style={{ background: "#ff3333", color: "#fff" }}
                    onClick={() =>
                      setPlayer({
                        id: movie.id,
                        type: "movie",
                        title: movie.title,
                      })
                    }
                  >
                    Watch Now
                  </button>
                  <button
                    style={{ background: "#007aff", color: "#fff" }}
                    onClick={() =>
                      setPlayer({
                        id: movie.id,
                        type: "movie",
                        title: movie.title,
                      })
                    }
                  >
                    Watch Online
                  </button>
                  <button
                    style={{
                      background: "#eee",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                    onClick={() => toggleFavorite(movie, "movie")}
                  >
                    {isFavorite(movie, "movie") ? "💖 Remove" : "🤍 Add"}
                  </button>
                  <button
                    style={{
                      background: "#eee",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                    onClick={() => {
                      addRecentlyWatched(movie, "movie");
                      markContinue(movie.id, "movie", movie.title);
                    }}
                  >
                    {continueWatching[key]
                      ? "Continue Watching"
                      : "Mark as Watching"}
                  </button>
                  <button
                    style={{
                      background: "#eee",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                    onClick={() => reportContent(movie.id, "movie")}
                    disabled={reports[key]}
                  >
                    Report
                  </button>
                </div>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        color: ratings[key] >= star ? "#fc0" : "#ccc",
                        cursor: "pointer",
                        fontSize: "1.2em",
                      }}
                      onClick={() => rate(movie.id, "movie", star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      background: "#ffcc00",
                      color: "#222",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: "0.9em",
                    }}
                  >
                    Adult
                  </span>
                </div>
                {/* Reviews for this movie */}
                <div style={{ marginTop: 8 }}>
                  <strong style={{ fontSize: "0.95em" }}>Reviews:</strong>
                  <div
                    style={{
                      maxHeight: 60,
                      overflowY: "auto",
                      fontSize: "0.93em",
                    }}
                  >
                    {(reviews[key] || []).length === 0 && (
                      <div style={{ color: "#888" }}>No reviews yet.</div>
                    )}
                    {(reviews[key] || []).map((r, i) => (
                      <div key={i} style={{ marginBottom: 2 }}>
                        <span style={{ color: "#ffcc00" }}>{r.text}</span>{" "}
                        <span style={{ color: "#888", fontSize: "0.85em" }}>
                          ({r.date})
                        </span>
                      </div>
                    ))}
                  </div>
                  {reviewTarget &&
                  reviewTarget.id === movie.id &&
                  reviewTarget.type === "movie" ? (
                    <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                      <input
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        placeholder="Write a review..."
                        style={{
                          flex: 1,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                      <button
                        style={{
                          background: "#ffcc00",
                          color: "#222",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                        }}
                        onClick={() => submitReview(movie.id, "movie")}
                      >
                        Submit
                      </button>
                      <button
                        style={{
                          background: "#eee",
                          color: "#222",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                        }}
                        onClick={() => {
                          setReviewTarget(null);
                          setReviewInput("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{
                        marginTop: 4,
                        background: "#eee",
                        color: "#222",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.95em",
                      }}
                      onClick={() => {
                        setReviewTarget({ id: movie.id, type: "movie" });
                        setReviewInput("");
                      }}
                    >
                      Add Review
                    </button>
                  )}
                </div>
                {continueWatching[key] && (
                  <div
                    style={{ color: "#ff3333", fontWeight: 600, marginTop: 4 }}
                  >
                    Continue Watching
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Web Series */}
      <h3 style={{ color: "#ff3333", marginTop: 30 }}>Web Series</h3>
      <div className="movies-grid">
        {adultWebSeries.length === 0 ? (
          <div>
            No adult web series found.
            <br />
            <span style={{ color: "#b26c00", fontSize: "0.97em" }}>
              Note: Even with adult features enabled on TMDb, the API does not
              reliably mark TV series as adult. Some adult web series may not be
              visible here.
            </span>
          </div>
        ) : (
          adultWebSeries.map((series) => {
            const key = `tv-${series.id}`;
            return (
              <div key={series.id} className="adult-movie-card movie-card">
                <span className="adult-18-badge">18+</span>
                <img
                  src={
                    series.poster_path
                      ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={series.name}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setPlayer({ id: series.id, type: "tv", title: series.name })
                  }
                />
                <h3>{series.name}</h3>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    margin: "8px 0",
                  }}
                >
                  <button
                    style={{ background: "#ff3333", color: "#fff" }}
                    onClick={() =>
                      setPlayer({
                        id: series.id,
                        type: "tv",
                        title: series.name,
                      })
                    }
                  >
                    Watch Now
                  </button>
                  <button
                    style={{ background: "#007aff", color: "#fff" }}
                    onClick={() =>
                      setPlayer({
                        id: series.id,
                        type: "tv",
                        title: series.name,
                      })
                    }
                  >
                    Watch Online
                  </button>
                  <button
                    style={{
                      background: "#eee",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                    onClick={() => toggleFavorite(series, "tv")}
                  >
                    {isFavorite(series, "tv") ? "💖 Remove" : "🤍 Add"}
                  </button>
                  <button
                    style={{
                      background: "#eee",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                    onClick={() => {
                      addRecentlyWatched(series, "tv");
                      markContinue(series.id, "tv", series.name);
                    }}
                  >
                    {continueWatching[key]
                      ? "Continue Watching"
                      : "Mark as Watching"}
                  </button>
                  <button
                    style={{
                      background: "#eee",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                    onClick={() => reportContent(series.id, "tv")}
                    disabled={reports[key]}
                  >
                    Report
                  </button>
                </div>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        color: ratings[key] >= star ? "#fc0" : "#ccc",
                        cursor: "pointer",
                        fontSize: "1.2em",
                      }}
                      onClick={() => rate(series.id, "tv", star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      background: "#ffcc00",
                      color: "#222",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: "0.9em",
                    }}
                  >
                    Adult
                  </span>
                </div>
                {/* Reviews for this series */}
                <div style={{ marginTop: 8 }}>
                  <strong style={{ fontSize: "0.95em" }}>Reviews:</strong>
                  <div
                    style={{
                      maxHeight: 60,
                      overflowY: "auto",
                      fontSize: "0.93em",
                    }}
                  >
                    {(reviews[key] || []).length === 0 && (
                      <div style={{ color: "#888" }}>No reviews yet.</div>
                    )}
                    {(reviews[key] || []).map((r, i) => (
                      <div key={i} style={{ marginBottom: 2 }}>
                        <span style={{ color: "#ffcc00" }}>{r.text}</span>{" "}
                        <span style={{ color: "#888", fontSize: "0.85em" }}>
                          ({r.date})
                        </span>
                      </div>
                    ))}
                  </div>
                  {reviewTarget &&
                  reviewTarget.id === series.id &&
                  reviewTarget.type === "tv" ? (
                    <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                      <input
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        placeholder="Write a review..."
                        style={{
                          flex: 1,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                      <button
                        style={{
                          background: "#ffcc00",
                          color: "#222",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                        }}
                        onClick={() => submitReview(series.id, "tv")}
                      >
                        Submit
                      </button>
                      <button
                        style={{
                          background: "#eee",
                          color: "#222",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                        }}
                        onClick={() => {
                          setReviewTarget(null);
                          setReviewInput("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{
                        marginTop: 4,
                        background: "#eee",
                        color: "#222",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.95em",
                      }}
                      onClick={() => {
                        setReviewTarget({ id: series.id, type: "tv" });
                        setReviewInput("");
                      }}
                    >
                      Add Review
                    </button>
                  )}
                </div>
                {continueWatching[key] && (
                  <div
                    style={{ color: "#ff3333", fontWeight: 600, marginTop: 4 }}
                  >
                    Continue Watching
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Player Modal with Source Selection */}
      {player && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.92)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setPlayer(null)}
        >
          <div
            style={{
              background: "#111",
              padding: 12,
              borderRadius: 12,
              maxWidth: 900,
              width: "96%",
              position: "relative",
              maxHeight: "96vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 28,
                cursor: "pointer",
              }}
              onClick={() => setPlayer(null)}
            >
              ✖
            </button>
            <h2 style={{ color: "#ff3333", marginBottom: 8 }}>
              Streaming: {player.title}
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 700,
                  background: "#222",
                  borderRadius: 8,
                  padding: "8px 0",
                  marginBottom: 4,
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#ffcc00",
                    marginLeft: 16,
                    marginBottom: 4,
                  }}
                >
                  Direct Streaming Sources
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    padding: "0 8px",
                  }}
                >
                  {DIRECT_SOURCES.map((src) => (
                    <button
                      key={src}
                      style={{
                        background: source === src ? "#ff3333" : "#222",
                        color: source === src ? "#fff" : "#ffcc00",
                        border:
                          source === src
                            ? "2px solid #ffcc00"
                            : "1px solid #444",
                        borderRadius: 6,
                        padding: "6px 14px",
                        fontWeight: 500,
                        marginBottom: 4,
                        transition: "all 0.2s",
                        cursor: "pointer",
                        minWidth: 90,
                      }}
                      onClick={() => setSource(src)}
                    >
                      {
                        src
                          .replace("https://", "")
                          .replace("www.", "")
                          .split("/")[0]
                      }
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  maxWidth: 700,
                  background: "#222",
                  borderRadius: 8,
                  padding: "8px 0",
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#ffcc00",
                    marginLeft: 16,
                    marginBottom: 4,
                  }}
                >
                  External/Alternative Links (open in new tab)
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    padding: "0 8px",
                  }}
                >
                  {EXTERNAL_SOURCES.map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#222",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: 6,
                        padding: "6px 14px",
                        fontWeight: 500,
                        marginBottom: 4,
                        textDecoration: "none",
                        display: "inline-block",
                        transition: "all 0.2s",
                        minWidth: 90,
                      }}
                    >
                      {
                        src
                          .replace("https://", "")
                          .replace("http://", "")
                          .replace("www.", "")
                          .split("/")[0]
                      }
                    </a>
                  ))}
                </div>
              </div>
            </div>
            {DIRECT_SOURCES.includes(source) ? (
              <iframe
                src={getSourceUrl(player.id, player.type, player.title)}
                width="100%"
                height="480"
                allowFullScreen
                style={{ borderRadius: 8, border: "none", width: "100%" }}
                title={player.title}
              ></iframe>
            ) : null}
            <div
              style={{
                marginTop: 8,
                fontSize: "0.95em",
                color: "#aaa",
                textAlign: "center",
              }}
            >
              If a source doesn't work, try another. Some external links open in
              a new tab.
            </div>
          </div>
        </div>
      )}
      {/* Add ExternalLinks component before the closing main tag */}
      <ExternalLinks />
    </main>
  );
}
