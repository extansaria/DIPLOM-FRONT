import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

type RootErrorBoundaryProps = { children: ReactNode };

type RootErrorBoundaryState = { error: Error | null };

class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RootErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            margin: "24px auto",
            maxWidth: "900px",
            padding: "16px",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            background: "#fef2f2",
            color: "#7f1d1d",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif"
          }}
        >
          <h3 style={{ margin: "0 0 10px" }}>Ошибка рендера приложения</h3>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root not found");
}

createRoot(rootEl).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
