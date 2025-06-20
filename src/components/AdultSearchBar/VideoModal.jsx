import React from 'react';
import './VideoModal.css';
import { FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';

const VideoModal = ({ video, sources, onClose, onPrev, onNext, showPrev, showNext }) => (
  <div className="video-player-modal-root">
    <div className="video-player-modal">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close video modal">✕</button>
        <h2>{video.title}</h2>
        <div className="video-meta-row">
          <span><FaStar style={{color:'#ffb347',marginRight:4}} /> {video.rating}</span>
          <span>{video.duration}</span>
          <span>{video.views} views</span>
          {video.category && <span>{video.category}</span>}
        </div>
        <div className="video-sources">
          <iframe
            src={video.embedUrl}
            title={video.title}
            allowFullScreen
            className="video-iframe-responsive"
          />
          <div className="additional-sources">
            <h3>Additional Sources</h3>
            {sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <FaExternalLinkAlt /> {source.name}
              </a>
            ))}
          </div>
        </div>
        <div className="modal-nav-row">
          {showPrev && <button className="modal-nav-btn" onClick={onPrev} aria-label="Previous video"><FaChevronLeft /></button>}
          {showNext && <button className="modal-nav-btn" onClick={onNext} aria-label="Next video"><FaChevronRight /></button>}
        </div>
      </div>
    </div>
  </div>
);

export default VideoModal; 