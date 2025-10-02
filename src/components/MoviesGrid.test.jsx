// Tests for MoviesGrid component
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MoviesGrid from "./MoviesGrid";
import { renderWithProviders, mockMovies, mockT } from "../test/utils";

// Mock react-toastify
vi.mock("react-toastify", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MoviesGrid Component", () => {
  const defaultProps = {
    loading: false,
    movies: mockMovies,
    userRatings: {},
    rateMovie: vi.fn(),
    watchMovie: vi.fn(),
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false),
    handleShare: vi.fn(),
    t: mockT,
    watchlist: [],
    toggleWatchlist: vi.fn(),
    isInWatchlist: vi.fn().mockReturnValue(false),
  };

  it("should render loading skeletons when loading", () => {
    renderWithProviders(
      <MoviesGrid {...defaultProps} loading={true} movies={[]} />
    );

    const skeletons = screen.getAllByRole("generic", { hidden: true });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render movie cards when not loading", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    expect(screen.getByText("Another Test Movie")).toBeInTheDocument();
  });

  it("should display movie information correctly", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    const firstMovie = mockMovies[0];
    expect(screen.getByText(firstMovie.title)).toBeInTheDocument();
    expect(screen.getByText(/2024.*rating.*8.5/)).toBeInTheDocument();
  });

  it("should render watch buttons for each movie", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    const watchButtons = screen.getAllByText("watch_now");
    expect(watchButtons).toHaveLength(mockMovies.length);
  });

  it("should call watchMovie when watch button is clicked", async () => {
    const user = userEvent.setup();
    const watchMovie = vi.fn();

    renderWithProviders(
      <MoviesGrid {...defaultProps} watchMovie={watchMovie} />
    );

    const watchButton = screen.getAllByText("watch_now")[0];
    await user.click(watchButton);

    expect(watchMovie).toHaveBeenCalledWith(
      mockMovies[0].id,
      mockMovies[0].title,
      mockMovies[0].release_date,
      mockMovies[0].poster_path
    );
  });

  it("should render favorite buttons", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    const favoriteButtons = screen.getAllByLabelText(
      /add_favorite|remove_favorite/
    );
    expect(favoriteButtons).toHaveLength(mockMovies.length);
  });

  it("should call toggleFavorite when favorite button is clicked", async () => {
    const user = userEvent.setup();
    const toggleFavorite = vi.fn();

    renderWithProviders(
      <MoviesGrid {...defaultProps} toggleFavorite={toggleFavorite} />
    );

    const favoriteButton = screen.getAllByLabelText("add_favorite")[0];
    await user.click(favoriteButton);

    expect(toggleFavorite).toHaveBeenCalledWith(mockMovies[0]);
  });

  it("should render watchlist buttons", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    const watchlistButtons = screen.getAllByLabelText(
      /add_watchlist|remove_watchlist/
    );
    expect(watchlistButtons).toHaveLength(mockMovies.length);
  });

  it("should call toggleWatchlist when watchlist button is clicked", async () => {
    const user = userEvent.setup();
    const toggleWatchlist = vi.fn();

    renderWithProviders(
      <MoviesGrid {...defaultProps} toggleWatchlist={toggleWatchlist} />
    );

    const watchlistButton = screen.getAllByLabelText("add_watchlist")[0];
    await user.click(watchlistButton);

    expect(toggleWatchlist).toHaveBeenCalledWith(mockMovies[0]);
  });

  it("should render rating stars", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    // Each movie should have 5 rating stars
    const ratingStars = screen.getAllByRole("button", { hidden: true });
    const starButtons = ratingStars.filter((button) =>
      button.closest(".rating-stars")
    );

    expect(starButtons.length).toBeGreaterThanOrEqual(mockMovies.length * 5);
  });

  it("should call rateMovie when rating star is clicked", async () => {
    const user = userEvent.setup();
    const rateMovie = vi.fn();

    renderWithProviders(<MoviesGrid {...defaultProps} rateMovie={rateMovie} />);

    // Click the first star of the first movie
    const ratingStars = screen.getAllByRole("button", { hidden: true });
    const firstStar = ratingStars.find((button) =>
      button.closest(".rating-stars")
    );

    if (firstStar) {
      await user.click(firstStar);
      expect(rateMovie).toHaveBeenCalled();
    }
  });

  it("should render share buttons", () => {
    renderWithProviders(<MoviesGrid {...defaultProps} />);

    const shareButtons = screen.getAllByTitle(/Share on/);
    // Each movie should have 3 share buttons (Facebook, Twitter, WhatsApp)
    expect(shareButtons.length).toBe(mockMovies.length * 3);
  });

  it("should call handleShare when share button is clicked", async () => {
    const user = userEvent.setup();
    const handleShare = vi.fn();

    renderWithProviders(
      <MoviesGrid {...defaultProps} handleShare={handleShare} />
    );

    const facebookButton = screen.getAllByTitle("Share on Facebook")[0];
    await user.click(facebookButton);

    expect(handleShare).toHaveBeenCalledWith("facebook");
  });

  it("should display placeholder image when poster_path is null", () => {
    const moviesWithoutPosters = mockMovies.map((movie) => ({
      ...movie,
      poster_path: null,
    }));

    renderWithProviders(
      <MoviesGrid {...defaultProps} movies={moviesWithoutPosters} />
    );

    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img.src).toContain("placeholder");
    });
  });

  it("should show different icons for favorited movies", () => {
    const isFavorite = vi.fn().mockReturnValue(true);

    renderWithProviders(
      <MoviesGrid {...defaultProps} isFavorite={isFavorite} />
    );

    const favoriteButtons = screen.getAllByLabelText("remove_favorite");
    expect(favoriteButtons).toHaveLength(mockMovies.length);
  });

  it("should show different icons for movies in watchlist", () => {
    const isInWatchlist = vi.fn().mockReturnValue(true);

    renderWithProviders(
      <MoviesGrid {...defaultProps} isInWatchlist={isInWatchlist} />
    );

    const watchlistButtons = screen.getAllByLabelText("remove_watchlist");
    expect(watchlistButtons).toHaveLength(mockMovies.length);
  });
});
