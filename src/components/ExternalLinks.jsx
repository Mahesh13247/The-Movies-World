import React, { useState, useMemo, useEffect } from 'react';

// Move EXTERNAL_SOURCES outside the component
const EXTERNAL_SOURCES = [
  {
    category: 'movies',
    name: 'Movies & TV Shows',
    links: [
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
      "https://uhdmovies.wales",
      "https://watchomovies.support",
      "https://www1.movierulz.ac",
      "https://www1.movierulz.be",
      "https://www1.movierulz.cc",
      "https://www1.movierulz.com",
      "https://www1.movierulz.in",
      "https://www1.movierulz.me",
      "https://www1.movierulz.ms",
      "https://www1.movierulz.net",
      "https://www1.movierulz.org",
      "https://www1.movierulz.to",
      "https://www1.movierulz.tv",
      "https://www1.movierulz.ws",
      "https://www1.movierulz.xyz",
      "https://www1.movierulz2.com",
      "https://www1.movierulz2.in",
      "https://www1.movierulz2.me",
      "https://www1.movierulz2.net",
      "https://www1.movierulz2.org",
      "https://www1.movierulz2.to",
      "https://www1.movierulz2.tv",
      "https://www1.movierulz2.ws",
      "https://www1.movierulz2.xyz"
    ]
  },
  {
    category: 'anime',
    name: 'Anime & Cartoons',
    links: [
      "https://animeflix.ltd",
      "https://animehub.ac/animehub.to",
      "https://hanimehub.site",
      "https://hanime.tv",
      "https://www.cartoonporn.com",
      "https://hentaihaven.xxx",
      "https://hentaihaven.red",
      "https://hentaihaven.to",
      "https://hentaihaven.blue",
      "https://hentaihaven.pink",
      "https://hentaihaven.purple",
      "https://hentaihaven.green",
      "https://hentaihaven.yellow",
      "https://hentaihaven.orange",
      "https://hentaihaven.brown",
      "https://hentaihaven.black",
      "https://hentaihaven.white",
      "https://hentaihaven.gray",
      "https://hentaihaven.silver",
      "https://hentaihaven.gold",
      "https://hentaihaven.platinum",
      "https://hentaihaven.diamond",
      "https://hentaihaven.ruby",
      "https://hentaihaven.sapphire",
      "https://hentaihaven.emerald",
      "https://hentaihaven.amethyst",
      "https://hentaihaven.topaz",
      "https://hentaihaven.opal",
      "https://hentaihaven.pearl",
      "https://hentaihaven.jade"
    ]
  },
  {
    category: 'jav',
    name: 'JAV Sites',
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
      "https://javhd.international"
    ]
  },
  {
    category: 'other',
    name: 'Other Sources',
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
      "https://www.hellpussy.com",
      "https://www.hellteens.com",
      "https://www.hellvideos.com",
      "https://www.hellxxx.com",
      "https://www.hellz.com",
      "https://www.hellz.net",
      "https://www.hellz.org",
      "https://www.hellz.to",
      "https://www.hellz.tv",
      "https://www.hellz.xyz"
    ]
  },
  {
    category: 'live',
    name: 'Live Streaming',
    links: [
      "https://www.chaturbate.com",
      "https://www.myfreecams.com",
      "https://www.bongacams.com",
      "https://www.streamate.com",
      "https://www.cam4.com",
      "https://www.livejasmin.com",
      "https://www.imlive.com",
      "https://www.adultfriendfinder.com",
      "https://www.fling.com",
      "https://www.ashleymadison.com",
      "https://www.seeking.com",
      "https://www.sugardaddie.com",
      "https://www.sugardaddy.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com"
    ]
  },
  {
    category: 'dating',
    name: 'Dating Sites',
    links: [
      "https://www.adultfriendfinder.com",
      "https://www.fling.com",
      "https://www.ashleymadison.com",
      "https://www.seeking.com",
      "https://www.sugardaddie.com",
      "https://www.sugardaddy.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com",
      "https://www.sugardaddymeet.com"
    ]
  },
  {
    category: 'forums',
    name: 'Adult Forums & Communities',
    links: [
      "https://www.reddit.com/r/nsfw",
      "https://www.reddit.com/r/nsfw_gif",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_videos",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs",
      "https://www.reddit.com/r/nsfw_gifs"
    ]
  },
  {
    category: 'games',
    name: 'Adult Games',
    links: [
      "https://www.nutaku.net",
      "https://www.hentaiheroes.com",
      "https://www.hentaihaven.xxx",
      "https://www.hentaihaven.red",
      "https://www.hentaihaven.to",
      "https://www.hentaihaven.blue",
      "https://www.hentaihaven.pink",
      "https://www.hentaihaven.purple",
      "https://www.hentaihaven.green",
      "https://www.hentaihaven.yellow",
      "https://www.hentaihaven.orange",
      "https://www.hentaihaven.brown",
      "https://www.hentaihaven.black",
      "https://www.hentaihaven.white",
      "https://www.hentaihaven.gray"
    ]
  }
];

