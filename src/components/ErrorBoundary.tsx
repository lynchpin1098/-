import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center px-6 bg-base-bg">
          <AlertCircle className="w-12 h-12 text-base-accent/60 mb-4" />
          <h2 className="text-base-text text-lg font-light mb-2">出错了</h2>
          <p className="text-base-muted text-sm font-light text-center mb-6 leading-relaxed">
            应用遇到了意外问题，请刷新页面重试。
          </p>
          {this.state.error && (
            <p className="text-base-muted/50 text-xs font-light text-center mb-6 max-w-xs break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-base-card rounded-xl text-sm text-base-text
                       hover:bg-base-hover active:scale-95 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
