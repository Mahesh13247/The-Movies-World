import React from "react";
import { FaStar, FaHeart, FaRegHeart, FaFacebook, FaTwitter, FaWhatsapp, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { toast } from "react-toastify";

const MoviesGrid = ({
  loading,
  movies,
  userRatings,
  rateMovie,
  watchMovie,
  toggleFavorite,
  isFavorite,
  handleShare,
  t,
  watchlist = [],
  toggleWatchlist = () => {},
  isInWatchlist = () => false,
}) => {
  // Handler for favorite button with toast
  const handleFavoriteClick = (movie) => {
    if (isFavorite(movie)) {
      toast.info(t("Removed from favorites"));
    } else {
      toast.success(t("Added to favorites"));
    }
    toggleFavorite(movie);
  };

  // Handler for watchlist button with toast
  const handleWatchlistClick = (movie) => {
    if (isInWatchlist(movie)) {
      toast.info(t("Removed from watchlist"));
    } else {
      toast.success(t("Added to watchlist"));
    }
    toggleWatchlist(movie);
  };

  return (
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
                    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                    : "https://via.placeholder.com/200x300?text=No+Image"
                }
                alt={movie.title}
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                width="185"
                height="278"
              />
              <div className="info-overlay small">
                <div className="overlay-title">{movie.title}</div>
                <div className="overlay-meta">
                  {movie.release_date?.slice(0, 4)} &bull; {t("rating")}: {movie.vote_average || "N/A"}
                </div>
                <div className="rating-stars" style={{ marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      color={userRatings[movie.id] >= star ? "#fc0" : "#ccc"}
                      style={{ cursor: "pointer" }}
                      onClick={() => rateMovie(movie.id, star)}
                    />
                  ))}
                </div>
                <div className="overlay-actions">
                  <button onClick={() => watchMovie(movie.id, movie.title, movie.release_date, movie.poster_path)} aria-label={t("watch_now")}>{t("watch_now")}</button>
                  <button className="heart-btn" onClick={() => handleFavoriteClick(movie)} aria-label={isFavorite(movie) ? t("remove_favorite") : t("add_favorite")}>{isFavorite(movie) ? <FaHeart color="red" /> : <FaRegHeart />}</button>
                  <button className="watchlist-btn" onClick={() => handleWatchlistClick(movie)} aria-label={isInWatchlist(movie) ? t("remove_watchlist") : t("add_watchlist")}>{isInWatchlist(movie) ? <FaBookmark color="#ffcc00" /> : <FaRegBookmark />}</button>
                  <button className="share-btn" title="Share on Facebook" onClick={() => handleShare("facebook")}> <FaFacebook /> </button>
                  <button className="share-btn" title="Share on Twitter" onClick={() => handleShare("twitter")}> <FaTwitter /> </button>
                  <button className="share-btn" title="Share on WhatsApp" onClick={() => handleShare("whatsapp")}> <FaWhatsapp /> </button>
                </div>
              </div>
            </div>
          ))}
    </div>
  );
};

export default React.memo(MoviesGrid); 