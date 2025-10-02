import React from "react";

const MoviePlayerSection = ({
  selectedMovie,
  lastWatched,
  streamingSources,
  switchSource,
  trailerUrl,
  t,
  currentMovieId,
  currentReviews,
  reviewInput,
  setReviewInput,
  reviewMovieId,
  setReviewMovieId,
  handleReviewSubmit
}) => {
  if (!selectedMovie && !lastWatched) return null;
  const movieTitle = selectedMovie?.movieTitle || lastWatched?.movieTitle;
  return (
    <div className="player-container">
      <h2>
        Streaming: {movieTitle}
      </h2>
      <iframe
        id="videoPlayer"
        src={streamingSources[0].url}
        width="800"
        height="450"
        allowFullScreen
        onError={() =>
          switchSource(selectedMovie?.movieID || lastWatched?.movieID)
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
            value={reviewMovieId === currentMovieId ? reviewInput : ""}
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
          href={`https://prmovies.land/?s=${encodeURIComponent(movieTitle)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="alt-link"
        >
          PRMovies
        </a>
        <a
          href={`https://yomovies.horse/?s=${encodeURIComponent(movieTitle)}`}
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
  );
};

export default React.memo(MoviePlayerSection); 