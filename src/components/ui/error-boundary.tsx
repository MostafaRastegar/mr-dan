"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Alert } from "antd";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      const Fallback = this.props.fallback;
      if (Fallback) return Fallback(error, this.reset);
      return (
        <Alert
          message="خطا در نمایش صفحه"
          description={error.message}
          type="error"
          showIcon
          closable
          onClose={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
