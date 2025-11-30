
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 text-center dark:bg-gray-900">
          <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="mb-4 text-gray-900 dark:text-gray-300">
              There was an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition-all"
            >
              Refresh Page
            </button>
            {this.state.error && (
                <details className="mt-4 text-left text-xs text-gray-500">
                    <summary>Error Details</summary>
                    <pre className="mt-2 overflow-auto rounded bg-gray-200 p-2 dark:bg-gray-900 dark:text-gray-400">
                        {this.state.error.toString()}
                    </pre>
                </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
