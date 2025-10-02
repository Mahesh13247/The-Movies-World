import React, { useRef, useEffect } from "react";

const TrendingCarousel = ({ trending, watchMovie, t, loading }) => {
  const carouselRef = useRef(null);
  const [_isScrolling, setIsScrolling] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isAutoplaying, setIsAutoplaying] = React.useState(true);
  const lastScrollTime = useRef(Date.now());
  const lastScrollPos = useRef(0);
  const scrollTimeout = useRef(null);
  const scrollVelocity = useRef(0);
  const resizeObserverRef = useRef(null);
  const autoplayIntervalRef = useRef(null);

  // Check scroll position to update button states
  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
  };

  // Update scroll buttons on mount and content change
  useEffect(() => {
    updateScrollButtons();
  }, [trending]);

  // Resize handling to maintain snap positions and button states
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || typeof ResizeObserver === "undefined") return;
    resizeObserverRef.current = new ResizeObserver(() => {
      updateScrollButtons();
    });
    resizeObserverRef.current.observe(carousel);
    return () =>
      resizeObserverRef.current && resizeObserverRef.current.disconnect();
  }, []);

  // Keyboard navigation and focus management
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleKeyDown = (e) => {
      if (document.activeElement.closest(".carousel-section")) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            scrollByAmount(-200);
            break;
          case "ArrowRight":
            e.preventDefault();
            scrollByAmount(200);
            break;
          case "Tab":
            // Allow natural tab navigation
            break;
          default:
            break;
        }
      }
    };

    const handleFocus = () => {
      updateScrollButtons();
      setIsAutoplaying(false);
    };

    const handleBlur = () => {
      setIsAutoplaying(true);
    };

    carousel.addEventListener("focus", handleFocus, true);
    carousel.addEventListener("blur", handleBlur, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      carousel.removeEventListener("focus", handleFocus, true);
      carousel.removeEventListener("blur", handleBlur, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      const walk = (x - startX) * 2; // Increased sensitivity
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
      // Allow native scrolling; just update position without smooth per-frame
      const x = e.touches[0].pageX;
      const walk = (x - touchStartX) * 2;
      const delta = touchScrollLeft - walk;
      carousel.scrollLeft = delta;
    };

    const handleTouchEnd = () => {
      // Snap to nearest card
      const itemWidth =
        carousel.querySelector(".carousel-card")?.offsetWidth || 0;
      const gapWidth = 24; // matches the gap in CSS
      const scrollPos = carousel.scrollLeft;
      const itemTotalWidth = itemWidth + gapWidth;
      const nearestItem = Math.round(scrollPos / itemTotalWidth);

      carousel.scrollTo({
        left: nearestItem * itemTotalWidth,
        behavior: "smooth",
      });
    };
    // Wheel vertical to horizontal scroll mapping
    const handleWheel = (e) => {
      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      const canScroll = scrollWidth > clientWidth + 1;
      if (!canScroll) return; // nothing to do

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // If horizontal intent (trackpad), allow native-ish horizontal movement
      if (absX >= absY && absX > 0) {
        carousel.scrollBy({ left: e.deltaX, behavior: "smooth" });
        // don't prevent default; let browser handle any vertical if present
        return;
      }

      // If vertical wheel but carousel can scroll horizontally, translate Y->X
      // Prevent page scroll only while we move the carousel
      if (absY > absX && absY > 0) {
        const atStart = scrollLeft <= 0;
        const atEnd = scrollLeft >= scrollWidth - clientWidth - 1;
        const intendsLeft = e.deltaY < 0;
        const intendsRight = e.deltaY > 0;

        const canMoveLeft = !atStart && intendsLeft;
        const canMoveRight = !atEnd && intendsRight;
        if (canMoveLeft || canMoveRight) {
          e.preventDefault();
          carousel.scrollBy({ left: e.deltaY, behavior: "smooth" });
        }
      }
    };
    // Scroll position monitoring
    const handleScroll = () => {
      const now = Date.now();
      const timeDelta = now - lastScrollTime.current;
      const scrollDelta = carousel.scrollLeft - (lastScrollPos?.current || 0);
      scrollVelocity.current = scrollDelta / timeDelta;
      lastScrollTime.current = now;
      lastScrollPos.current = carousel.scrollLeft;

      updateScrollButtons();
      setIsScrolling(true);
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 150);

      // Update active index for pagination
      const itemWidth =
        carousel.querySelector(".carousel-card")?.offsetWidth || 0;
      const gapWidth = 24;
      const itemTotalWidth = itemWidth + gapWidth;
      const index = Math.round(
        carousel.scrollLeft / Math.max(itemTotalWidth, 1)
      );
      setActiveIndex(index);
    };

    carousel.addEventListener("scroll", handleScroll);
    carousel.addEventListener("mousedown", handleMouseDown);
    carousel.addEventListener("mouseleave", handleMouseLeave);
    carousel.addEventListener("mouseup", handleMouseUp);
    carousel.addEventListener("mousemove", handleMouseMove);
    carousel.addEventListener("touchstart", handleTouchStart);
    carousel.addEventListener("touchmove", handleTouchMove, { passive: true });
    carousel.addEventListener("touchend", handleTouchEnd);
    // Use non-passive to allow preventDefault when translating vertical -> horizontal
    carousel.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      carousel.removeEventListener("mousedown", handleMouseDown);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
      carousel.removeEventListener("mouseup", handleMouseUp);
      carousel.removeEventListener("mousemove", handleMouseMove);
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchmove", handleTouchMove);
      carousel.removeEventListener("touchend", handleTouchEnd);
      carousel.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Autoplay to next slide
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    if (!isAutoplaying || !trending || trending.length === 0) {
      clearInterval(autoplayIntervalRef.current);
      return;
    }
    clearInterval(autoplayIntervalRef.current);
    autoplayIntervalRef.current = setInterval(() => {
      const itemWidth =
        carousel.querySelector(".carousel-card")?.offsetWidth || 0;
      const gapWidth = 24;
      const itemTotalWidth = itemWidth + gapWidth;
      const maxIndex = Math.max(trending.length - 1, 0);
      const nextIndex = Math.min(activeIndex + 1, maxIndex);
      carousel.scrollTo({
        left: nextIndex * itemTotalWidth,
        behavior: "smooth",
      });
    }, 3500);
    return () => clearInterval(autoplayIntervalRef.current);
  }, [isAutoplaying, activeIndex, trending]);

  // Scroll button handlers
  const scrollByAmount = (amount) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const goToIndex = (index) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const itemWidth =
      carousel.querySelector(".carousel-card")?.offsetWidth || 0;
    const gapWidth = 24;
    const itemTotalWidth = itemWidth + gapWidth;
    setIsAutoplaying(false);
    carousel.scrollTo({ left: index * itemTotalWidth, behavior: "smooth" });
  };

  return (
    <section className="carousel-section">
      <h2>{t("trending")}</h2>
      <div
        style={{ position: "relative" }}
        role="region"
        aria-label={t("trending_movies_carousel")}
      >
        {/* Always render scroll buttons; CSS hides on mobile */}
        <button
          className={`carousel-scroll-btn left ${
            !canScrollLeft ? "disabled" : ""
          }`}
          aria-label={t("scroll_left")}
          type="button"
          onClick={() => scrollByAmount(-300)}
          disabled={!canScrollLeft}
          aria-hidden={!canScrollLeft}
        >
          &#8592;
        </button>
        <button
          className={`carousel-scroll-btn right ${
            !canScrollRight ? "disabled" : ""
          }`}
          aria-label={t("scroll_right")}
          type="button"
          onClick={() => scrollByAmount(300)}
          disabled={!canScrollRight}
          aria-hidden={!canScrollRight}
        >
          &#8594;
        </button>
        <div
          className="carousel"
          ref={carouselRef}
          onMouseEnter={() => setIsAutoplaying(false)}
          onMouseLeave={() => setIsAutoplaying(true)}
          aria-roledescription="carousel"
        >
          {loading || !trending || trending.length === 0
            ? Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="carousel-card skeleton" />
              ))
            : trending.map((movie) => (
                <div
                  key={movie.id}
                  className="carousel-card"
                  onClick={() =>
                    watchMovie(
                      movie.id,
                      movie.title,
                      movie.release_date,
                      movie.poster_path
                    )
                  }
                >
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                        : "https://via.placeholder.com/100x150?text=No+Image"
                    }
                    alt={movie.title}
                    loading="lazy"
                    onLoad={(e) => e.target.classList.add("loaded")}
                    className="carousel-image"
                    tabIndex="0"
                    role="img"
                    aria-label={`${movie.title}${
                      movie.release_date
                        ? `, Released ${movie.release_date}`
                        : ""
                    }`}
                  />
                  <div className="carousel-title">{movie.title}</div>
                  <div className="carousel-release-date">
                    {movie.release_date}
                  </div>
                </div>
              ))}
        </div>
        {trending && trending.length > 1 && (
          <div
            className="carousel-dots"
            role="tablist"
            aria-label={t("trending_pagination")}
          >
            {trending.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={activeIndex === i}
                aria-controls={`carousel-slide-${i}`}
                className={`carousel-dot ${activeIndex === i ? "active" : ""}`}
                onClick={() => goToIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(TrendingCarousel);
