import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary that prevents unhandled render-time exceptions
 * from white-screening the entire app.  Shows a minimal fallback with a
 * reload button.  Reuses the same gradient background as ProtectedRoute
 * so there is no visual redesign.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so devs can diagnose from browser tools.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-2xl font-semibold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-purple-300 mb-6">
              An unexpected error occurred. Please reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
