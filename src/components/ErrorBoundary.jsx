import React from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // You can also log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo }) {
  const { t } = useTranslation();

  return (
    <div className="error-boundary">
      <h2>{t('Something went wrong')}</h2>
      <p>{t('Please try refreshing the page')}</p>
      {process.env.NODE_ENV === 'development' && (
        <details style={{ whiteSpace: 'pre-wrap' }}>
          <summary>{t('Error details')}</summary>
          {error && error.toString()}
          <br />
          {errorInfo && errorInfo.componentStack}
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary"
      >
        {t('Refresh Page')}
      </button>
    </div>
  );
}

export default ErrorBoundary; 