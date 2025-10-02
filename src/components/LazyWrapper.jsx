// Lazy Loading Wrapper Component
import React, { Suspense } from "react";

/**
 * Higher-order component for lazy loading with fallback
 * @param {React.ComponentType} Component - Component to lazy load
 * @param {React.ComponentType} [LoadingComponent] - Custom loading component
 * @returns {React.ComponentType} - Wrapped component with lazy loading
 */
export const withLazyLoading = (Component, LoadingComponent) => {
  const LazyComponent = React.lazy(() =>
    import(Component).catch((error) => {
      console.error("Error loading component:", error);
      // Return a fallback component in case of loading error
      return {
        default: () => (
          <div className="error-loading">
            <p>Failed to load component. Please try again.</p>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        ),
      };
    })
  );

  return React.forwardRef((props, ref) => (
    <Suspense
      fallback={LoadingComponent ? <LoadingComponent /> : <LoadingSpinner />}
    >
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

/**
 * Lazy wrapper component that can be used directly
 */
const LazyWrapper = ({
  children,
  fallback = <LoadingSpinner />,
  errorFallback = null,
}) => {
  const ErrorFallback =
    errorFallback ||
    (() => (
      <div className="error-loading">
        <p>Something went wrong loading this section.</p>
      </div>
    ));

  return <Suspense fallback={fallback}>{children}</Suspense>;
};

/**
 * Simple loading spinner component
 */
function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div
      className="loading-spinner"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        minHeight: "200px",
      }}
    >
      <div
        className="spinner"
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #007bff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "1rem",
        }}
      />
      <p>{message}</p>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default LazyWrapper;
