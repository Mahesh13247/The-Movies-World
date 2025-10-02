import React from "react";
import PropTypes from "prop-types";
import "./LoadingStates.css";

export const LoadingOverlay = ({
  message = "Loading...",
  showSpinner = true,
  showProgress = false,
}) => {
  return (
    <div className="loading-overlay">
      {showSpinner && <div className="loading-spinner" />}
      <div className="loading-pulse" />
      <div className="loading-text">{message}</div>
      {showProgress && (
        <div className="loading-progress">
          <div className="loading-progress-bar" />
        </div>
      )}
    </div>
  );
};

LoadingOverlay.propTypes = {
  message: PropTypes.string,
  showSpinner: PropTypes.bool,
  showProgress: PropTypes.bool,
};

export const LoadingPlaceholder = ({
  width = "100%",
  height = "200px",
  type = "pulse",
}) => {
  const className = `loading-placeholder ${type}`;
  return (
    <div
      className={className}
      style={{
        width,
        height,
        background: "rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
      }}
    />
  );
};

LoadingPlaceholder.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  type: PropTypes.oneOf(["pulse", "wave"]),
};

export default {
  LoadingOverlay,
  LoadingPlaceholder,
};
