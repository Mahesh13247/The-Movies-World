import React, { useRef, useMemo } from 'react';
import './VideoModal.css';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaStar, 
  FaEye,
  FaClock,
  FaCalendar,
  FaTimes
} from 'react-icons/fa';

const VideoModal = ({ video, sources, onClose, onPrev, onNext, showPrev, showNext, allVideos = [], onVideoSelect }) => {
  const videoRef = useRef(null);

  // Parse duration string (e.g., "10:30") into seconds
  const parseDuration = (durationStr) => {
    if (!durationStr || typeof durationStr !== 'string') return 0;
    const parts = durationStr.split(':');
    if (parts.length !== 2) return 0;
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
  };

  const videoDuration = parseDuration(video.duration);

  // Enhanced view formatting
  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B`;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  // Enhanced date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Enhanced time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Related videos logic
  const relatedVideos = useMemo(() => {
    if (!video || !allVideos.length) return [];
    // Prefer category, fallback to tags, fallback to random
    let related = allVideos.filter(
      v => v.id !== video.id && (
        (video.category && v.category === video.category) ||
        (video.tags && v.tags && v.tags.some(tag => video.tags.includes(tag)))
      )
    );
    // If not enough, fill with random others
    if (related.length < 100) {
      const others = allVideos.filter(v => v.id !== video.id && !related.includes(v));
      while (related.length < 100 && others.length) {
        const idx = Math.floor(Math.random() * others.length);
        related.push(others.splice(idx, 1)[0]);
      }
    }
    return related.slice(0, 100);
  }, [video, allVideos]);

  return (
    <div className="youtube-modal-overlay">
      <div className="youtube-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="youtube-modal-header">
          <button className="youtube-close-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="youtube-modal-content">
          {/* Sticky video player at the top of scrollable content */}
          <div className="youtube-video-container">
            <iframe
              ref={videoRef}
              src={video.embedUrl}
              title={video.title}
              allowFullScreen
              className="youtube-video-player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          <div className="youtube-video-info">
            <h1 className="youtube-video-title">{video.title}</h1>
            <div className="youtube-video-stats">
              <div className="youtube-stats-left">
                <span className="youtube-views">
                  <FaEye /> {formatViews(video.views)}
                </span>
                <span className="youtube-rating">
                  <FaStar /> {video.rating || 0}%
                </span>
                <span className="youtube-duration">
                  <FaClock /> {formatTime(videoDuration)}
                </span>
                {video.uploadDate && (
                  <span className="youtube-date">
                    <FaCalendar /> {formatDate(video.uploadDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Related Videos Section */}
          {relatedVideos.length > 0 && (
            <div className="related-videos-section">
              <h3 style={{margin: '18px 0 10px 18px', color: '#fff', fontWeight: 600}}>Related Videos</h3>
              <div className="related-videos-grid">
                {relatedVideos.map((rv) => (
                  <div
                    key={rv.id}
                    className="related-video-card"
                    onClick={() => onVideoSelect && onVideoSelect(rv)}
                  >
                    <div className="related-video-thumb">
                      <img src={rv.thumbnail} alt={rv.title} loading="lazy" />
                      <span className="related-video-duration">{rv.duration || '00:00'}</span>
                    </div>
                    <div className="related-video-info">
                      <div className="related-video-title" title={rv.title}>{rv.title}</div>
                      <div className="related-video-meta">
                        <span><FaEye /> {formatViews(rv.views)}</span>
                        <span><FaStar /> {rv.rating || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="youtube-navigation">
            {showPrev && (
              <button className="youtube-nav-btn prev" onClick={onPrev}>
                <FaChevronLeft />
                <span>Previous</span>
              </button>
            )}
            {showNext && (
              <button className="youtube-nav-btn next" onClick={onNext}>
                <span>Next</span>
                <FaChevronRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal; 