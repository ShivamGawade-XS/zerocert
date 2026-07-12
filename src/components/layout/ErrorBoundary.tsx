'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text font-mono">
          <div className="max-w-md w-full border border-err/30 bg-surface p-8 rounded shadow-lg shadow-err/5">
            <div className="text-err text-xs tracking-wider uppercase mb-2">✦ Critical Error</div>
            <h1 className="text-xl font-bold mb-4 font-display text-text">Something went wrong</h1>
            <p className="text-xs text-mutedHigh mb-6 leading-relaxed">
              An unexpected error occurred. This could be due to a rendering failure or corrupt asset loading.
            </p>
            <div className="bg-bg p-3 border border-border text-[10px] text-err overflow-auto max-h-32 mb-6 rounded">
              {this.state.error?.toString() || 'Unknown rendering error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-wider uppercase rounded transition duration-150 w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
