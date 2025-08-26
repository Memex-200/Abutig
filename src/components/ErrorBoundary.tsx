import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[40vh] flex items-center justify-center p-6">
            <div
              className="max-w-lg w-full bg-white shadow rounded-lg p-6 text-center"
              role="alert"
              aria-live="assertive"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                حدث خطأ غير متوقع
              </h2>
              <p className="text-sm text-gray-600">
                يرجى إعادة تحميل الصفحة أو المحاولة لاحقًا.
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children as React.ReactNode;
  }
}
