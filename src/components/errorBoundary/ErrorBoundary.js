import React from 'react';

/**
 * ErrorBoundary — Global crash guard for the React component tree.
 *
 * Recovery strategy:
 *   1. On chunk-load errors → one automatic cache-busting page reload.
 *   2. On any other unhandled error → one automatic page reload.
 *   3. If the auto-reload already happened this session → show the error UI.
 *
 * Uses a try/catch wrapper around sessionStorage to survive iOS Safari
 * Private Browsing Mode and other restricted environments.
 */

// Minimal safe sessionStorage helper (avoid importing the full util to keep
// the ErrorBoundary dependency-free — if the util itself throws, we still work).
const safeSession = {
  get: (key) => { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
  set: (key, val) => { try { sessionStorage.setItem(key, String(val)); } catch (e) {} },
  remove: (key) => { try { sessionStorage.removeItem(key); } catch (e) {} },
};

const isChunkError = (error) =>
  /loading chunk|failed to fetch|load failed|dynamically imported module|unexpected token|loading css chunk/i.test(
    String(error?.message || error)
  );

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

    // Determine which flag to check (chunk vs generic)
    const flagKey = isChunkError(error) ? 'eb_chunk_auto_reloaded' : 'eb_auto_reloaded';
    const alreadyRetried = safeSession.get(flagKey);

    if (!alreadyRetried) {
      safeSession.set(flagKey, 'true');
      // Cache-busting redirect to force fresh assets from the server
      window.location.href =
        window.location.origin + window.location.pathname + '?cb=' + Date.now();
    }
    // If we already retried, fall through to render the error UI.
  }

  componentDidUpdate(prevProps) {
    // If children changed (e.g. route navigation) and we were in error state,
    // give the new children a chance to render.
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReload = () => {
    // Clear ALL retry flags so the next load gets fresh retry attempts
    safeSession.remove('eb_auto_reloaded');
    safeSession.remove('eb_chunk_auto_reloaded');
    safeSession.remove('chunk_reload_attempted');
    // Force a fresh reload from server bypassing browser cache
    window.location.href = window.location.origin + window.location.pathname + '?cb=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const chunkFail = isChunkError(this.state.error);

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
              {chunkFail
                ? 'A required file failed to load — this usually happens on slow or unstable connections. Please tap the button below to reload.'
                : 'The application encountered an unexpected error. Please refresh to restore functionality.'}
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
