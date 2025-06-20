import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import debounce from "lodash.debounce";
import { FaSearch, FaPlay, FaExternalLinkAlt, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import "./AdultSearchBar.css";
import SearchInput from "./AdultSearchBar/SearchInput";
import ResultsGrid from "./AdultSearchBar/ResultsGrid";
import VideoModal from "./AdultSearchBar/VideoModal";
import PinLock from "./PinLock";

const AdultSearchBar = () => {
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
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem("adultPlaylists");
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      // Ensure it's an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error parsing playlists from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem("adultPlaylists");
      return [];
    }
  });
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [downloadQueue, setDownloadQueue] = useState(() =>
    JSON.parse(localStorage.getItem("adultDownloadQueue") || "[]")
  );
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [searchStats, setSearchStats] = useState({ totalResults: 0, searchTime: 0 });
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Enhanced API endpoints and configuration
  const EPORNER_API_KEY = import.meta.env.VITE_EPORNER_API_KEY;
  const EPORNER_BASE_URL = "https://www.eporner.com/api/v2/video";
  
  // Advanced search configuration
  const searchConfig = {
    perPage: 2000,
    thumbSize: 'medium',
    order: 'top-weekly', // top-weekly, top-monthly, top-yearly, newest, rating
    gay: 0,
    lq: 1,
    format: 'json'
  };

  // Search cache for better performance
  const [searchCache, setSearchCache] = useState(new Map());
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    averageResults: 0,
    popularTerms: new Map()
  });

  // Advanced search parameters
  const [advancedSearch, setAdvancedSearch] = useState({
    order: 'top-weekly',
    duration: '',
    quality: '',
    dateRange: '',
    language: '',
    tags: [],
    excludeTags: []
  });

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

  // Swipe gesture handlers
  let touchStartX = 0;
  let touchEndX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e) => {
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
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasMore &&
        !isFetchingMore &&
        !loading
      ) {
        fetchMoreResults();
      }
    };
    window.addEventListener("scroll", handleScroll);
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
        // Build advanced search URL
        const searchParams = new URLSearchParams({
          query: query,
          per_page: searchConfig.perPage,
          page: 1,
          thumbsize: searchConfig.thumbSize,
          order: advancedParams.order || searchConfig.order,
          gay: searchConfig.gay,
          lq: searchConfig.lq,
          format: searchConfig.format
        });

        // Add advanced filters
        if (advancedParams.duration) searchParams.append('duration', advancedParams.duration);
        if (advancedParams.quality) searchParams.append('quality', advancedParams.quality);
        if (advancedParams.language) searchParams.append('language', advancedParams.language);
        if (advancedParams.tags && advancedParams.tags.length > 0) {
          searchParams.append('tags', advancedParams.tags.join(','));
        }

        const epornerResponse = await fetch(
          `${EPORNER_BASE_URL}/search/?${searchParams.toString()}&key=${EPORNER_API_KEY}`
        );
        
        if (!epornerResponse.ok) {
          throw new Error(`HTTP error! status: ${epornerResponse.status}`);
        }
        
        const epornerData = await epornerResponse.json();
        let epornerResults = epornerData.videos.map((video) => ({
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
          language: video.language || 'Unknown',
          quality: video.quality || 'Unknown',
          categories: video.categories || []
        }));

        // Multi-page fetch for more results
        if (epornerResults.length === searchConfig.perPage) {
          try {
            searchParams.set('page', '2');
            const secondPageResponse = await fetch(
              `${EPORNER_BASE_URL}/search/?${searchParams.toString()}&key=${EPORNER_API_KEY}`
            );
            
            if (secondPageResponse.ok) {
              const secondPageData = await secondPageResponse.json();
              const secondPageResults = secondPageData.videos.map((video) => ({
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
                language: video.language || 'Unknown',
                quality: video.quality || 'Unknown',
                categories: video.categories || []
              }));
              
              // Combine and deduplicate results
              const combinedResults = [...epornerResults, ...secondPageResults];
              const uniqueResults = combinedResults.filter((video, index, self) => 
                index === self.findIndex(v => v.id === video.id)
              );
              
              epornerResults = uniqueResults;
            }
          } catch (secondPageError) {
            console.log("Could not fetch second page, using first page results only");
          }
        }
        
        const endTime = performance.now();
        const searchTime = Math.round(endTime - startTime);
        
        // Cache the results
        const cacheData = {
          results: epornerResults,
          stats: { totalResults: epornerResults.length, searchTime: searchTime },
          timestamp: Date.now()
        };
        setSearchCache(prev => new Map(prev.set(cacheKey, cacheData)));
        
        setSearchResults(epornerResults);
        setSearchStats({ 
          totalResults: epornerResults.length, 
          searchTime: searchTime 
        });
        
        // Update search history and analytics
        updateSearchHistory(query);
        updateSearchAnalytics(query, epornerResults.length);
        updateRecentSearches(query);
        
        // Show success message for large result sets
        if (epornerResults.length > 50) {
          toast.success(`Found ${epornerResults.length} videos in ${searchTime}ms`);
        }
        
      } catch (error) {
        console.error("Error searching videos:", error);
        
        // Enhanced error handling
        if (error.message.includes('HTTP error! status: 429')) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else if (error.message.includes('HTTP error! status: 403')) {
          toast.error("Access denied. Please check your API key.");
        } else if (error.message.includes('HTTP error! status: 500')) {
          toast.error("Server error. Please try again later.");
        } else if (error.message.includes('Failed to fetch')) {
          toast.error("Network error. Please check your internet connection.");
        } else {
          toast.error("Error searching videos. Please try again.");
        }
        
        setSearchStats({ totalResults: 0, searchTime: 0 });
      } finally {
        setLoading(false);
      }
    }, 500),
    [searchCache, searchConfig]
  );

  // Update search history
  const updateSearchHistory = (query) => {
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 20);
      localStorage.setItem("adultSearchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Update search analytics
  const updateSearchAnalytics = (query, resultCount) => {
    setSearchAnalytics(prev => {
      const newPopularTerms = new Map(prev.popularTerms);
      const currentCount = newPopularTerms.get(query) || 0;
      newPopularTerms.set(query, currentCount + 1);
      
      const totalSearches = prev.totalSearches + 1;
      const averageResults = Math.round((prev.averageResults * (totalSearches - 1) + resultCount) / totalSearches);
      
      return {
        totalSearches,
        averageResults,
        popularTerms: newPopularTerms
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
        )}&per_page=2000&page=${nextPage}&thumbsize=medium&order=top-weekly&gay=0&lq=1&format=json&key=${EPORNER_API_KEY}`
      );
      const epornerData = await epornerResponse.json();
      const newResults = epornerData.videos.map((video) => ({
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
      }));
      if (newResults.length === 0) setHasMore(false);
      setSearchResults((prev) => [
        ...prev,
        ...newResults.filter((v) => !prev.some((x) => x.id === v.id)),
      ]);
      setPage(nextPage);
    } catch (error) {
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
        toast.info("Removed from favorites");
      } else if (video) {
        updated = [video, ...cleanPrev];
        toast.success("Added to favorites");
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
        toast.info("Removed from watchlist");
      } else if (video) {
        updated = [video, ...cleanPrev];
        toast.success("Added to watchlist");
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
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Apply duration filter
    if (filters.duration) {
      const [min, max] = filters.duration.split('-').map(Number);
      filtered = filtered.filter(video => {
        const duration = video.durationSeconds;
        if (max) {
          return duration >= min && duration <= max;
        }
        return duration >= min;
      });
    }

    // Apply quality filter (based on views/rating)
    if (filters.quality) {
      filtered = filtered.filter(video => {
        const score = (video.views * 0.7) + (video.rating * 0.3);
        switch (filters.quality) {
          case 'high':
            return score > 1000000;
          case 'medium':
            return score > 100000 && score <= 1000000;
          case 'low':
            return score <= 100000;
          default:
        return true;
        }
      });
    }

    // Apply rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(video => video.rating >= minRating);
    }

    return filtered;
  };

  // Enhanced sorting options
  const applyAdvancedSorting = (results, sortBy) => {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'relevance':
        // Sort by combination of views and rating
        return sorted.sort((a, b) => {
          const scoreA = (a.views * 0.7) + (a.rating * 0.3);
          const scoreB = (b.views * 0.7) + (b.rating * 0.3);
          return scoreB - scoreA;
        });
      
      case 'views':
        return sorted.sort((a, b) => b.views - a.views);
      
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      
      case 'duration':
        return sorted.sort((a, b) => b.durationSeconds - a.durationSeconds);
      
      case 'newest':
        // Since we don't have date, sort by ID (assuming newer videos have higher IDs)
        return sorted.sort((a, b) => b.id - a.id);
      
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
      default:
        return sorted;
    }
  };

  // Get filtered and sorted results
  const filteredResults = useMemo(() => {
    let results = applyAdvancedFilters(searchResults);
    results = applyAdvancedSorting(results, sortBy);
    return results;
  }, [searchResults, filters, categoryFilter, sortBy]);

  // Popular search terms for suggestions
  const popularSearches = [
    "amateur", "anal", "blowjob", "creampie", "cumshot", "deepthroat", 
    "double penetration", "facial", "gangbang", "hardcore", "lesbian", 
    "massage", "masturbation", "oral", "pov", "rough", "threesome", 
    "toys", "vintage", "young"
  ];

  // Get unique categories from search results
  const allCategories = useMemo(() => {
    const categories = new Set();
    searchResults.forEach(video => {
      // Extract potential categories from title
      const words = video.title.toLowerCase().split(' ');
      words.forEach(word => {
        if (popularSearches.includes(word) && word.length > 3) {
          categories.add(word);
        }
      });
    });
    return Array.from(categories).slice(0, 10);
  }, [searchResults]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({ category: "", duration: "", quality: "", rating: "" });
    setSortBy("relevance");
    toast.info("Filters cleared");
  };

  // Advanced filters and sorting UI
  const renderFilters = () => {
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
              setFilters((f) => ({ ...f, category: e.target.value }));
              toast.info(`Category filter: ${e.target.value || "All"}`);
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
              setFilters((f) => ({ ...f, duration: e.target.value }));
              toast.info(`Duration filter: ${e.target.value || "All"}`);
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
              setFilters((f) => ({ ...f, quality: e.target.value }));
              toast.info(`Quality filter: ${e.target.value || "All"}`);
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
              setFilters((f) => ({ ...f, rating: e.target.value }));
              toast.info(`Rating filter: ${e.target.value || "All"}`);
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
              setSortBy(e.target.value);
              toast.info(`Sorting by: ${e.target.value}`);
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
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}

        {hasActiveFilters && (
          <div className="active-filters-info">
            {filteredResults.length} results found
          </div>
        )}
      </div>
    );
  };

  // Loading skeletons and empty states
  const renderSkeletons = () => (
    <div className="search-results">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="result-card skeleton">
          <div className="result-thumbnail skeleton-img" />
          <div className="result-info">
            <div className="skeleton-title" />
            <div className="skeleton-meta" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="no-results">
      No results found. Try a different search or adjust your filters.
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
          data.videos.map((video) => ({
            id: video.id,
            title: video.title,
            thumbnail: video.default_thumb.src,
            duration: video.duration,
            views: video.views,
            rating: video.rating,
            source: "eporner",
            embedUrl: `https://www.eporner.com/embed/${video.id}`,
            directUrl: `https://www.eporner.com/video/${video.id}`,
            category:
              video.categories && video.categories.length > 0
                ? video.categories[0]
                : "",
          }))
        );
      } catch {}
    };
    fetchTrending();
  }, []);

  // Extract unique categories from results
  const filteredResultsByCategory = categoryFilter
    ? searchResults.filter((v) => v.category === categoryFilter)
    : searchResults;

  // Recommended for You: videos with categories/tags from history/favorites
  const userCategories = Array.from(
    new Set(
      [...history, ...favorites].flatMap((v) =>
        v.category ? [v.category] : []
      )
    ).values()
  );
  const recommendedResults = searchResults.filter((v) =>
    userCategories.includes(v.category)
  );

  // Save playlists and download queue to localStorage
  useEffect(() => {
    localStorage.setItem("adultPlaylists", JSON.stringify(playlists));
  }, [playlists]);
  useEffect(() => {
    localStorage.setItem("adultDownloadQueue", JSON.stringify(downloadQueue));
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
      isPublic: false
    };
    
    const updatedPlaylists = [...safePlaylists, newPlaylist];
    savePlaylists(updatedPlaylists);
    setCurrentPlaylist(newPlaylist);
    setPlaylistName("");
    setShowPlaylistModal(false);
    
    toast.success(`Playlist "${name}" created successfully!`);
  };

  // Add video to playlist
  const addToPlaylist = (video, playlistId) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];
    
    const updatedPlaylists = safePlaylists.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if video already exists
        const videoExists = playlist.videos.some(v => v.id === video.id);
        if (videoExists) {
          toast.info("Video already in playlist!");
          return playlist;
        }
        
        return {
          ...playlist,
          videos: [...playlist.videos, video],
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    });
    
    savePlaylists(updatedPlaylists);
    toast.success("Video added to playlist!");
  };

  // Remove video from playlist
  const removeFromPlaylist = (videoId, playlistId) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];
    
    const updatedPlaylists = safePlaylists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          videos: playlist.videos.filter(v => v.id !== videoId),
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    });
    
    savePlaylists(updatedPlaylists);
    toast.success("Video removed from playlist!");
  };

  // Delete playlist
  const deletePlaylist = (playlistId) => {
    const safePlaylists = Array.isArray(playlists) ? playlists : [];
    
    const updatedPlaylists = safePlaylists.filter(p => p.id !== playlistId);
    savePlaylists(updatedPlaylists);
    
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setCurrentPlaylist(null);
    }
    
    toast.success("Playlist deleted successfully!");
  };

  // Playlist management component
  const renderPlaylistManager = () => {
    // Safety check to ensure playlists is always an array
    const safePlaylists = Array.isArray(playlists) ? playlists : [];
    
    // Debug log
    console.log("Playlists state:", playlists, "Type:", typeof playlists, "Is Array:", Array.isArray(playlists));
    
    return (
      <div className="playlist-manager">
        <div className="playlist-header">
          <h4>My Playlists</h4>
          <button
            className="create-playlist-btn"
            onClick={() => setShowPlaylistModal(true)}
          >
            <span>+</span> Create Playlist
          </button>
        </div>
        
        {safePlaylists.length === 0 ? (
          <div className="empty-playlists">
            <div className="empty-icon">📋</div>
            <p>No playlists yet. Create your first playlist!</p>
          </div>
        ) : (
          <div className="playlists-grid">
            {safePlaylists.map(playlist => (
              <div
                key={playlist.id}
                className={`playlist-card ${currentPlaylist?.id === playlist.id ? 'active' : ''}`}
                onClick={() => setCurrentPlaylist(playlist)}
              >
                <div className="playlist-info">
                  <h5>{playlist.name}</h5>
                  <p>{playlist.videos.length} videos</p>
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
                    title="Delete playlist"
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
            <h5>Current Playlist: {currentPlaylist.name}</h5>
            <div className="playlist-videos">
              {currentPlaylist.videos.length === 0 ? (
                <p>No videos in this playlist yet.</p>
              ) : (
                <div className="playlist-videos-grid">
                  {currentPlaylist.videos.map(video => (
                    <div key={video.id} className="playlist-video-item">
                      <img src={video.thumbnail} alt={video.title} />
                      <div className="video-info">
                        <h6>{video.title}</h6>
                        <span>{video.duration}</span>
                      </div>
                      <button
                        className="remove-video-btn"
                        onClick={() => removeFromPlaylist(video.id, currentPlaylist.id)}
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
      <div className="playlist-modal-overlay" onClick={() => setShowPlaylistModal(false)}>
        <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>Create New Playlist</h4>
            <button
              className="close-modal-btn"
              onClick={() => setShowPlaylistModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <div className="input-group">
              <label>Playlist Name:</label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                maxLength={50}
              />
            </div>
            
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowPlaylistModal(false)}
              >
                Cancel
              </button>
              <button
                className="create-btn"
                onClick={() => {
                  if (playlistName.trim()) {
                    createPlaylist(playlistName.trim());
                  } else {
                    toast.error("Please enter a playlist name");
                  }
                }}
                disabled={!playlistName.trim()}
              >
                Create Playlist
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
    popularSearches.forEach(term => {
      if (term.includes(lowerQuery) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });
    
    // Add recent searches that match the query
    recentSearches.forEach(term => {
      if (term.toLowerCase().includes(lowerQuery) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });
    
    // Add query-based suggestions
    if (lowerQuery.includes('anal')) {
      suggestions.push('anal creampie', 'anal toys', 'anal training');
    } else if (lowerQuery.includes('oral')) {
      suggestions.push('blowjob', 'deepthroat', 'facial');
    } else if (lowerQuery.includes('lesbian')) {
      suggestions.push('lesbian toys', 'lesbian massage', 'lesbian orgasm');
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

  // Advanced search filters component
  const renderAdvancedFilters = () => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    return (
      <div className="advanced-filters-section">
        <button
          className="advanced-filters-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Advanced Filters</span>
          <span className={`toggle-icon ${showAdvanced ? 'expanded' : ''}`}>▼</span>
        </button>
        
        {showAdvanced && (
          <div className="advanced-filters-panel">
            <div className="filter-group">
              <label>Sort Order:</label>
              <select
                value={advancedSearch.order}
                onChange={(e) => {
                  setAdvancedSearch(prev => ({ ...prev, order: e.target.value }));
                  if (searchQuery.trim()) {
                    debouncedSearch(searchQuery, { ...advancedSearch, order: e.target.value });
                  }
                }}
              >
                <option value="top-weekly">Top Weekly</option>
                <option value="top-monthly">Top Monthly</option>
                <option value="top-yearly">Top Yearly</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Duration:</label>
              <select
                value={advancedSearch.duration}
                onChange={(e) => {
                  setAdvancedSearch(prev => ({ ...prev, duration: e.target.value }));
                }}
              >
                <option value="">Any Duration</option>
                <option value="short">Short (&lt;10 min)</option>
                <option value="medium">Medium (10-30 min)</option>
                <option value="long">Long (&gt;30 min)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Quality:</label>
              <select
                value={advancedSearch.quality}
                onChange={(e) => {
                  setAdvancedSearch(prev => ({ ...prev, quality: e.target.value }));
                }}
              >
                <option value="">Any Quality</option>
                <option value="hd">HD</option>
                <option value="sd">SD</option>
                <option value="4k">4K</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Language:</label>
              <select
                value={advancedSearch.language}
                onChange={(e) => {
                  setAdvancedSearch(prev => ({ ...prev, language: e.target.value }));
                }}
              >
                <option value="">Any Language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button
                className="apply-filters-btn"
                onClick={() => {
                  if (searchQuery.trim()) {
                    debouncedSearch(searchQuery, advancedSearch);
                  }
                }}
              >
                Apply Filters
              </button>
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setAdvancedSearch({
                    order: 'top-weekly',
                    duration: '',
                    quality: '',
                    dateRange: '',
                    language: '',
                    tags: [],
                    excludeTags: []
                  });
                  if (searchQuery.trim()) {
                    debouncedSearch(searchQuery, {});
                  }
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Search analytics dashboard component
  const renderSearchAnalytics = () => {
    if (searchAnalytics.totalSearches === 0) return null;
    
    const topSearches = Array.from(searchAnalytics.popularTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return (
      <div className="search-analytics-dashboard">
        <div className="analytics-header">
          <h4>Search Analytics</h4>
          <span className="analytics-subtitle">Your search insights</span>
        </div>
        
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">🔍</div>
            <div className="analytics-content">
              <div className="analytics-value">{searchAnalytics.totalSearches}</div>
              <div className="analytics-label">Total Searches</div>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon">📊</div>
            <div className="analytics-content">
              <div className="analytics-value">{searchAnalytics.averageResults}</div>
              <div className="analytics-label">Avg Results</div>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon">⚡</div>
            <div className="analytics-content">
              <div className="analytics-value">{searchCache.size}</div>
              <div className="analytics-label">Cached Results</div>
            </div>
          </div>
        </div>
        
        {topSearches.length > 0 && (
          <div className="top-searches">
            <h5>Top Searches</h5>
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
                  <span className="search-count">{count} searches</span>
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
        type: 'recent',
        title: 'Recent Searches',
        items: recentSearches.map(term => ({
          text: term,
          icon: '🕒',
          action: () => {
            setSearchQuery(term);
            debouncedSearch(term);
          }
        }))
      });
    }
    
    // Based on popular terms
    if (searchAnalytics.popularTerms.size > 0) {
      const popularTerms = Array.from(searchAnalytics.popularTerms.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([term]) => term);
      
      recommendations.push({
        type: 'popular',
        title: 'Popular Searches',
        items: popularTerms.map(term => ({
          text: term,
          icon: '🔥',
          action: () => {
            setSearchQuery(term);
            debouncedSearch(term);
          }
        }))
      });
    }
    
    // Based on time of day
    const hour = new Date().getHours();
    let timeBasedSuggestions = [];
    
    if (hour >= 22 || hour <= 6) {
      timeBasedSuggestions = ['night', 'bedroom', 'late night'];
    } else if (hour >= 7 && hour <= 12) {
      timeBasedSuggestions = ['morning', 'breakfast', 'wake up'];
    } else if (hour >= 13 && hour <= 17) {
      timeBasedSuggestions = ['afternoon', 'lunch', 'work'];
    } else {
      timeBasedSuggestions = ['evening', 'dinner', 'relax'];
    }
    
    recommendations.push({
      type: 'time',
      title: 'Time-Based Suggestions',
      items: timeBasedSuggestions.map(term => ({
        text: term,
        icon: '⏰',
        action: () => {
          setSearchQuery(term);
          debouncedSearch(term);
        }
      }))
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
          <h4>Smart Recommendations</h4>
          <span className="recommendations-subtitle">Personalized for you</span>
        </div>
        
        <div className="recommendations-grid">
          {recommendations.map((section, index) => (
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
  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
    } else {
      toast.error("Please enter a playlist name");
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
    const clean = (arr) => Array.isArray(arr) ? arr.filter(
      (item) => item && typeof item === 'object' && item.id
    ) : [];
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

  return (
    <PinLock sectionName="Adult Search" isVideoPlaying={!!selectedVideo}>
      <div
        className="adult-search-container"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
          placeholder="Search adult videos..."
        />
        
        {/* Search Statistics */}
        {searchStats.totalResults > 0 && (
          <div className="search-stats">
            <span className="stats-text">
              Found {searchStats.totalResults} videos in {searchStats.searchTime}ms
            </span>
          </div>
        )}
        
        {/* Trending Searches */}
        {!searchQuery.trim() && !loading && (
          <div className="trending-searches">
            <h4>Trending Searches</h4>
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
            className={tab === "all" ? "active" : ""}
            onClick={() => setTab("all")}
          >
            All
          </button>
          <button
            className={tab === "favorites" ? "active" : ""}
            onClick={() => setTab("favorites")}
          >
            Favorites
          </button>
          <button
            className={tab === "watchlist" ? "active" : ""}
            onClick={() => setTab("watchlist")}
          >
            Watchlist
          </button>
          <button
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            Recently Watched
          </button>
          <button
            className={tab === "playlists" ? "active" : ""}
            onClick={() => setTab("playlists")}
          >
            Playlists
          </button>
          <button
            className={tab === "downloads" ? "active" : ""}
            onClick={() => setTab("downloads")}
          >
            Download Queue
          </button>
        </div>
        {tab === "all" && allCategories.length > 1 && (
          <div className="category-filter-bar">
            <div className="category-filter-header">
              <h4>Filter by Category</h4>
              <span className="category-count">({allCategories.length} categories)</span>
            </div>
            <div className="category-buttons">
            <button
                className={`category-btn ${!categoryFilter ? "active" : ""}`}
              onClick={() => setCategoryFilter("")}
                title="Show all categories"
            >
                <span className="category-icon">🎬</span>
                <span className="category-text">All</span>
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${categoryFilter === cat ? "active" : ""}`}
                onClick={() => setCategoryFilter(cat)}
                title={`Filter by ${cat}`}
              >
                <span className="category-icon">
                  {cat === 'amateur' ? '📱' : 
                   cat === 'anal' ? '🍑' : 
                   cat === 'blowjob' ? '💋' : 
                   cat === 'creampie' ? '💦' : 
                   cat === 'cumshot' ? '💧' : 
                   cat === 'deepthroat' ? '👅' : 
                   cat === 'facial' ? '🎭' : 
                   cat === 'gangbang' ? '👥' : 
                   cat === 'hardcore' ? '🔥' : 
                   cat === 'lesbian' ? '👭' : 
                   cat === 'massage' ? '💆' : 
                   cat === 'masturbation' ? '✋' : 
                   cat === 'oral' ? '👄' : 
                   cat === 'pov' ? '📹' : 
                   cat === 'rough' ? '⚡' : 
                   cat === 'threesome' ? '👨‍👩‍👧' : 
                   cat === 'toys' ? '🔌' : 
                   cat === 'vintage' ? '📼' : 
                   cat === 'young' ? '🌸' : '🎯'}
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
                <span>Filtering by: <strong>{categoryFilter}</strong></span>
                <button
                  className="clear-category-btn"
                  onClick={() => setCategoryFilter("")}
                  title="Clear category filter"
                >
                  ✕ Clear
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
            <h3>Recommended for You</h3>
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
          <div className="fade-slide">
            <div className="playlists-panel">
              <div className="playlist-controls">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="New playlist name"
                />
                <button onClick={handleCreatePlaylist}>Create</button>
              </div>
              <div className="playlist-list">
                {Object.keys(playlists).map((name) => (
                  <div
                    key={name}
                    className={`playlist-item${
                      currentPlaylist === name ? " active" : ""
                    }`}
                  >
                    <span onClick={() => setCurrentPlaylist(playlists[name])}>{name}</span>
                    <button
                      onClick={() => handleDeletePlaylist(name)}
                      aria-label="Delete playlist"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => {
                        const newName = prompt("Rename playlist:", name);
                        if (newName && newName !== name)
                          handleRenamePlaylist(name, newName);
                      }}
                      aria-label="Rename playlist"
                    >
                      ✏️
                    </button>
                  </div>
                ))}
              </div>
              {currentPlaylist && (
                <div className="playlist-videos">
                  <h4>{currentPlaylist.name}</h4>
                  <ResultsGrid
                    searchResults={currentPlaylist.videos}
                    onVideoSelect={handleVideoSelect}
                    favorites={favorites.map((f) => f.id)}
                    onToggleFavorite={handleToggleFavorite}
                    watchlist={watchlist.map((w) => w.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                    onAddToPlaylist={(video) =>
                      handleAddToPlaylist(video, currentPlaylist.id)
                    }
                    onRemoveFromPlaylist={(video) =>
                      handleRemoveFromPlaylist(video.id, currentPlaylist.id)
                    }
                    playlistMode={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "downloads" && (
          <div className="fade-slide">
            <div className="download-queue-panel">
              <h4>Download Queue</h4>
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
          />
        )}
        {isFetchingMore && (
          <div style={{ textAlign: "center", color: "#ff3333", margin: "20px" }}>
            Loading more...
          </div>
        )}
        {renderSearchAnalytics()}
        {renderSmartRecommendations()}
        {renderPlaylistManager()}
        {renderPlaylistModal()}
      </div>
    </PinLock>
  );
};

export default AdultSearchBar;
