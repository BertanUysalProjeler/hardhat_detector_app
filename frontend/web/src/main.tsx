import React from "react";
import ReactDOM from "react-dom/client";
import MainWindow from "./components/MainWindow";
const rootEl = document.getElementById("root");

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <MainWindow />
    </React.StrictMode>
  );
}

