"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class LMSErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LMS Error Boundary caught an error:', error, errorInfo);
    
    // Track error for analytics
    trackEvent('lms_error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full glass rounded-2xl p-6 text-center">
            <div className="text-6xl mb-4 opacity-50">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm opacity-70 mb-6">
              We encountered an unexpected error in the Learning Management System. 
              Please try again or reload the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <summary className="cursor-pointer text-sm font-medium text-red-400 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs overflow-auto max-h-32 text-red-300">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 rounded-lg glass hover:bg-white/20 dark:hover:bg-black/30 transition-all"
              >
                Reload Page
              </button>
            </div>
            
            <p className="text-xs opacity-50 mt-4">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LMSErrorBoundary;
