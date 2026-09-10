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
    this.state = { hasError: false, error: null, countdown: 6 };
    this.timer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);

    if (isChunkError(error)) {
      const retries = parseInt(safeSession.get('eb_chunk_retries') || '0', 10);
      if (retries < 2) {
        // Immediate automatic retry for the first 2 attempts
        safeSession.set('eb_chunk_retries', retries + 1);
        window.location.href =
          window.location.origin + window.location.pathname + '?cb=' + Date.now();
        return;
      }
      if (retries === 2) {
        // 3rd attempt: show friendly countdown before retrying
        this.startCountdown();
        return;
      }
      // If retries >= 3, falls through to render the hard error UI
    } else {
      const alreadyRetried = safeSession.get('eb_auto_reloaded');
      if (!alreadyRetried) {
        safeSession.set('eb_auto_reloaded', 'true');
        window.location.href =
          window.location.origin + window.location.pathname + '?cb=' + Date.now();
      }
    }
  }

  startCountdown = () => {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.setState((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(this.timer);
          const retries = parseInt(safeSession.get('eb_chunk_retries') || '0', 10);
          safeSession.set('eb_chunk_retries', retries + 1);
          window.location.href =
            window.location.origin + window.location.pathname + '?cb=' + Date.now();
          return { countdown: 0 };
        }
        return { countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  componentDidUpdate(prevProps) {
    // If children changed (e.g. route navigation) and we were in error state,
    // give the new children a chance to render.
    if (this.state.hasError && prevProps.children !== this.props.children) {
      if (this.timer) clearInterval(this.timer);
      this.setState({ hasError: false, error: null, countdown: 6 });
    }
  }

  handleReload = () => {
    if (this.timer) clearInterval(this.timer);
    // Clear ALL retry flags so the next load gets fresh retry attempts
    safeSession.remove('eb_auto_reloaded');
    safeSession.remove('eb_chunk_retries');
    safeSession.remove('eb_chunk_auto_reloaded');
    safeSession.remove('chunk_reload_attempted');
    // Force a fresh reload from server bypassing browser cache
    window.location.href = window.location.origin + window.location.pathname + '?cb=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const chunkFail = isChunkError(this.state.error);
      const retries = parseInt(safeSession.get('eb_chunk_retries') || '0', 10);
      const isRetrying = chunkFail && retries === 2 && this.state.countdown > 0;

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
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
            maxWidth: '420px',
            width: '100%',
            position: 'relative'
          }}>
            {isRetrying ? (
              <>
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1.25rem',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                  Connecting to AbacusHeroes...
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Loading resources on slow connections may take a moment.
                  <br />
                  Retrying automatically in <strong style={{ color: '#2563eb' }}>{this.state.countdown}s</strong>
                </p>
                <button
                  onClick={this.handleReload}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'transform 0.15s ease, background-color 0.2s ease'
                  }}
                >
                  Retry Now
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: chunkFail ? '#eff6ff' : '#fff1f2',
                  color: chunkFail ? '#2563eb' : '#e11d48',
                  fontSize: '1.5rem'
                }}>
                  {chunkFail ? '⚡' : '⚠️'}
                </div>
                <h2 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: chunkFail ? '#1e293b' : '#e11d48',
                  marginBottom: '0.75rem'
                }}>
                  {chunkFail ? 'Connection issue detected' : 'Something went wrong'}
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {chunkFail
                    ? 'A file took too long to download. Please verify your internet connection and tap the button below to reload.'
                    : 'The application encountered an unexpected error. Please refresh to restore functionality.'}
                </p>
                <button
                  onClick={this.handleReload}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'transform 0.15s ease, background-color 0.2s ease'
                  }}
                >
                  Reload Page
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
