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
  FaHome,
  FaUserShield,
  FaPalette,
  FaMagic,
  FaList,
  FaLock,
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
import AppHeader from "./components/AppHeader";
import TrendingCarousel from "./components/TrendingCarousel";
import MoviesGrid from "./components/MoviesGrid";
import MoviePlayerSection from "./components/MoviePlayerSection";
import { useAppContext } from "./context/AppContext";
import HomePage from "./HomePage";
import AdminPanelPage from "./AdminPanelPage";
import ThemePage from "./ThemePage";
import AnimatedBgPage from "./AnimatedBgPage";
import MovieListsPage from "./MovieListsPage";
import AdultSectionPage from "./AdultSectionPage";

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
  // Use context for global state
  const {
    theme, setTheme,
    profile, setProfile,
    watchlist, setWatchlist,
    favorites, setFavorites,
    reviews, setReviews,
    pin, setPin,
    pinUnlocked, setPinUnlocked,
  } = useAppContext();
  const [searchInput, setSearchInput] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [lastWatched, setLastWatched] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trending, setTrending] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userRatings, setUserRatings] = useState({});
  const [reviewInput, setReviewInput] = useState("");
  const [reviewMovieId, setReviewMovieId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile.name);
  const [showCalendar, setShowCalendar] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [showLogoAnimation, setShowLogoAnimation] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const searchInputRef = useRef();

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

  const isInWatchlist = (movie) => watchlist.some((w) => w.id === movie.id);
  const toggleWatchlist = (movie) => {
    let updated;
    if (isInWatchlist(movie)) {
      updated = watchlist.filter((w) => w.id !== movie.id);
    } else {
      updated = [...watchlist, movie];
    }
    setWatchlist(updated);
  };

  return (
    <ErrorBoundary>
      {showLogoAnimation ? (
        <LogoAnimation onAnimationComplete={handleLogoAnimationComplete} />
      ) : (
        <div className="app fade-slide">
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
              {t("home")}
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
              {t("adult_section")}
            </button>
          </nav>
          {/* Mobile Bottom Nav */}
          <nav className="mobile-bottom-nav">
                      <button
              className={activePage === "home" ? "active" : ""}
              onClick={() => setActivePage("home")}
              aria-label="Home"
            >
              <FaHome />
                      </button>
                      <button
              className={activePage === "admin" ? "active" : ""}
              onClick={() => setActivePage("admin")}
              aria-label={t("admin_panel")}
            >
              <FaUserShield />
                      </button>
            <button
              className={activePage === "theme" ? "active" : ""}
              onClick={() => setActivePage("theme")}
              aria-label={t("theme_customization")}
            >
              <FaPalette />
                      </button>
                      <button
              className={activePage === "animatedbg" ? "active" : ""}
              onClick={() => setActivePage("animatedbg")}
              aria-label={t("animated_background")}
            >
              <FaMagic />
                      </button>
                      <button
              className={activePage === "lists" ? "active" : ""}
              onClick={() => setActivePage("lists")}
              aria-label={t("movie_lists")}
            >
              <FaList />
                      </button>
                  <button
              className={activePage === "adult" ? "active" : ""}
              onClick={() => setActivePage("adult")}
              aria-label={t("adult_section")}
                  >
              <FaLock />
                  </button>
          </nav>
          {activePage === "admin" && <AdminPanelPage t={t} />}
          {activePage === "theme" && <ThemePage t={t} />}
          {activePage === "animatedbg" && <AnimatedBgPage t={t} />}
          {activePage === "lists" && <MovieListsPage t={t} />}
          {activePage === "adult" && (
            <PinLock sectionName={t("adult_section")}>
              <AdultSectionPage BASE_URL={BASE_URL} API_KEY={API_KEY} t={t} />
            </PinLock>
          )}
          {activePage === "home" && (
            <HomePage
              profile={profile}
              setProfile={setProfile}
              editProfile={editProfile}
              setEditProfile={setEditProfile}
              profileName={profileName}
              setProfileName={setProfileName}
              showProfile={showProfile}
              setShowProfile={setShowProfile}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              upcoming={upcoming}
              t={t}
              i18n={i18n}
              genres={genres}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              searchInputRef={searchInputRef}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              searchMovie={searchMovie}
              handleKeyPress={handleKeyPress}
              theme={theme}
              toggleTheme={toggleTheme}
              fetchRandomMovie={fetchRandomMovie}
              trending={trending}
              watchMovie={watchMovie}
              loading={loading}
              movies={movies}
              userRatings={userRatings}
              rateMovie={rateMovie}
              toggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              handleShare={handleShare}
              watchlist={watchlist}
              toggleWatchlist={toggleWatchlist}
              isInWatchlist={isInWatchlist}
              selectedMovie={selectedMovie}
              lastWatched={lastWatched}
              streamingSources={streamingSources}
              switchSource={switchSource}
              trailerUrl={trailerUrl}
              currentMovieId={currentMovieId}
              currentReviews={currentReviews}
              reviewInput={reviewInput}
              setReviewInput={setReviewInput}
              reviewMovieId={reviewMovieId}
              setReviewMovieId={setReviewMovieId}
              handleReviewSubmit={handleReviewSubmit}
            />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}
