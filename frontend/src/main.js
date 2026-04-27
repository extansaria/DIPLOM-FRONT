import { createRoot } from "react-dom/client";
import { React } from "./lib.js";
import App from "./App.js";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return React.createElement(
        "div",
        {
          style: {
            margin: "24px auto",
            maxWidth: "900px",
            padding: "16px",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            background: "#fef2f2",
            color: "#7f1d1d",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif"
          }
        },
        React.createElement("h3", { style: { margin: "0 0 10px" } }, "Ошибка рендера приложения"),
        React.createElement("pre", { style: { whiteSpace: "pre-wrap", margin: 0 } }, String(this.state.error?.stack || this.state.error))
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

createRoot(document.getElementById("root")).render(
  React.createElement(RootErrorBoundary, null, React.createElement(App))
);
