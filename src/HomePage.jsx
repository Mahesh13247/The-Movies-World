import React from "react";
import AppHeader from "./components/AppHeader";
import TrendingCarousel from "./components/TrendingCarousel";
import HistorySection from "./components/HistorySection";
import MoviesGrid from "./components/MoviesGrid";
import MoviePlayerSection from "./components/MoviePlayerSection";

export default function HomePage(props) {
  return (
    <>
      <AppHeader
        profile={props.profile}
        setProfile={props.setProfile}
        editProfile={props.editProfile}
        setEditProfile={props.setEditProfile}
        profileName={props.profileName}
        setProfileName={props.setProfileName}
        showProfile={props.showProfile}
        setShowProfile={props.setShowProfile}
        showCalendar={props.showCalendar}
        setShowCalendar={props.setShowCalendar}
        upcoming={props.upcoming}
        t={props.t}
        i18n={props.i18n}
        genres={props.genres}
        selectedGenre={props.selectedGenre}
        setSelectedGenre={props.setSelectedGenre}
        searchInput={props.searchInput}
        setSearchInput={props.setSearchInput}
        searchInputRef={props.searchInputRef}
        suggestions={props.suggestions}
        setSuggestions={props.setSuggestions}
        showSuggestions={props.showSuggestions}
        setShowSuggestions={props.setShowSuggestions}
        searchMovie={props.searchMovie}
        handleKeyPress={props.handleKeyPress}
        theme={props.theme}
        toggleTheme={props.toggleTheme}
        fetchRandomMovie={props.fetchRandomMovie}
      />
      <main className="fade-slide">
        <TrendingCarousel trending={props.trending} watchMovie={props.watchMovie} t={props.t} loading={props.loading} />
        <MoviesGrid
          loading={props.loading}
          movies={props.movies}
          userRatings={props.userRatings}
          rateMovie={props.rateMovie}
          watchMovie={props.watchMovie}
          toggleFavorite={props.toggleFavorite}
          isFavorite={props.isFavorite}
          handleShare={props.handleShare}
          t={props.t}
          watchlist={props.watchlist}
          toggleWatchlist={props.toggleWatchlist}
          isInWatchlist={props.isInWatchlist}
        />
        <HistorySection t={props.t} watchMovie={props.watchMovie} />
        <MoviePlayerSection
          selectedMovie={props.selectedMovie}
          lastWatched={props.lastWatched}
          streamingSources={props.streamingSources}
          switchSource={props.switchSource}
          trailerUrl={props.trailerUrl}
          t={props.t}
          currentMovieId={props.currentMovieId}
          currentReviews={props.currentReviews}
          reviewInput={props.reviewInput}
          setReviewInput={props.setReviewInput}
          reviewMovieId={props.reviewMovieId}
          setReviewMovieId={props.setReviewMovieId}
          handleReviewSubmit={props.handleReviewSubmit}
        />
      </main>
      <div className="fottercontainer">
        <footer className="footer">
          <p>
            {props.t("designed_by")} <span className="author-name">K Mahesh Kumar Achary</span>
          </p>
        </footer>
      </div>
    </>
  );
} 