const ExternalLinks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [searchHistory, setSearchHistory] = useState(() =>
    JSON.parse(localStorage.getItem('adultSearchHistory') || '[]')
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // all, active, new
    rating: 'all', // all, high, medium, low
    type: 'all', // all, streaming, download, forum
    language: 'all' // all, english, japanese, etc.
  });
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches on mount
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('adultRecentSearches') || '[]');
    setRecentSearches(recent);
  }, []);

  // Update search history
  const updateSearchHistory = (term) => {
    if (!term.trim()) return;
    const newHistory = [term, ...searchHistory.filter(t => t !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('adultSearchHistory', JSON.stringify(newHistory));
  };

  // Update recent searches
  const updateRecentSearches = (term) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('adultRecentSearches', JSON.stringify(newRecent));
  };

  // Generate search suggestions
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = EXTERNAL_SOURCES.flatMap(category =>
      category.links
        .map(link => {
          const domain = link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
          return {
            domain,
            category: category.name,
            url: link
          };
        })
        .filter(item =>
          item.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ).slice(0, 5);

    setSearchSuggestions(suggestions);
  }, [searchTerm, EXTERNAL_SOURCES]);

  const filteredLinks = useMemo(() => {
    return EXTERNAL_SOURCES.map(category => ({
      ...category,
      links: category.links.filter(link => {
        const matchesSearch = link.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || category.category === selectedCategory;

        // Apply additional filters
        const domain = link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        const matchesStatus = filters.status === 'all' ||
          (filters.status === 'active' && !link.includes('inactive')) ||
          (filters.status === 'new' && link.includes('new'));

        const matchesType = filters.type === 'all' ||
          (filters.type === 'streaming' && (link.includes('stream') || link.includes('watch'))) ||
          (filters.type === 'download' && (link.includes('download') || link.includes('torrent'))) ||
          (filters.type === 'forum' && (link.includes('forum') || link.includes('community')));

        return matchesSearch && matchesCategory && matchesStatus && matchesType;
      })
    })).filter(category => category.links.length > 0);
  }, [searchTerm, selectedCategory, filters, EXTERNAL_SOURCES]);

  const sortedLinks = useMemo(() => {
    return filteredLinks.map(category => ({
      ...category,
      links: [...category.links].sort((a, b) => {
        const domainA = a.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        const domainB = b.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        return sortBy === 'name' ? domainA.localeCompare(domainB) : 0;
      })
    }));
  }, [filteredLinks, sortBy]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    updateSearchHistory(term);
    updateRecentSearches(term);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('adultSearchHistory');
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
              onChange={(e) => handleSearch(e.target.value)}
              className="external-links-search"
              onFocus={() => setShowFilters(true)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => handleSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSearch(suggestion.domain)}
                >
                  <span className="suggestion-domain">{suggestion.domain}</span>
                  <span className="suggestion-category">{suggestion.category}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!searchTerm && recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="recent-searches-header">
                <span>Recent Searches</span>
                <button onClick={clearSearchHistory}>Clear History</button>
              </div>
              {recentSearches.map((term, index) => (
                <div
                  key={index}
                  className="recent-search-item"
                  onClick={() => handleSearch(term)}
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
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
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
            {EXTERNAL_SOURCES.map(category => (
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
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
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
            Found {sortedLinks.reduce((acc, cat) => acc + cat.links.length, 0)} results for "{searchTerm}"
          </div>
        )}
      </div>

      {sortedLinks.map(category => (
        <div key={category.category} className="external-links-category-section">
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
                    {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
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

      <style>
        {`
          .external-links-section {
            padding: 20px;
            background: rgba(0, 0, 0, 0.95);
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 2px solid #ff0000;
          }

          .search-container {
            position: relative;
            margin-bottom: 20px;
          }

          .search-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .external-links-search {
            width: 100%;
            padding: 12px 40px 12px 16px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s;
          }

          .external-links-search:focus {
            border-color: #ff3333;
            box-shadow: 0 0 0 3px rgba(255, 51, 51, 0.1);
          }

          .clear-search {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 4px;
            font-size: 16px;
          }

          .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: black;
            color: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-top: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }

          .suggestion-item {
            padding: 10px 16px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .suggestion-item:hover {
            background: #f5f5f5;
          }

          .suggestion-domain {
            font-weight: 500;
          }

          .suggestion-category {
            font-size: 12px;
            color: #666;
          }

          .recent-searches {
            display: flex;
            flex-direction: column;
            background: black;
            color: #ffffff;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-top: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }

          .recent-searches-header {
            padding: 10px 16px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .recent-searches-header button {
            background: none;
            border: none;
            color: #ff3333;
            cursor: pointer;
            font-size: 12px;
          }

          .recent-search-item {
            padding: 10px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .recent-search-item:hover {
            background: rgb(255, 0, 0);
          }

          .search-icon {
            color: #666;
          }

          .advanced-filters {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin: 16px 0;
            padding: 16px;
            background: rgb(255, 255, 255);
            border-radius: 50px;
            justify-content: space-evenly;
            width: auto;
          }

          .filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .filter-group label {
            font-size: 14px;
            color: #666;
          }

          .filter-group select {
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
          }

          .search-results-info {
            margin: 16px 0;
            color: #666;
          }

          .results-count {
            font-size: 14px;
          }

          .no-results {
            text-align: center;
            padding: 40px 20px;
            color: #666;
          }

          .no-results-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .no-results-suggestions {
            margin-top: 16px;
            text-align: left;
            max-width: 300px;
            margin: 16px auto 0;
          }

          .no-results-suggestions ul {
            list-style: none;
            padding: 0;
            margin: 8px 0 0;
          }

          .no-results-suggestions li {
            margin: 4px 0;
            color: #888;
          }

          .external-links-controls {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }

          .external-links-search,
          .external-links-category,
          .external-links-sort {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
          }

          .view-mode-buttons {
            display: flex;
            gap: 8px;
          }

          .view-mode-buttons button {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: white;
            cursor: pointer;
          }

          .view-mode-buttons button.active {
            background: #ff3333;
            color: white;
            border-color: #ff3333;
          }

          .external-links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
          }

          .external-links-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .external-link-card {
            text-decoration: none;
            color: inherit;
            background: white;
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 12px;
            transition: all 0.2s;
          }

          .external-link-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .link-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .link-domain {
            font-weight: 500;
            color: #333;
          }

          .link-category {
            font-size: 12px;
            color: #666;
          }

          .category-title {
            color: #ff3333;
            margin: 20px 0 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #ff3333;
          }
        `}
      </style>
    </div>
  );
};

export default ExternalLinks; 