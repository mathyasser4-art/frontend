import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
    
    // Auto-retry once on uncaught UI/chunk error to self-heal post-login or transient state errors
    try {
      const hasReloaded = sessionStorage.getItem('eb_auto_reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('eb_auto_reloaded', 'true');
        window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
      }
    } catch (e) {}
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem('eb_auto_reloaded');
      sessionStorage.removeItem('eb_chunk_auto_reloaded');
      sessionStorage.removeItem('chunk_reload_attempted');
    } catch(e) {}
    // Force a fresh reload from server bypassing browser cache
    window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            maxWidth: '420px',
            width: '100%'
          }}>
            <h2 style={{ fontSize: '1.5rem', color: '#e11d48', marginBottom: '1rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              The application encountered an unexpected error. Please refresh to restore functionality.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
