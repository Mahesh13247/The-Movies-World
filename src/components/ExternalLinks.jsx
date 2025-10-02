import React, { useState, useMemo, useEffect } from "react";
import "./ExternalLinks.css";

// Move EXTERNAL_SOURCES outside the component
const EXTERNAL_SOURCES = [
  {
    category: "movies",
    name: "Movies & TV Shows",
    links: [
      "https://fullmovieshow.com",
      "https://isputlockers.com",
      "https://teh-movie.com",
      "https://solarmovieru.com",
      "https://movie4kto.life",
      "https://123moviesgo.bar",
      "https://freeforyou.site/watchserieshd",
      "https://tih-movie.com",
      "https://www.streamlord.com/index.html",
      "https://www.couchtuner.show",
      "https://en.bmovies-official.live/movies",
      "https://en.watchfree-official.live/movies",
      "https://prmovies.repair",
      "https://pikahd.com",
      "https://moviesbaba.cam",
      "https://moviesmod.surf",
      "https://uhdmovies.wales",
      "https://watchomovies.support",
      "https://www.5movierulz.sarl/",
    ],
  },
  {
    category: "anime",
    name: "Anime & Cartoons",
    links: [
      "https://hentaigasm.tv",
      "https://hentaigasm.com",
      "https://animeflix.ltd",
      "https://animehub.ac/animehub.to",
      "https://hanimehub.site",
      "https://hanime.tv",
      "https://www.cartoonporn.com",
      "https://hentaihaven.xxx",
    ],
  },
  {
    category: "jav",
    name: "JAV Sites",
    links: [
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
      "https://www4.javdock.com",
      "https://javheo.com",
      "https://javeng.com",
      "https://javgg.net",
      "https://supjav.com",
      "https://javhd.pro",
      "https://javhd.tube",
      "https://javhd.me",
      "https://javhd.to",
      "https://javhd.cc",
      "https://javhd.tv",
      "https://javhd.xyz",
      "https://javhd.net",
      "https://javhd.org",
      "https://javhd.com",
      "https://javhd.io",
      "https://javhd.co",
      "https://javhd.biz",
      "https://javhd.info",
      "https://javhd.mobi",
      "https://javhd.live",
      "https://javhd.stream",
      "https://javhd.download",
      "https://javhd.watch",
      "https://javhd.plus",
      "https://javhd.fun",
      "https://javhd.club",
      "https://javhd.team",
      "https://javhd.group",
      "https://javhd.zone",
      "https://javhd.space",
      "https://javhd.world",
      "https://javhd.global",
      "https://javhd.international",
    ],
  },
  {
    category: "other",
    name: "Other Sources",
    links: [
      "https://1337x.hashhackers.com",
      "https://movie4nx.site",
      "https://www.manyvids.com",
      "https://kemono.su",
      "https://clip18x.com",
      "https://www.eporner.com",
      "https://www.miruro.tv",
      "https://katmovie18.mov",
      "https://katmoviehd.rodeo",
      "https://hentaigasm.com",
      "https://mat6tube.com/recent",
      "https://www.qorno.com",
      "https://avple.tv",
      "https://hotleaks.tv",
      "https://en.pornohd.blue",
      "https://missav123.com/dm22/en",
      "https://chiggywiggy.com",
      "https://nxprime.in/home.html",
      "https://sextb.net/",
      "https://123av.com/en/dm5",
      "https://ppp.porn/pp1",
      "https://www.xvideos.com",
      "https://www.xnxx.com",
      "https://www.pornhub.com",
      "https://www.xhamster.com",
      "https://www.redtube.com",
      "https://www.youporn.com",
      "https://www.tube8.com",
      "https://www.youjizz.com",
      "https://www.beeg.com",
      "https://www.thumbzilla.com",
      "https://www.spankbang.com",
      "https://www.empflix.com",
      "https://www.tnaflix.com",
      "https://www.porntube.com",
      "https://www.porntrex.com",
      "https://www.4tube.com",
      "https://www.drtuber.com",
      "https://www.hellporno.com",
      "https://www.hellmoms.com",
    ],
  },
  {
    category: "forums",
    name: "Adult Forums & Communities",
    links: ["https://www.reddit.com"],
  },
  {
    category: "games",
    name: "Adult Games",
    links: [
      "https://www.nutaku.net",
      "https://www.hentaiheroes.com",
      "https://www.hentaihaven.xxx",
    ],
  },
];

