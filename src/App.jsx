import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import "./App.css";
import "./i18n";
import { config } from "./config";
import { withErrorHandler, AppError, ERROR_TYPES } from "./utils/errorHandler";
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
// Lazy load heavy components
const AdminPanelPage = React.lazy(() => import("./AdminPanelPage"));
const ThemePage = React.lazy(() => import("./ThemePage"));
const AnimatedBgPage = React.lazy(() => import("./AnimatedBgPage"));
const MovieListsPage = React.lazy(() => import("./MovieListsPage"));
const AdultSectionPage = React.lazy(() => import("./AdultSectionPage"));

// Regular imports for core components
import ErrorBoundary from "./components/ErrorBoundary";
import LogoAnimation from "./components/LogoAnimation";
import PinLock from "./components/PinLock";
import { useAppContext } from "./context/AppContext";
import HomePage from "./HomePage";

// Loading component
const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
  </div>
);

export default function App() {
  const API_KEY = config.api.key;
  const BASE_URL = config.api.baseUrl;
  const { t, i18n } = useTranslation();
  // Use context for global state
  const {
    theme,
    setTheme,
    profile,
    setProfile,
    watchlist,
    setWatchlist,
    favorites,
    setFavorites,
    reviews,
    setReviews,
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

  const setBackgroundImage = useCallback(
    async (movieId) => {
      const defaultImage = "url('default-background.jpg')";

      try {
        if (!movieId) {
          document.body.style.backgroundImage = defaultImage;
          return;
        }

        const res = await fetch(
          `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        if (data.backdrop_path) {
          const imageUrl = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageUrl;
            });

            document.body.style.backgroundImage = `url('${imageUrl}')`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundPosition = "center";
            document.body.style.backgroundRepeat = "no-repeat";
          } catch (imgError) {
            console.error("Error loading image:", imgError);
            document.body.style.backgroundImage = defaultImage;
          }
        } else {
          document.body.style.backgroundImage = defaultImage;
        }
      } catch (err) {
        console.error("Error setting background image:", err);
        document.body.style.backgroundImage = defaultImage;
        toast.error(t("Error loading background image"));
      }
    },
    [BASE_URL, API_KEY, t]
  );

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
  }, [setBackgroundImage]);

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
      return withErrorHandler(
        async () => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new AppError(
              `API request failed: ${response.status} ${response.statusText}`,
              ERROR_TYPES.API,
              response.status >= 500 ? "HIGH" : "MEDIUM"
            );
          }
          return await response.json();
        },
        {
          customMessage: t("Error fetching data"),
          context: { url, operation: "API fetch" },
        }
      );
    },
    [t]
  );

  // Optimize search with debounce
  const debouncedSearch = useMemo(
    () =>
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
      }, config.performance.searchDebounceDelay),
    [API_KEY, BASE_URL, selectedGenre, searchInput, fetchWithErrorHandling, t]
  );

  // Optimize scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight -
          config.performance.infiniteScrollThreshold &&
      !loading &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  // Add scroll event listener (passive for better scrolling performance)
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  // Trending movies fetch with pagination (load more pages for bigger carousel)
  useEffect(() => {
    const fetchTrendingPages = async () => {
      try {
        setLoading(true);
        const pagesToFetch = [1, 2, 3]; // fetch first 3 pages (~60 items)
        const responses = await Promise.all(
          pagesToFetch.map((p) =>
            fetch(
              `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&page=${p}`
            )
          )
        );
        const bad = responses.find((r) => !r.ok);
        if (bad) throw new Error(`HTTP error! status: ${bad.status}`);

        const payloads = await Promise.all(responses.map((r) => r.json()));
        const combined = payloads.flatMap((d) => d?.results || []);
        // de-duplicate by id while preserving order
        const seen = new Set();
        const unique = [];
        for (const item of combined) {
          if (item && !seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
        setTrending(unique);
      } catch (error) {
        console.error("Error fetching trending movies:", error);
        toast.error(t("Error loading trending movies"));
        setTrending([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingPages();
  }, [BASE_URL, API_KEY, t]);

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

  const saveWatchedToHistory = (
    movieId,
    movieTitle,
    releaseDate,
    posterPath
  ) => {
    try {
      const raw = localStorage.getItem("movieLists");
      const lists = raw ? JSON.parse(raw) : [];
      const title = (movieTitle || "").toString();
      const item = {
        id: movieId,
        title,
        release_date: releaseDate || null,
        poster_path: posterPath || null,
        watchedAt: new Date().toISOString(),
      };
      const findIndexByName = (arr, name) =>
        arr.findIndex(
          (l) => (l?.name || "").toLowerCase() === name.toLowerCase()
        );
      let idx = findIndexByName(lists, "History");
      if (idx === -1) {
        lists.push({
          name: "History",
          movies: [],
          favorite: false,
          createdAt: Date.now(),
        });
        idx = lists.length - 1;
      }
      const list = lists[idx];
      const movies = Array.isArray(list.movies) ? [...list.movies] : [];
      // De-duplicate by title (case-insensitive); remove any previous entry of same title
      const norm = title.trim().toLowerCase();
      const filtered = movies.filter((m) => {
        const mt = typeof m === "string" ? m : m?.title || m?.name || "";
        return mt.trim().toLowerCase() !== norm;
      });
      // Prepend most-recent first; cap history length
      const capped = [item, ...filtered].slice(0, 200);
      lists[idx] = { ...list, movies: capped };
      localStorage.setItem("movieLists", JSON.stringify(lists));
    } catch {
      // fail silently; history is a non-critical feature
    }
  };

  const watchMovie = (movieId, movieTitle, releaseDate, posterPath) => {
    const movieData = { movieID: movieId, movieTitle };
    localStorage.setItem("lastWatchedMovie", JSON.stringify(movieData));
    setLastWatched(movieData);
    setSelectedMovie(movieData);
    setBackgroundImage(movieId);
    fetchTrailer(movieId);
    // Save to History list
    saveWatchedToHistory(movieId, movieTitle, releaseDate, posterPath);
  };

  const switchSource = () => {
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

  // Handle profile updates with useEffect
  useEffect(() => {
    if (editProfile && profileName.trim() && profileName !== profile.name) {
      const updated = { ...profile, name: profileName };
      setProfile(updated);
      localStorage.setItem("profile", JSON.stringify(updated));
      setEditProfile(false);
      toast.success("Profile updated!");
    }
  }, [editProfile, profile, profileName, setProfile]);

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

  // Render component
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
          {activePage === "admin" && (
            <Suspense fallback={<LoadingSpinner />}>
              <AdminPanelPage t={t} />
            </Suspense>
          )}
          {activePage === "theme" && (
            <Suspense fallback={<LoadingSpinner />}>
              <ThemePage t={t} />
            </Suspense>
          )}
          {activePage === "animatedbg" && (
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatedBgPage t={t} />
            </Suspense>
          )}
          {activePage === "lists" && (
            <Suspense fallback={<LoadingSpinner />}>
              <MovieListsPage t={t} />
            </Suspense>
          )}
          {activePage === "adult" && (
            <PinLock sectionName={t("adult_section")}>
              <Suspense fallback={<LoadingSpinner />}>
                <AdultSectionPage BASE_URL={BASE_URL} API_KEY={API_KEY} t={t} />
              </Suspense>
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
