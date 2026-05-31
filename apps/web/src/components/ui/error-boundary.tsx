"use client";

import { Component, type ReactNode } from "react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="font-semibold text-red-800 mb-1">Đã xảy ra lỗi</h3>
          <p className="text-sm text-red-600 mb-4 font-mono">{this.state.error?.message ?? "Unknown error"}</p>
          <Button variant="secondary" size="sm" onClick={this.reset}>
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