const ExternalLinks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [searchHistory, setSearchHistory] = useState(() =>
    JSON.parse(localStorage.getItem("adultSearchHistory") || "[]")
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState({
    status: "all", // all, active, new
    rating: "all", // all, high, medium, low
    type: "all", // all, streaming, download, forum
    language: "all", // all, english, japanese, etc.
  });
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches on mount
  useEffect(() => {
    const recent = JSON.parse(
      localStorage.getItem("adultRecentSearches") || "[]"
    );
    setRecentSearches(recent);
  }, []);

  // Update search history
  const updateSearchHistory = (term) => {
    if (!term.trim()) return;
    const newHistory = [term, ...searchHistory.filter((t) => t !== term)].slice(
      0,
      10
    );
    setSearchHistory(newHistory);
    localStorage.setItem("adultSearchHistory", JSON.stringify(newHistory));
  };

  // Update recent searches
  const updateRecentSearches = (term) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter((t) => t !== term)].slice(
      0,
      5
    );
    setRecentSearches(newRecent);
    localStorage.setItem("adultRecentSearches", JSON.stringify(newRecent));
  };

  // Generate search suggestions
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = EXTERNAL_SOURCES.flatMap((category) =>
      category.links
        .map((link) => {
          const domain = link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
          return {
            domain,
            category: category.name,
            url: link,
          };
        })
        .filter(
          (item) =>
            item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ).slice(0, 5);

    setSearchSuggestions(suggestions);
  }, [searchTerm, EXTERNAL_SOURCES]);

  const filteredLinks = useMemo(() => {
    return EXTERNAL_SOURCES.map((category) => ({
      ...category,
      links: category.links.filter((link) => {
        const matchesSearch = link
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || category.category === selectedCategory;

        // Apply additional filters
        const domain = link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
        const matchesStatus =
          filters.status === "all" ||
          (filters.status === "active" && !link.includes("inactive")) ||
          (filters.status === "new" && link.includes("new"));

        const matchesType =
          filters.type === "all" ||
          (filters.type === "streaming" &&
            (link.includes("stream") || link.includes("watch"))) ||
          (filters.type === "download" &&
            (link.includes("download") || link.includes("torrent"))) ||
          (filters.type === "forum" &&
            (link.includes("forum") || link.includes("community")));

        return matchesSearch && matchesCategory && matchesStatus && matchesType;
      }),
    })).filter((category) => category.links.length > 0);
  }, [searchTerm, selectedCategory, filters, EXTERNAL_SOURCES]);

  const sortedLinks = useMemo(() => {
    return filteredLinks.map((category) => ({
      ...category,
      links: [...category.links].sort((a, b) => {
        const domainA = a.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
        const domainB = b.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
        return sortBy === "name" ? domainA.localeCompare(domainB) : 0;
      }),
    }));
  }, [filteredLinks, sortBy]);

  const handleSearch = (term) => {
    if (!term) {
      setSearchTerm("");
      return;
    }
    setSearchTerm(term);
    updateSearchHistory(term);
    updateRecentSearches(term);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("adultSearchHistory");
  };

  return (
    <div className="external-links-section">
      <div className="external-links-header">
        <h3 style={{ color: "#ff3333", marginBottom: 20 }}>External Sources</h3>

        {/* Advanced Search Controls */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="external-links-search"
              onFocus={() => { setShowFilters(true); setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchTerm.trim()) {
                    handleSearch(searchTerm.trim());
                    setShowDropdown(false);
                  }
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSearchTerm(""); setShowDropdown(true); }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {showDropdown && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { handleSearch(suggestion.domain); setShowDropdown(false); }}
                >
                  <span className="suggestion-domain">{suggestion.domain}</span>
                  <span className="suggestion-category">
                    {suggestion.category}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {showDropdown && !searchTerm && recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="recent-searches-header">
                <span>Recent Searches</span>
                <button onClick={clearSearchHistory}>Clear History</button>
              </div>
              {recentSearches.map((term, index) => (
                <div
                  key={index}
                  className="recent-search-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { handleSearch(term); setShowDropdown(false); }}
                >
                  <span className="search-icon">🔍</span>
                  {term}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="new">New</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Type:</label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="streaming">Streaming</option>
                <option value="download">Download</option>
                <option value="forum">Forum</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Rating:</label>
              <select
                value={filters.rating}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, rating: e.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}

        <div className="external-links-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="external-links-category"
          >
            <option value="all">All Categories</option>
            {EXTERNAL_SOURCES.map((category) => (
              <option key={category.category} value={category.category}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="external-links-sort"
          >
            <option value="name">Sort by Name</option>
            <option value="recent">Sort by Recent</option>
          </select>

          <div className="view-mode-buttons">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              Grid View
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="search-results-info">
        {searchTerm && (
          <div className="results-count">
            Found {sortedLinks.reduce((acc, cat) => acc + cat.links.length, 0)}{" "}
            results for "{searchTerm}"
          </div>
        )}
      </div>

      {sortedLinks.map((category) => (
        <div
          key={category.category}
          className="external-links-category-section"
        >
          <h4 className="category-title">{category.name}</h4>
          <div className={`external-links-${viewMode}`}>
            {category.links.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link-card"
              >
                <div className="link-content">
                  <span className="link-domain">
                    {url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                  </span>
                  <span className="link-category">{category.name}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {filteredLinks.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <div className="no-results-text">
            No sources found matching your search criteria.
            {searchTerm && (
              <div className="no-results-suggestions">
                Try:
                <ul>
                  <li>Using different keywords</li>
                  <li>Checking your spelling</li>
                  <li>Removing filters</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalLinks;
