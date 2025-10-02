import React, { useState, useRef, useEffect } from "react";
import {
  FaSearch,
  FaMicrophone,
  FaMicrophoneSlash,
  FaTimes,
  FaHistory,
  FaKeyboard,
} from "react-icons/fa";
import { toast } from "react-toastify";

const SearchInput = ({
  searchQuery,
  onSearchChange,
  loading,
  recentSearches = [],
  onSuggestionClick,
  showSuggestions = false,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder = "Search adult videos...",
  inputRef: externalInputRef,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const internalInputRef = useRef(null);
  const inputRef = externalInputRef || internalInputRef;
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange({ target: { value: transcript } });
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onSearchChange]);

  // Handle clear button visibility
  useEffect(() => {
    setShowClearButton(searchQuery.length > 0);
  }, [searchQuery]);

  // Handle voice search
  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    onSearchChange({ target: { value: "" } });
    inputRef.current?.focus();
  };

  // Handle suggestion navigation
  const handleSuggestionKeyDown = (e, suggestion) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSuggestionClick?.(suggestion);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (showSuggestions && recentSearches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < recentSearches.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : recentSearches.length - 1
        );
      } else if (e.key === "Enter" && activeSuggestion >= 0) {
        e.preventDefault();
        onSuggestionClick?.(recentSearches[activeSuggestion]);
        setActiveSuggestion(-1);
      } else if (e.key === "Escape") {
        setActiveSuggestion(-1);
      }
    }

    // Call the original onKeyDown handler
    onKeyDown?.(e);
  };

  return (
    <div className={`search-input-container${isFocused ? " focused" : ""}`}>
      <div className={`search-bar${isFocused ? " focused" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className={`search-input ${loading ? "loading" : ""} ${
            isListening ? "listening" : ""
          }`}
          aria-label="Search adult videos"
          aria-busy={loading}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Loading animation */}
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Voice search button */}
        <button
          type="button"
          className={`voice-search-btn ${isListening ? "listening" : ""}`}
          onClick={handleVoiceSearch}
          aria-label={isListening ? "Stop voice search" : "Start voice search"}
          title={isListening ? "Stop voice search" : "Start voice search"}
        >
          {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>

        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={handleClearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimes />
          </button>
        )}

        {/* Search icon */}
        <FaSearch className="search-icon" />
      </div>

      {/* Search suggestions */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="search-suggestions fade-slide">
          <div className="suggestions-header">
            <FaHistory />
            <span>Recent searches</span>
          </div>
          {recentSearches.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`suggestion-item ${
                index === activeSuggestion ? "active" : ""
              }`}
              onMouseDown={() => onSuggestionClick?.(suggestion)}
              onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
              tabIndex={0}
              role="button"
              aria-label={`Search for ${suggestion}`}
            >
              <FaHistory className="suggestion-icon" />
              <span className="suggestion-text">{suggestion}</span>
              {index === activeSuggestion && (
                <FaKeyboard className="suggestion-keyboard" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Voice search status */}
      {isListening && (
        <div className="voice-status">
          <div className="voice-indicator">
            <div className="voice-wave"></div>
            <div className="voice-wave"></div>
            <div className="voice-wave"></div>
          </div>
          <span>Listening...</span>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
