import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // log to console (or remote logging service)
    console.error("ErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-900/95 border border-red-600/40 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <div className="text-sm text-slate-300 mb-4">An unexpected error occurred. You can try reloading the page.</div>
            <details className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-md">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="whitespace-pre-wrap mt-2 text-xs">{String(this.state.error)}</pre>
              {this.state.info && <pre className="whitespace-pre-wrap mt-2 text-xs">{String(this.state.info.componentStack)}</pre>}
            </details>
            <div className="mt-4 flex gap-2">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 rounded-md text-white">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
