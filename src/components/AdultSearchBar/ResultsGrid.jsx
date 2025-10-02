import React, { useState, useEffect } from "react";
import "./ResultsGrid.css";
import PropTypes from "prop-types";
import {
  FaStar,
  FaHeart,
  FaRegHeart,
  FaClock,
  FaEye,
  FaPlay,
  FaBookmark,
  FaRegBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ResultsGrid = ({
  searchResults = [],
  onVideoSelect,
  favorites = [],
  onToggleFavorite,
  watchlist = [],
  onToggleWatchlist,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults, itemsPerPage]);

  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = searchResults.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }
      pageNumbers.push(totalPages);
    }

    return (
      <div className="pagination-section">
        <button
          className="pagination-btn nav-btn"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <FaAngleDoubleLeft />
        </button>
        <button
          className="pagination-btn nav-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <FaChevronLeft />
        </button>
        {pageNumbers.map((number, index) =>
          number === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={number}
              className={`pagination-btn ${
                currentPage === number ? "active" : ""
              }`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </button>
          )
        )}
        <button
          className="pagination-btn nav-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <FaChevronRight />
        </button>
        <button
          className="pagination-btn nav-btn"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    );
  };

  return (
    <div className="search-results-container">
      <div className="search-results">
        {currentResults.map((result) => (
          <div
            key={result.id}
            className="result-card"
            onClick={() => onVideoSelect(result)}
          >
            <div className="video-preview-container">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="result-thumbnail"
                loading="lazy"
              />
              <div className="play-overlay">
                <FaPlay />
              </div>
              <div className="video-duration">
                <FaClock /> {result.duration || "00:00"}
              </div>
              <div className="action-buttons">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(result);
                    toast.info(
                      watchlist.includes(result.id)
                        ? "Removed from watchlist"
                        : "Added to watchlist"
                    );
                  }}
                  title="Add to Watchlist"
                >
                  {watchlist.includes(result.id) ? (
                    <FaBookmark />
                  ) : (
                    <FaRegBookmark />
                  )}
                </button>
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(result);
                    toast.info(
                      favorites.includes(result.id)
                        ? "Removed from favorites"
                        : "Added to favorites"
                    );
                  }}
                  title="Add to Favorites"
                >
                  {favorites.includes(result.id) ? (
                    <FaHeart className="favorited" />
                  ) : (
                    <FaRegHeart />
                  )}
                </button>
              </div>
            </div>
            <div className="result-info">
              <h3 className="result-title">{result.title}</h3>
              <div className="result-meta">
                <span className="meta-item">
                  <FaEye /> {result.views || 0}
                </span>
                <span className="meta-item">
                  <FaStar /> {result.rating || 0}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {searchResults.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {startIndex + 1} -{" "}
            {Math.min(startIndex + itemsPerPage, searchResults.length)} of{" "}
            {searchResults.length} results
          </div>
          {renderPagination()}
          <div className="items-per-page-selector">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="items-per-page-select"
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
              <option value={96}>96 per page</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

ResultsGrid.propTypes = {
  searchResults: PropTypes.array.isRequired,
  onVideoSelect: PropTypes.func.isRequired,
  favorites: PropTypes.array,
  onToggleFavorite: PropTypes.func,
  watchlist: PropTypes.array,
  onToggleWatchlist: PropTypes.func,
};

export default ResultsGrid;
