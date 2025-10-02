import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import debounce from "lodash.debounce";
import { FaSearch, FaPlay, FaExternalLinkAlt, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import "./AdultSearchBar.css";
import SearchInput from "./AdultSearchBar/SearchInput";
import ResultsGrid from "./AdultSearchBar/ResultsGrid";
import VideoModal from "./AdultSearchBar/VideoModal";
import PinLock from "./PinLock";
import { useTranslation } from "react-i18next";
import RenamePlaylistModal from "./AdultSearchBar/RenamePlaylistModal";

const AdultSearchBar = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sources, setSources] = useState([]);
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("adultFavorites") || "[]")
  );
  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem("adultHistory") || "[]")
  );
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem("adultFilters");
    return savedFilters
      ? JSON.parse(savedFilters)
      : { category: "", duration: "", quality: "", rating: "" };
  });
  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem("adultSortBy") || "relevance"
  );
  const [tab, setTab] = useState("all"); // all, favorites, watchlist, history
  const [watchlist, setWatchlist] = useState(() =>
    JSON.parse(localStorage.getItem("adultWatchlist") || "[]")
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() =>
    JSON.parse(localStorage.getItem("adultRecentSearches") || "[]")
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [trendingResults, setTrendingResults] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [playlists, setPlaylists] = useState(() =>
    JSON.parse(localStorage.getItem("adultPlaylists") || "[]")
  );
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [downloadQueue, setDownloadQueue] = useState(() =>
    JSON.parse(localStorage.getItem("adultDownloadQueue") || "[]")
  );
  const [_searchSuggestions, setSearchSuggestions] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
  });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    order: "top-weekly",
    duration: "",
    quality: "",
    dateRange: "",
    language: "",
    tags: [],
    excludeTags: [],
  });
  const [searchHistory, setSearchHistory] = useState(() =>
    JSON.parse(localStorage.getItem("adultSearchHistory") || "[]")
  );
  const [searchCache, setSearchCache] = useState(new Map());
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    averageResults: 0,
    popularTerms: new Map(),
  });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState("");

  // Enhanced API endpoints and configuration
  const EPORNER_API_KEY = import.meta.env.VITE_EPORNER_API_KEY;
  const EPORNER_BASE_URL = "https://www.eporner.com/api/v2/video";

  // Advanced search configuration
  const searchConfig = {
    perPage: 48,
    thumbSize: "medium",
    order: "top-weekly", // top-weekly, top-monthly, top-yearly, newest, rating
    gay: 0,
    lq: 1,
    format: "json",
  };

  const tabOrder = [
    "all",
    "trending",
    "favorites",
    "watchlist",
    "playlists",
    "downloads",
    "history",
  ];
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const activeSearchControllerRef = useRef(null);

  // Swipe gesture handlers
  let touchStartX = 0;
  let touchEndX = 0;
  const _handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  const _handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  };
  const handleSwipeGesture = () => {
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 60) {
      const currentIdx = tabOrder.indexOf(tab);
      if (deltaX < 0 && currentIdx < tabOrder.length - 1) {
        setTab(tabOrder[currentIdx + 1]);
      } else if (deltaX > 0 && currentIdx > 0) {
        setTab(tabOrder[currentIdx - 1]);
      }
    }
  };

  // Reset page and results on new search
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [searchQuery]);

  // Infinite scroll handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const nearBottom =
            window.innerHeight + window.scrollY >=
            document.body.offsetHeight - 300;
          if (nearBottom && hasMore && !isFetchingMore && !loading) {
            fetchMoreResults();
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, loading, searchResults]);

  // Add duration formatting helper
  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Enhanced search function with caching and advanced features
  const debouncedSearch = useCallback(
    debounce(async (query, advancedParams = {}) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearchStats({ totalResults: 0, searchTime: 0 });
        return;
      }

      // Require small minimum length to reduce noisy calls
      if (query.trim().length < 2) {
        setSearchResults([]);
        setSearchStats({ totalResults: 0, searchTime: 0 });
        return;
      }

      const startTime = performance.now();
      setLoading(true);

      // Create cache key
      const cacheKey = `${query}-${JSON.stringify(advancedParams)}`;

      // Check cache first
      if (searchCache.has(cacheKey)) {
        const cachedData = searchCache.get(cacheKey);
        setSearchResults(cachedData.results);
        setSearchStats(cachedData.stats);
        setLoading(false);

        // Update analytics
        updateSearchAnalytics(query, cachedData.results.length);
        return;
      }

      try {
        // Cancel any in-flight request
        if (activeSearchControllerRef.current) {
          activeSearchControllerRef.current.abort();
        }
        const controller = new AbortController();
        activeSearchControllerRef.current = controller;
        // Build advanced search URL
        const searchParams = new URLSearchParams({
          query: query,
          per_page: searchConfig.perPage,
          page: 1,
          thumbsize: searchConfig.thumbSize,
          order: advancedParams.order || searchConfig.order,
          gay: searchConfig.gay,
          lq: searchConfig.lq,
          format: searchConfig.format,
        });

        // Add advanced filters
        if (advancedParams.duration)
          searchParams.append("duration", advancedParams.duration);
        if (advancedParams.quality)
          searchParams.append("quality", advancedParams.quality);
        if (advancedParams.language)
          searchParams.append("language", advancedParams.language);
        if (advancedParams.tags && advancedParams.tags.length > 0) {
          searchParams.append("tags", advancedParams.tags.join(","));
        }

        const epornerResponse = await fetch(
          `${EPORNER_BASE_URL}/search/?${searchParams.toString()}&key=${EPORNER_API_KEY}`,
          { signal: controller.signal }
        );

        if (!epornerResponse.ok) {
          throw new Error(`HTTP error! status: ${epornerResponse.status}`);
        }

        const epornerData = await epornerResponse.json();
        let epornerResults = (epornerData.videos || []).map((video) => ({
          id: video.id,
          title: video.title,
          thumbnail: video.default_thumb.src,
          duration: formatDuration(parseInt(video.duration)),
          durationSeconds: parseInt(video.duration),
          views: video.views,
          rating: video.rating,
          source: "eporner",
          embedUrl: `https://www.eporner.com/embed/${video.id}`,
          directUrl: `https://www.eporner.com/video/${video.id}`,
          uploadDate: video.upload_date,
          tags: video.tags || [],
          language: video.language || "Unknown",
          quality: video.quality || "Unknown",
          categories: video.categories || [],
          category:
            video.categories && video.categories.length > 0
              ? video.categories[0]
              : "",
        }));
        // Note: removed heavy multi-page eager fetch for smoother UX. Use fetchMoreResults instead.

        const endTime = performance.now();
        const searchTime = Math.round(endTime - startTime);

        // Cache the results
        const cacheData = {
          results: epornerResults,
          stats: {
            totalResults: epornerResults.length,
            searchTime: searchTime,
          },
          timestamp: Date.now(),
        };
        setSearchCache((prev) => new Map(prev.set(cacheKey, cacheData)));

        setSearchResults(epornerResults);
        setSearchStats({
          totalResults: epornerResults.length,
          searchTime: searchTime,
        });

        // Update search history and analytics
        updateSearchHistory(query);
        updateSearchAnalytics(query, epornerResults.length);
        updateRecentSearches(query);

        // Show success message for large result sets
        if (epornerResults.length > 50) {
          toast.success(
            t("found_videos_in_ms", {
              count: epornerResults.length,
              time: searchTime,
            })
          );
        }
      } catch (error) {
        console.error("Error searching videos:", error);

        // Enhanced error handling
        if (error.name === "AbortError") {
          // Swallow aborted fetches (newer request in-flight)
          return;
        }
        if (error.message.includes("HTTP error! status: 429")) {
          toast.error(t("too_many_requests_please_wait_and_try_again"));
        } else if (error.message.includes("HTTP error! status: 403")) {
          toast.error(t("access_denied_please_check_your_api_key"));
        } else if (error.message.includes("HTTP error! status: 500")) {
          toast.error(t("server_error_please_try_again_later"));
        } else if (error.message.includes("Failed to fetch")) {
          toast.error(t("network_error_please_check_your_internet_connection"));
        } else {
          toast.error(t("error_searching_videos_please_try_again"));
        }

        setSearchStats({ totalResults: 0, searchTime: 0 });
      } finally {
        setLoading(false);
      }
    }, 300),
    [searchCache, searchConfig, t]
  );

  // Update search history
  const updateSearchHistory = (query) => {
    setSearchHistory((prev) => {
      const newHistory = [query, ...prev.filter((q) => q !== query)].slice(
        0,
        20
      );
      localStorage.setItem("adultSearchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Update search analytics
  const updateSearchAnalytics = (query, resultCount) => {
    setSearchAnalytics((prev) => {
      const newPopularTerms = new Map(prev.popularTerms);
      const currentCount = newPopularTerms.get(query) || 0;
      newPopularTerms.set(query, currentCount + 1);

      const totalSearches = prev.totalSearches + 1;
      const averageResults = Math.round(
        (prev.averageResults * (totalSearches - 1) + resultCount) /
          totalSearches
      );

      return {
        totalSearches,
        averageResults,
        popularTerms: newPopularTerms,
      };
    });
  };

  // Update the video mapping in fetchMoreResults
  const fetchMoreResults = async () => {
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const epornerResponse = await fetch(
        `${EPORNER_BASE_URL}/search/?query=${encodeURIComponent(
          searchQuery
        )}&per_page=${searchConfig.perPage}&page=${nextPage}&thumbsize=${
          searchConfig.thumbSize
        }&order=${advancedSearch.order || searchConfig.order}&gay=${
          searchConfig.gay
        }&lq=${searchConfig.lq}&format=${
          searchConfig.format
        }&key=${EPORNER_API_KEY}`
      );
      const epornerData = await epornerResponse.json();
      const newResults = (epornerData.videos || []).map((video) => ({
        id: video.id,
        title: video.title,
        thumbnail: video.default_thumb.src,
        duration: formatDuration(parseInt(video.duration)),
        durationSeconds: parseInt(video.duration),
        views: video.views,
        rating: video.rating,
        source: "eporner",
        embedUrl: `https://www.eporner.com/embed/${video.id}`,
        directUrl: `https://www.eporner.com/video/${video.id}`,
        uploadDate: video.upload_date,
        tags: video.tags || [],
        language: video.language || "Unknown",
        quality: video.quality || "Unknown",
        categories: video.categories || [],
        category:
          video.categories && video.categories.length > 0
            ? video.categories[0]
            : "",
      }));
      if (newResults.length < searchConfig.perPage) setHasMore(false);
      setSearchResults((prev) => [
        ...prev,
        ...newResults.filter((v) => !prev.some((x) => x.id === v.id)),
      ]);
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Update recent searches
  const updateRecentSearches = (term) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter((t) => t !== term)].slice(
      0,
      7
    );
    setRecentSearches(newRecent);
    localStorage.setItem("adultRecentSearches", JSON.stringify(newRecent));
  };

  // Show suggestions on input focus
  const handleInputFocus = () => setShowSuggestions(true);
  const handleInputBlur = () =>
    setTimeout(() => setShowSuggestions(false), 120);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    debouncedSearch(suggestion);
    updateRecentSearches(suggestion);
    setShowSuggestions(false);
  };

  // Handle search input changes (with suggestions)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
  };

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      setActiveSuggestion((prev) =>
        Math.min(prev + 1, recentSearches.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      handleSuggestionClick(recentSearches[activeSuggestion]);
    }
  };

  // Handle video selection
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    // Add to history
    setHistory((prev) => {
      const updated = [video, ...prev.filter((v) => v.id !== video.id)].slice(
        0,
        10
      );
      localStorage.setItem("adultHistory", JSON.stringify(updated));
      return updated;
    });
    fetchAdditionalSources(video.title);
  };

  // Toggle favorite
  const handleToggleFavorite = (video) => {
    setFavorites((prev) => {
      const cleanPrev = prev.filter(Boolean);
      let updated;
      if (video && cleanPrev.some((v) => v && v.id === video.id)) {
        updated = cleanPrev.filter((v) => v && v.id !== video.id);
        toast.info(t("removed_from_favorites"));
      } else if (video) {
        updated = [video, ...cleanPrev];
        toast.success(t("added_to_favorites"));
      } else {
        updated = cleanPrev;
      }
      localStorage.setItem("adultFavorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle watchlist
  const handleToggleWatchlist = (video) => {
    setWatchlist((prev) => {
      const cleanPrev = prev.filter(Boolean);
      let updated;
      if (video && cleanPrev.some((v) => v && v.id === video.id)) {
        updated = cleanPrev.filter((v) => v && v.id !== video.id);
        toast.info(t("removed_from_watchlist"));
      } else if (video) {
        updated = [video, ...cleanPrev];
        toast.success(t("added_to_watchlist"));
      } else {
        updated = cleanPrev;
      }
      localStorage.setItem("adultWatchlist", JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch additional sources for a video
  const fetchAdditionalSources = async (title) => {
    try {
      const additionalSources = [
        {
          name: "VidSrc",
          url: `https://vidsrc.to/embed/movie/${title}`,
          type: "embed",
        },
        {
          name: "FlixHQ",
          url: `https://flixhq.to/embed/${title}`,
          type: "embed",
        },
      ];
      setSources(additionalSources);
    } catch (error) {
      console.error("Error fetching additional sources:", error);
    }
  };

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem("adultFilters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem("adultSortBy", sortBy);
  }, [sortBy]);

  // Enhanced search filtering and sorting
  const applyAdvancedFilters = (results) => {
    let filtered = [...results];

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((video) =>
        video.title.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Apply duration filter
    if (filters.duration) {
      // Map UI values to duration ranges in seconds
      let min = 0,
        max = Infinity;
      if (filters.duration === "short") {
        min = 0;
        max = 10 * 60;
      } else if (filters.duration === "medium") {
        min = 10 * 60;
        max = 30 * 60;
      } else if (filters.duration === "long") {
        min = 30 * 60;
        max = Infinity;
      }
      filtered = filtered.filter((video) => {
        const duration = Number(video.durationSeconds) || 0;
        return duration >= min && duration <= max;
      });
    }

    // Apply quality filter (based on views/rating)
    if (filters.quality) {
      filtered = filtered.filter((video) => {
        const score = video.views * 0.7 + video.rating * 0.3;
        switch (filters.quality) {
          case "high":
            return score > 1000000;
          case "medium":
            return score > 100000 && score <= 1000000;
          case "low":
            return score <= 100000;
          default:
            return true;
        }
      });
    }

    // Apply rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter((video) => video.rating >= minRating);
    }

    return filtered;
  };

  // Enhanced sorting options
  const applyAdvancedSorting = (results, sortBy) => {
    const sorted = [...results];

    switch (sortBy) {
      case "relevance":
        // Sort by combination of views and rating
        return sorted.sort((a, b) => {
          const scoreA = a.views * 0.7 + a.rating * 0.3;
          const scoreB = b.views * 0.7 + b.rating * 0.3;
          return scoreB - scoreA;
        });

      case "views":
        return sorted.sort((a, b) => b.views - a.views);

      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);

      case "duration":
        return sorted.sort((a, b) => b.durationSeconds - a.durationSeconds);

      case "newest":
        // Prefer uploadDate if available
        return sorted.sort((a, b) => {
          const aDate = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
          const bDate = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
          return bDate - aDate;
        });

      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));

      default:
        return sorted;
    }
  };

  // Memoize expensive computations
  const filteredResults = useMemo(
    () => applyAdvancedSorting(applyAdvancedFilters(searchResults), sortBy),
    [searchResults, filters, categoryFilter, sortBy]
  );
  const popularSearches = [
    "amateur",
    "anal",
    "blowjob",
    "creampie",
    "cumshot",
    "deepthroat",
    "double penetration",
    "facial",
    "gangbang",
    "hardcore",
    "lesbian",
    "massage",
    "masturbation",
    "oral",
    "pov",
    "rough",
    "threesome",
    "toys",
    "vintage",
    "young",
  ];
  const allCategories = useMemo(() => {
    const categories = new Set();
    searchResults.forEach((video) => {
      const words = video.title.toLowerCase().split(" ");
      words.forEach((word) => {
        if (popularSearches.includes(word) && word.length > 3) {
          categories.add(word);
        }
      });
    });
    return Array.from(categories).slice(0, 10);
  }, [searchResults]);
  const recommendedResults = useMemo(() => {
    const userCategories = Array.from(
      new Set(
        [...history, ...favorites].flatMap((v) =>
          v.category ? [v.category] : []
        )
      )
    );
    return searchResults.filter((v) => userCategories.includes(v.category));
  }, [searchResults, history, favorites]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({ category: "", duration: "", quality: "", rating: "" });
    setSortBy("relevance");
    toast.info(t("filters_cleared"));
  };

  // Advanced search filters component
  const renderAdvancedFilters = () => {
    console.log(
      "Rendering advanced filters, showAdvancedFilters:",
      showAdvancedFilters
    );
    return (
      <div className="advanced-filters-section">
        <button
          className="advanced-filters-toggle"
          onClick={() => {
            console.log("Advanced filters toggle clicked");
            setShowAdvancedFilters(!showAdvancedFilters);
          }}
          type="button"
        >
          <span>{t("advanced_filters") || "Advanced Filters"}</span>
          <span
            className={`toggle-icon ${showAdvancedFilters ? "expanded" : ""}`}
          >
            ▼
          </span>
        </button>

        {showAdvancedFilters && (
          <div className="advanced-filters-panel">
            <div className="filter-group">
              <label>{t("sort_order") || "Sort Order"}:</label>
              <select
                value={advancedSearch.order}
                onChange={(e) => {
                  setAdvancedSearch((prev) => ({
                    ...prev,
                    order: e.target.value,
                  }));
                  if (searchQuery.trim()) {
                    debouncedSearch(searchQuery, {
                      ...advancedSearch,
                      order: e.target.value,
                    });
                  }
                }}
              >
                <option value="top-weekly">
                  {t("top_weekly") || "Top Weekly"}
                </option>
                <option value="top-monthly">
                  {t("top_monthly") || "Top Monthly"}
                </option>
                <option value="top-yearly">
                  {t("top_yearly") || "Top Yearly"}
                </option>
                <option value="newest">{t("newest") || "Newest"}</option>
                <option value="rating">
                  {t("highest_rated") || "Highest Rated"}
                </option>
                <option value="views">
                  {t("most_viewed") || "Most Viewed"}
                </option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t("duration") || "Duration"}:</label>
              <select
                value={advancedSearch.duration}
                onChange={(e) => {
                  setAdvancedSearch((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }));
                }}
              >
                <option value="">{t("any_duration") || "Any Duration"}</option>
                <option value="short">
                  {t("short_lt_10_min") || "Short (<10 min)"}
                </option>
                <option value="medium">
                  {t("medium_10_30_min") || "Medium (10-30 min)"}
                </option>
                <option value="long">
                  {t("long_gt_30_min") || "Long (>30 min)"}
                </option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t("quality") || "Quality"}:</label>
              <select
                value={advancedSearch.quality}
                onChange={(e) => {
                  setAdvancedSearch((prev) => ({
                    ...prev,
                    quality: e.target.value,
                  }));
                }}
              >
                <option value="">{t("any_quality") || "Any Quality"}</option>
                <option value="hd">{t("hd") || "HD"}</option>
                <option value="sd">{t("sd") || "SD"}</option>
                <option value="4k">{t("4k") || "4K"}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t("language") || "Language"}:</label>
              <select
                value={advancedSearch.language}
                onChange={(e) => {
                  setAdvancedSearch((prev) => ({
                    ...prev,
                    language: e.target.value,
                  }));
                }}
              >
                <option value="">{t("any_language") || "Any Language"}</option>
                <option value="en">{t("english") || "English"}</option>
                <option value="es">{t("spanish") || "Spanish"}</option>
                <option value="fr">{t("french") || "French"}</option>
                <option value="de">{t("german") || "German"}</option>
                <option value="it">{t("italian") || "Italian"}</option>
                <option value="pt">{t("portuguese") || "Portuguese"}</option>
                <option value="ru">{t("russian") || "Russian"}</option>
                <option value="ja">{t("japanese") || "Japanese"}</option>
                <option value="ko">{t("korean") || "Korean"}</option>
                <option value="zh">{t("chinese") || "Chinese"}</option>
              </select>
            </div>

            <div className="filter-actions">
              <button
                className="apply-filters-btn"
                onClick={() => {
                  console.log("Apply filters clicked");
                  if (searchQuery.trim()) {
                    debouncedSearch(searchQuery, advancedSearch);
                  }
                }}
                type="button"
              >
                {t("apply_filters") || "Apply Filters"}
              </button>
              <button
                className="clear-filters-btn"
                onClick={() => {
                  console.log("Clear filters clicked");
                  setAdvancedSearch({
                    order: "top-weekly",
                    duration: "",
                    quality: "",
                    dateRange: "",
                    language: "",
                    tags: [],
                    excludeTags: [],
                  });
                  if (searchQuery.trim()) {
                    debouncedSearch(searchQuery, {});
                  }
                }}
                type="button"
              >
                {t("clear_all") || "Clear All"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Regular filters section
  const renderFilters = () => {
    console.log(
      "Rendering filters, current filters:",
      filters,
      "sortBy:",
      sortBy
    );
    const hasActiveFilters =
      filters.category ||
      filters.duration ||
      filters.quality ||
      filters.rating ||
      sortBy !== "relevance";

    return (
      <div className="filters-section">
        <div className="filters-group">
          <select
            value={filters.category}
            onChange={(e) => {
              console.log("Category filter changed:", e.target.value);
              setFilters((f) => ({ ...f, category: e.target.value }));
              toast.info(t("category_filter") + `: ${e.target.value || "All"}`);
            }}
            className={filters.category ? "active" : ""}
          >
            <option value="">All Categories</option>
            <option value="straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="lesbian">Lesbian</option>
          </select>

          <select
            value={filters.duration}
            onChange={(e) => {
              console.log("Duration filter changed:", e.target.value);
              setFilters((f) => ({ ...f, duration: e.target.value }));
              toast.info(t("duration_filter") + `: ${e.target.value || "All"}`);
            }}
            className={filters.duration ? "active" : ""}
          >
            <option value="">All Durations</option>
            <option value="short">Short (&lt;10m)</option>
            <option value="medium">Medium (10-30m)</option>
            <option value="long">Long (&gt;30m)</option>
          </select>

          <select
            value={filters.quality}
            onChange={(e) => {
              console.log("Quality filter changed:", e.target.value);
              setFilters((f) => ({ ...f, quality: e.target.value }));
              toast.info(t("quality_filter") + `: ${e.target.value || "All"}`);
            }}
            className={filters.quality ? "active" : ""}
          >
            <option value="">All Qualities</option>
            <option value="hd">HD</option>
            <option value="sd">SD</option>
          </select>

          <select
            value={filters.rating}
            onChange={(e) => {
              console.log("Rating filter changed:", e.target.value);
              setFilters((f) => ({ ...f, rating: e.target.value }));
              toast.info(t("rating_filter") + `: ${e.target.value || "All"}`);
            }}
            className={filters.rating ? "active" : ""}
          >
            <option value="">All Ratings</option>
            <option value="high">High (4.5+)</option>
            <option value="medium">Medium (3.5-4.5)</option>
            <option value="low">Low (&lt;3.5)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              console.log("Sort by changed:", e.target.value);
              setSortBy(e.target.value);
              toast.info(t("sorting_by") + `: ${e.target.value}`);
            }}
            className={sortBy !== "relevance" ? "active" : ""}
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="views">Most Viewed</option>
            <option value="rating">Top Rated</option>
            <option value="duration">Longest</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            className="clear-filters"
            onClick={() => {
              console.log("Clear filters clicked");
              clearFilters();
            }}
            aria-label={t("clear_all_filters")}
          >
            {t("clear_filters")}
          </button>
        )}

        {hasActiveFilters && (
          <div className="active-filters-info">
            {filteredResults.length} {t("results_found")}
          </div>
        )}
      </div>
    );
  };

  // Loading skeletons and empty states
  const renderSkeletons = () => (
    <div className="search-results">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="result-card skeleton">
          <div className="skeleton-preview" />
          <div className="skeleton-info">
            <div className="skeleton-title" />
            <div className="skeleton-meta" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="no-results">
      <h3>No Results Found</h3>
      <p>
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </div>
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const idx = tabOrder.indexOf(tab);
        if (e.key === "ArrowLeft" && idx > 0) setTab(tabOrder[idx - 1]);
        if (e.key === "ArrowRight" && idx < tabOrder.length - 1)
          setTab(tabOrder[idx + 1]);
      }
      if (["1", "2", "3", "4"].includes(e.key)) {
        setTab(tabOrder[parseInt(e.key, 10) - 1]);
      }
      if (e.key === "/" && searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tab]);

  // Helper to get current list for modal navigation
  const getCurrentList = () => {
    if (tab === "favorites") return favorites;
    if (tab === "watchlist") return watchlist;
    if (tab === "history") return history;
    return searchResults;
  };
  const currentList = getCurrentList();
  const currentIdx = selectedVideo
    ? currentList.findIndex((v) => v.id === selectedVideo.id)
    : -1;
  const handlePrevVideo = () => {
    if (currentIdx > 0) setSelectedVideo(currentList[currentIdx - 1]);
  };
  const handleNextVideo = () => {
    if (currentIdx < currentList.length - 1)
      setSelectedVideo(currentList[currentIdx + 1]);
  };

  // Fetch trending videos on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `${EPORNER_BASE_URL}/search/?per_page=20&page=1&thumbsize=medium&order=top-rated&gay=0&lq=1&format=json&key=${EPORNER_API_KEY}`
        );
        const data = await res.json();
        setTrendingResults(
          (data.videos || []).map((video) => ({
            id: video.id,
            title: video.title,
            thumbnail: video.default_thumb.src,
            duration: formatDuration(parseInt(video.duration)),
            durationSeconds: parseInt(video.duration),
            views: video.views,
            rating: video.rating,
            source: "eporner",
            embedUrl: `https://www.eporner.com/embed/${video.id}`,
            directUrl: `https://www.eporner.com/video/${video.id}`,
            category:
              video.categories && video.categories.length > 0
                ? video.categories[0]
                : "",
            categories: video.categories || [],
          }))
        );
      } catch {
        // Ignore fetch errors for trending
      }
    };
    fetchTrending();
  }, []);

  // Extract unique categories from results
  const _filteredResultsByCategory = categoryFilter
    ? searchResults.filter((v) => v.category === categoryFilter)
    : searchResults;

  // Recommended for You: videos with categories/tags from history/favorites
  const _userCategories = Array.from(
    new Set(
      [...history, ...favorites].flatMap((v) =>
        v.category ? [v.category] : []
      )
    ).values()
  );

  // Debounced localStorage writers
  const debouncedSetFavorites = useRef(
    debounce((favorites) => {
      localStorage.setItem("adultFavorites", JSON.stringify(favorites));
    }, 500)
  ).current;
  const debouncedSetWatchlist = useRef(
    debounce((watchlist) => {
      localStorage.setItem("adultWatchlist", JSON.stringify(watchlist));
    }, 500)
  ).current;
  const debouncedSetPlaylists = useRef(
    debounce((playlists) => {
      localStorage.setItem("adultPlaylists", JSON.stringify(playlists));
    }, 500)
  ).current;
  const debouncedSetDownloadQueue = useRef(
    debounce((queue) => {
      localStorage.setItem("adultDownloadQueue", JSON.stringify(queue));
    }, 500)
  ).current;

  // Use effects to call debounced writers
  useEffect(() => {
    debouncedSetFavorites(favorites);
  }, [favorites]);
  useEffect(() => {
    debouncedSetWatchlist(watchlist);
  }, [watchlist]);
  useEffect(() => {
    debouncedSetPlaylists(playlists);
  }, [playlists]);
  useEffect(() => {
    debouncedSetDownloadQueue(downloadQueue);
  }, [downloadQueue]);

  // Save playlists to localStorage
  const savePlaylists = (newPlaylists) => {
    // Ensure we're always saving an array
    const safePlaylists = Array.isArray(newPlaylists) ? newPlaylists : [];
    setPlaylists(safePlaylists);
    localStorage.setItem("adultPlaylists", JSON.stringify(safePlaylists));
  };

  // Create new playlist
  const createPlaylist = (name) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];

    const newPlaylist = {
      id: Date.now().toString(),
      name: name,
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: "",
      isPublic: false,
    };

    const updatedPlaylists = [...safePlaylists, newPlaylist];
    savePlaylists(updatedPlaylists);
    setCurrentPlaylist(newPlaylist);
    setPlaylistName("");
    setShowPlaylistModal(false);

    toast.success(t("playlist_created_successfully", { name: name }));
  };

  // Add video to playlist
  const addToPlaylist = (video, playlistId) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];

    const updatedPlaylists = safePlaylists.map((playlist) => {
      if (playlist.id === playlistId) {
        // Check if video already exists
        const videoExists = playlist.videos.some((v) => v.id === video.id);
        if (videoExists) {
          toast.info(t("video_already_in_playlist"));
          return playlist;
        }

        return {
          ...playlist,
          videos: [...playlist.videos, video],
          updatedAt: new Date().toISOString(),
        };
      }
      return playlist;
    });

    savePlaylists(updatedPlaylists);
    toast.success(t("video_added_to_playlist"));
  };

  // Remove video from playlist
  const removeFromPlaylist = (videoId, playlistId) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];

    const updatedPlaylists = safePlaylists.map((playlist) => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          videos: playlist.videos.filter((v) => v.id !== videoId),
          updatedAt: new Date().toISOString(),
        };
      }
      return playlist;
    });

    savePlaylists(updatedPlaylists);
    toast.success(t("video_removed_from_playlist"));
  };

  // Delete playlist
  const deletePlaylist = (playlistId) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];

    const updatedPlaylists = safePlaylists.filter((p) => p.id !== playlistId);
    savePlaylists(updatedPlaylists);

    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setCurrentPlaylist(null);
    }

    toast.success(t("playlist_deleted_successfully"));
  };

  // Playlist management component
  const renderPlaylistManager = () => {
    // Safety check to ensure playlists is always an array
    const safePlaylists = Array.isArray(playlists) ? playlists : [];

    return (
      <div className="playlist-manager">
        <div className="playlist-header">
          <h4>{t("my_playlists")}</h4>
          <button
            className="create-playlist-btn"
            onClick={() => setShowPlaylistModal(true)}
          >
            <span>+</span> {t("create_playlist")}
          </button>
        </div>

        {safePlaylists.length === 0 ? (
          <div className="empty-playlists">
            <div className="empty-icon">📋</div>
            <p>{t("no_playlists_yet_create_your_first_playlist")}</p>
          </div>
        ) : (
          <div className="playlists-grid">
            {safePlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className={`playlist-card ${
                  currentPlaylist?.id === playlist.id ? "active" : ""
                }`}
                onClick={() => setCurrentPlaylist(playlist)}
              >
                <div className="playlist-info">
                  <h5>{playlist.name}</h5>
                  <p>
                    {playlist.videos.length} {t("videos")}
                  </p>
                  <span className="playlist-date">
                    {new Date(playlist.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="playlist-actions">
                  <button
                    className="playlist-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(playlist.id);
                    }}
                    title={t("delete_playlist")}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentPlaylist && (
          <div className="current-playlist">
            <h5>
              {t("current_playlist")}: {currentPlaylist.name}
            </h5>
            <div className="playlist-videos">
              {currentPlaylist.videos.length === 0 ? (
                <p>{t("no_videos_in_this_playlist_yet")}</p>
              ) : (
                <div className="playlist-videos-grid">
                  {currentPlaylist.videos.map((video) => (
                    <div key={video.id} className="playlist-video-item">
                      <img src={video.thumbnail} alt={video.title} />
                      <div className="video-info">
                        <h6>{video.title}</h6>
                        <span>{video.duration}</span>
                      </div>
                      <button
                        className="remove-video-btn"
                        onClick={() =>
                          removeFromPlaylist(video.id, currentPlaylist.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Playlist modal
  const renderPlaylistModal = () => {
    if (!showPlaylistModal) return null;

    return (
      <div
        className="playlist-modal-overlay"
        onClick={() => setShowPlaylistModal(false)}
      >
        <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>{t("create_new_playlist")}</h4>
            <button
              className="close-modal-btn"
              onClick={() => setShowPlaylistModal(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            <div className="input-group">
              <label>{t("playlist_name")}:</label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder={t("enter_playlist_name")}
                maxLength={50}
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowPlaylistModal(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="create-btn"
                onClick={() => {
                  if (playlistName.trim()) {
                    createPlaylist(playlistName.trim());
                  } else {
                    toast.error(t("please_enter_a_playlist_name"));
                  }
                }}
                disabled={!playlistName.trim()}
              >
                {t("create_playlist")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generate trending searches based on current time
  const generateTrendingSearches = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    let trending = [...popularSearches];

    // Add time-based suggestions
    if (hour >= 22 || hour <= 6) {
      trending.unshift("night", "late night", "bedroom");
    } else if (hour >= 7 && hour <= 12) {
      trending.unshift("morning", "breakfast", "wake up");
    } else if (hour >= 13 && hour <= 17) {
      trending.unshift("afternoon", "lunch", "work");
    } else {
      trending.unshift("evening", "dinner", "relax");
    }

    // Add day-based suggestions
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      trending.unshift("weekend", "party", "celebration");
    } else {
      trending.unshift("weekday", "stress relief", "quick");
    }

    return trending.slice(0, 10);
  };

  // Initialize trending searches
  useEffect(() => {
    setTrendingSearches(generateTrendingSearches());
  }, []);

  // Generate search suggestions based on input
  const generateSearchSuggestions = (query) => {
    if (!query.trim()) return [];

    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Add popular searches that match the query
    popularSearches.forEach((term) => {
      if (term.includes(lowerQuery) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });

    // Add recent searches that match the query
    recentSearches.forEach((term) => {
      if (
        term.toLowerCase().includes(lowerQuery) &&
        !suggestions.includes(term)
      ) {
        suggestions.push(term);
      }
    });

    // Add query-based suggestions
    if (lowerQuery.includes("anal")) {
      suggestions.push("anal creampie", "anal toys", "anal training");
    } else if (lowerQuery.includes("oral")) {
      suggestions.push("blowjob", "deepthroat", "facial");
    } else if (lowerQuery.includes("lesbian")) {
      suggestions.push("lesbian toys", "lesbian massage", "lesbian orgasm");
    }

    return suggestions.slice(0, 8);
  };

  // Update search suggestions when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const suggestions = generateSearchSuggestions(searchQuery);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, recentSearches]);

  // Search analytics dashboard component
  const renderSearchAnalytics = () => {
    if (searchAnalytics.totalSearches === 0) return null;

    const topSearches = Array.from(searchAnalytics.popularTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return (
      <div className="search-analytics-dashboard">
        <div className="analytics-header">
          <h4>{t("search_analytics")}</h4>
          <span className="analytics-subtitle">
            {t("your_search_insights")}
          </span>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">🔍</div>
            <div className="analytics-content">
              <div className="analytics-value">
                {searchAnalytics.totalSearches}
              </div>
              <div className="analytics-label">{t("total_searches")}</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">📊</div>
            <div className="analytics-content">
              <div className="analytics-value">
                {searchAnalytics.averageResults}
              </div>
              <div className="analytics-label">{t("avg_results")}</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">⚡</div>
            <div className="analytics-content">
              <div className="analytics-value">{searchCache.size}</div>
              <div className="analytics-label">{t("cached_results")}</div>
            </div>
          </div>
        </div>

        {topSearches.length > 0 && (
          <div className="top-searches">
            <h5>{t("top_searches")}</h5>
            <div className="top-searches-list">
              {topSearches.map(([term, count], index) => (
                <button
                  key={term}
                  className="top-search-item"
                  onClick={() => {
                    setSearchQuery(term);
                    debouncedSearch(term);
                  }}
                >
                  <span className="search-rank">#{index + 1}</span>
                  <span className="search-term">{term}</span>
                  <span className="search-count">
                    {count} {t("searches")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Smart recommendations system
  const generateSmartRecommendations = () => {
    const recommendations = [];

    // Based on search history
    if (searchHistory.length > 0) {
      const recentSearches = searchHistory.slice(0, 3);
      recommendations.push({
        type: "recent",
        title: t("recent_searches"),
        items: recentSearches.map((term) => ({
          text: term,
          icon: "",
          action: () => {
            setSearchQuery(term);
            debouncedSearch(term);
          },
        })),
      });
    }

    // Based on popular terms
    if (searchAnalytics.popularTerms.size > 0) {
      const popularTerms = Array.from(searchAnalytics.popularTerms.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([term]) => term);

      recommendations.push({
        type: "popular",
        title: t("popular_searches"),
        items: popularTerms.map((term) => ({
          text: term,
          icon: "🔥",
          action: () => {
            setSearchQuery(term);
            debouncedSearch(term);
          },
        })),
      });
    }

    // Based on time of day
    const hour = new Date().getHours();
    let timeBasedSuggestions = [];

    if (hour >= 22 || hour <= 6) {
      timeBasedSuggestions = ["night", "bedroom", "late night"];
    } else if (hour >= 7 && hour <= 12) {
      timeBasedSuggestions = ["morning", "breakfast", "wake up"];
    } else if (hour >= 13 && hour <= 17) {
      timeBasedSuggestions = ["afternoon", "lunch", "work"];
    } else {
      timeBasedSuggestions = ["evening", "dinner", "relax"];
    }

    recommendations.push({
      type: "time",
      title: t("time_based_suggestions"),
      items: timeBasedSuggestions.map((term) => ({
        text: term,
        icon: "⏰",
        action: () => {
          setSearchQuery(term);
          debouncedSearch(term);
        },
      })),
    });

    return recommendations;
  };

  // Render smart recommendations
  const renderSmartRecommendations = () => {
    const recommendations = generateSmartRecommendations();

    if (recommendations.length === 0) return null;

    return (
      <div className="smart-recommendations">
        <div className="recommendations-header">
          <h4>{t("smart_recommendations")}</h4>
          <span className="recommendations-subtitle">
            {t("personalized_for_you")}
          </span>
        </div>

        <div className="recommendations-grid">
          {recommendations.map((section) => (
            <div key={section.type} className="recommendation-section">
              <h5 className="section-title">{section.title}</h5>
              <div className="recommendation-items">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={`${section.type}-${itemIndex}`}
                    className="recommendation-item"
                    onClick={item.action}
                  >
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-text">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Ensure playlists is always an array
  useEffect(() => {
    if (!Array.isArray(playlists)) {
      console.warn("Playlists is not an array, resetting to empty array");
      setPlaylists([]);
      localStorage.removeItem("adultPlaylists");
    }
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem("adultPlaylists", JSON.stringify(playlists));
  }, [playlists]);

  // Add this function near other playlist handlers
  const _handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
    } else {
      toast.error(t("please_enter_a_playlist_name"));
    }
  };

  const handleRemoveFromDownloadQueue = (videoId) => {
    setDownloadQueue((prevQueue) => {
      const updatedQueue = prevQueue.filter((v) => v.id !== videoId);
      localStorage.setItem("adultDownloadQueue", JSON.stringify(updatedQueue));
      return updatedQueue;
    });
  };

  // Clean up null/invalid entries from favorites, watchlist, and history after loading
  useEffect(() => {
    const clean = (arr) =>
      Array.isArray(arr)
        ? arr.filter((item) => item && typeof item === "object" && item.id)
        : [];
    const cleanedFavorites = clean(favorites);
    const cleanedWatchlist = clean(watchlist);
    const cleanedHistory = clean(history);
    if (cleanedFavorites.length !== favorites.length) {
      setFavorites(cleanedFavorites);
      localStorage.setItem("adultFavorites", JSON.stringify(cleanedFavorites));
    }
    if (cleanedWatchlist.length !== watchlist.length) {
      setWatchlist(cleanedWatchlist);
      localStorage.setItem("adultWatchlist", JSON.stringify(cleanedWatchlist));
    }
    if (cleanedHistory.length !== history.length) {
      setHistory(cleanedHistory);
      localStorage.setItem("adultHistory", JSON.stringify(cleanedHistory));
    }
  }, []);

  const _handleRenamePlaylist = (playlistId, currentName) => {
    setShowRenameModal(true);
    setEditingPlaylistId(playlistId);
    setEditingPlaylistName(currentName);
  };

  const renamePlaylist = (playlistId, newName) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, name: newName } : p))
    );
    toast.success(t("playlist_renamed_successfully"));
  };

  const handleConfirmRename = () => {
    if (editingPlaylistId) {
      renamePlaylist(editingPlaylistId, editingPlaylistName);
    }
    setShowRenameModal(false);
  };

  return (
    <PinLock sectionName="Adult Search" isVideoPlaying={!!selectedVideo}>
      <div className="adult-search-container" ref={containerRef}>
        <SearchInput
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          loading={loading}
          recentSearches={recentSearches}
          onSuggestionClick={handleSuggestionClick}
          showSuggestions={showSuggestions}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          inputRef={searchInputRef}
          placeholder={t("search_adult_videos")}
        />

        {/* Search Statistics */}
        {searchStats.totalResults > 0 && (
          <div className="search-stats">
            <span className="stats-text">
              {t("found_videos_in_ms", {
                count: searchStats.totalResults,
                time: searchStats.searchTime,
              })}
            </span>
          </div>
        )}

        {/* Trending Searches */}
        {!searchQuery.trim() && !loading && (
          <div className="trending-searches">
            <h4>{t("trending_searches")}</h4>
            <div className="trending-tags">
              {trendingSearches.map((term, index) => (
                <button
                  key={term}
                  className="trending-tag"
                  onClick={() => {
                    setSearchQuery(term);
                    debouncedSearch(term);
                  }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {renderAdvancedFilters()}
        {renderFilters()}
        <div className="tabs">
          <button
            type="button"
            className={tab === "all" ? "active" : ""}
            onClick={() => {
              console.log("Tab clicked: all");
              setTab("all");
            }}
          >
            {t("all") || "All"}
          </button>
          <button
            type="button"
            className={tab === "favorites" ? "active" : ""}
            onClick={() => {
              console.log("Tab clicked: favorites");
              setTab("favorites");
            }}
          >
            {t("favorites") || "Favorites"}
          </button>
          <button
            type="button"
            className={tab === "watchlist" ? "active" : ""}
            onClick={() => {
              console.log("Tab clicked: watchlist");
              setTab("watchlist");
            }}
          >
            {t("watchlist") || "Watchlist"}
          </button>
          <button
            type="button"
            className={tab === "history" ? "active" : ""}
            onClick={() => {
              console.log("Tab clicked: history");
              setTab("history");
            }}
          >
            {t("recently_watched") || "Recently Watched"}
          </button>
          <button
            type="button"
            className={tab === "playlists" ? "active" : ""}
            onClick={() => {
              console.log("Tab clicked: playlists");
              setTab("playlists");
            }}
          >
            {t("playlists") || "Playlists"}
          </button>
          <button
            type="button"
            className={tab === "downloads" ? "active" : ""}
            onClick={() => {
              console.log("Tab clicked: downloads");
              setTab("downloads");
            }}
          >
            {t("download_queue") || "Download Queue"}
          </button>
        </div>
        {tab === "all" && allCategories.length > 1 && (
          <div className="category-filter-bar">
            <div className="category-filter-header">
              <h4>{t("filter_by_category")}</h4>
              <span className="category-count">
                ({allCategories.length} {t("categories")})
              </span>
            </div>
            <div className="category-buttons">
              <button
                type="button"
                className={`category-btn ${!categoryFilter ? "active" : ""}`}
                onClick={() => setCategoryFilter("")}
                title={t("show_all_categories")}
              >
                <span className="category-icon">🎬</span>
                <span className="category-text">{t("all")}</span>
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-btn ${
                    categoryFilter === cat ? "active" : ""
                  }`}
                  onClick={() => setCategoryFilter(cat)}
                  title={t("filter_by") + `: ${cat}`}
                >
                  <span className="category-icon">
                    {cat === "amateur"
                      ? "📱"
                      : cat === "anal"
                      ? "🍑"
                      : cat === "blowjob"
                      ? "💋"
                      : cat === "creampie"
                      ? "💦"
                      : cat === "cumshot"
                      ? "💧"
                      : cat === "deepthroat"
                      ? "👅"
                      : cat === "facial"
                      ? "🎭"
                      : cat === "gangbang"
                      ? "👥"
                      : cat === "hardcore"
                      ? "🔥"
                      : cat === "lesbian"
                      ? "👭"
                      : cat === "massage"
                      ? "💆"
                      : cat === "masturbation"
                      ? "✋"
                      : cat === "oral"
                      ? "👄"
                      : cat === "pov"
                      ? "📹"
                      : cat === "rough"
                      ? "⚡"
                      : cat === "threesome"
                      ? "👨‍👩‍👧"
                      : cat === "toys"
                      ? "🔌"
                      : cat === "vintage"
                      ? "📼"
                      : cat === "young"
                      ? "🌸"
                      : "🎯"}
                  </span>
                  <span className="category-text">{cat}</span>
                  {categoryFilter === cat && (
                    <span className="active-indicator">✓</span>
                  )}
                </button>
              ))}
            </div>
            {categoryFilter && (
              <div className="category-filter-info">
                <span>
                  {t("filtering_by")} <strong>{categoryFilter}</strong>
                </span>
                <button
                  type="button"
                  className="clear-category-btn"
                  onClick={() => setCategoryFilter("")}
                  title={t("clear_category_filter")}
                >
                  ✕ {t("clear")}
                </button>
              </div>
            )}
          </div>
        )}
        {tab === "all" &&
          (loading ? (
            renderSkeletons()
          ) : filteredResults.length > 0 ? (
            <ResultsGrid
              searchResults={filteredResults}
              onVideoSelect={handleVideoSelect}
              favorites={favorites.map((f) => f.id)}
              onToggleFavorite={handleToggleFavorite}
              watchlist={watchlist.map((w) => w.id)}
              onToggleWatchlist={handleToggleWatchlist}
              playlists={playlists}
              onAddToPlaylist={addToPlaylist}
              onRemoveFromPlaylist={removeFromPlaylist}
            />
          ) : (
            renderEmptyState()
          ))}
        {tab === "favorites" && (
          <ResultsGrid
            searchResults={favorites.filter(Boolean)}
            onVideoSelect={handleVideoSelect}
            favorites={favorites.filter(Boolean).map((f) => f.id)}
            onToggleFavorite={handleToggleFavorite}
            watchlist={watchlist.filter(Boolean).map((w) => w.id)}
            onToggleWatchlist={handleToggleWatchlist}
            playlists={playlists}
            onAddToPlaylist={addToPlaylist}
            onRemoveFromPlaylist={removeFromPlaylist}
          />
        )}
        {tab === "watchlist" && (
          <ResultsGrid
            searchResults={watchlist.filter(Boolean)}
            onVideoSelect={handleVideoSelect}
            favorites={favorites.filter(Boolean).map((f) => f.id)}
            onToggleFavorite={handleToggleFavorite}
            watchlist={watchlist.filter(Boolean).map((w) => w.id)}
            onToggleWatchlist={handleToggleWatchlist}
            playlists={playlists}
            onAddToPlaylist={addToPlaylist}
            onRemoveFromPlaylist={removeFromPlaylist}
          />
        )}
        {tab === "history" && (
          <ResultsGrid
            searchResults={history.filter(Boolean)}
            onVideoSelect={handleVideoSelect}
            favorites={favorites.filter(Boolean).map((f) => f.id)}
            onToggleFavorite={handleToggleFavorite}
            watchlist={watchlist.filter(Boolean).map((w) => w.id)}
            onToggleWatchlist={handleToggleWatchlist}
            playlists={playlists}
            onAddToPlaylist={addToPlaylist}
            onRemoveFromPlaylist={removeFromPlaylist}
          />
        )}
        {tab === "all" && recommendedResults.length > 0 && (
          <div className="recommended-section fade-slide">
            <h3>{t("recommended_for_you")}</h3>
            <ResultsGrid
              searchResults={recommendedResults}
              onVideoSelect={handleVideoSelect}
              favorites={favorites.map((f) => f.id)}
              onToggleFavorite={handleToggleFavorite}
              watchlist={watchlist.map((w) => w.id)}
              onToggleWatchlist={handleToggleWatchlist}
              playlists={playlists}
              onAddToPlaylist={addToPlaylist}
              onRemoveFromPlaylist={removeFromPlaylist}
            />
          </div>
        )}
        {tab === "trending" && (
          <div className="fade-slide">
            <ResultsGrid
              searchResults={trendingResults}
              onVideoSelect={handleVideoSelect}
              favorites={favorites.map((f) => f.id)}
              onToggleFavorite={handleToggleFavorite}
              watchlist={watchlist.map((w) => w.id)}
              onToggleWatchlist={handleToggleWatchlist}
              playlists={playlists}
              onAddToPlaylist={addToPlaylist}
              onRemoveFromPlaylist={removeFromPlaylist}
            />
          </div>
        )}
        {tab === "playlists" && (
          <div className="fade-slide">{renderPlaylistManager()}</div>
        )}
        {tab === "downloads" && (
          <div className="fade-slide">
            <div className="download-queue-panel">
              <h4>{t("download_queue")}</h4>
              <ResultsGrid
                searchResults={downloadQueue}
                onVideoSelect={handleVideoSelect}
                favorites={favorites.map((f) => f.id)}
                onToggleFavorite={handleToggleFavorite}
                watchlist={watchlist.map((w) => w.id)}
                onToggleWatchlist={handleToggleWatchlist}
                onRemoveFromDownloadQueue={handleRemoveFromDownloadQueue}
                downloadQueueMode={true}
              />
            </div>
          </div>
        )}
        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            sources={sources}
            onClose={() => setSelectedVideo(null)}
            onPrev={handlePrevVideo}
            onNext={handleNextVideo}
            showPrev={currentIdx > 0}
            showNext={currentIdx < currentList.length - 1}
            allVideos={searchResults}
            onVideoSelect={handleVideoSelect}
          />
        )}
        {isFetchingMore && (
          <div
            style={{ textAlign: "center", color: "#ff3333", margin: "20px" }}
          >
            {t("loading_more")}
          </div>
        )}
        {renderSearchAnalytics()}
        {renderSmartRecommendations()}
        {renderPlaylistManager()}
        {renderPlaylistModal()}
        <RenamePlaylistModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          onRename={handleConfirmRename}
          currentName={editingPlaylistName}
        />
      </div>
    </PinLock>
  );
};

export default AdultSearchBar;
