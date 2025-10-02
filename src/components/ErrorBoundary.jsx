import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Increment error count
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log error
    console.error("Error caught by boundary:", error, errorInfo);

    // Show error toast
    toast.error("An error occurred. Please try refreshing the page.");

    // Report to error service if available
    if (window.errorReportingService) {
      window.errorReportingService.logError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // If we've had multiple errors, force a page reload
      if (this.state.errorCount > 2) {
        return (
          <div className="error-boundary-critical">
            <h2>Critical Error</h2>
            <p>Multiple errors detected. Please reload the page.</p>
            <button onClick={this.handleReload}>Reload Page</button>
          </div>
        );
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo }) {
  const { t } = useTranslation();

  return (
    <div className="error-boundary">
      <h2>{t("Something went wrong")}</h2>
      <p>{t("Please try refreshing the page")}</p>
      {import.meta.env.MODE === "development" && (
        <details style={{ whiteSpace: "pre-wrap" }}>
          <summary>{t("Error details")}</summary>
          {error && error.toString()}
          <br />
          {errorInfo && errorInfo.componentStack}
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary"
      >
        {t("Refresh Page")}
      </button>
    </div>
  );
}

export default ErrorBoundary;
