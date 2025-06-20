import React, { useRef, useEffect } from "react";

const TrendingCarousel = ({ trending, watchMovie, t, loading }) => {
  const carouselRef = useRef(null);

  // Drag-to-scroll handlers
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      carousel.classList.add("dragging");
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    };
    const handleMouseLeave = () => {
      isDragging = false;
      carousel.classList.remove("dragging");
    };
    const handleMouseUp = () => {
      isDragging = false;
      carousel.classList.remove("dragging");
    };
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.2; // scroll-fast
      carousel.scrollLeft = scrollLeft - walk;
    };
    // Touch events for swipe
    let touchStartX = 0;
    let touchScrollLeft = 0;
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = carousel.scrollLeft;
    };
    const handleTouchMove = (e) => {
      const x = e.touches[0].pageX;
      const walk = (x - touchStartX) * 1.2;
      carousel.scrollLeft = touchScrollLeft - walk;
    };
    carousel.addEventListener("mousedown", handleMouseDown);
    carousel.addEventListener("mouseleave", handleMouseLeave);
    carousel.addEventListener("mouseup", handleMouseUp);
    carousel.addEventListener("mousemove", handleMouseMove);
    carousel.addEventListener("touchstart", handleTouchStart);
    carousel.addEventListener("touchmove", handleTouchMove);
    return () => {
      carousel.removeEventListener("mousedown", handleMouseDown);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
      carousel.removeEventListener("mouseup", handleMouseUp);
      carousel.removeEventListener("mousemove", handleMouseMove);
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Scroll button handlers
  const scrollByAmount = (amount) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className="carousel-section">
      <h2>{t("trending")}</h2>
      <div style={{ position: "relative" }}>
        {/* Always render scroll buttons; CSS hides on mobile */}
        <button
          className="carousel-scroll-btn left"
          aria-label="Scroll left"
          type="button"
          onClick={() => scrollByAmount(-300)}
        >
          &#8592;
        </button>
        <button
          className="carousel-scroll-btn right"
          aria-label="Scroll right"
          type="button"
          onClick={() => scrollByAmount(300)}
        >
          &#8594;
        </button>
        <div className="carousel" ref={carouselRef}>
          {loading || !trending || trending.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="carousel-card skeleton" />
              ))
            : trending.map((movie) => (
                <div
                  key={movie.id}
                  className="carousel-card"
                  onClick={() => watchMovie(movie.id, movie.title, movie.release_date)}
                >
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                        : "https://via.placeholder.com/100x150?text=No+Image"
                    }
                    alt={movie.title}
                  />
                  <div className="carousel-title">{movie.title}</div>
                  <div className="carousel-release-date">{movie.release_date}</div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(TrendingCarousel); 