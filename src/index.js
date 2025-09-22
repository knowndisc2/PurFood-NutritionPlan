
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import Auth from "./Auth";
import "./index.css"; // Tailwind CSS

// Use HashRouter for GitHub Pages compatibility
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HashRouter>
      <Auth />
    </HashRouter>
  </React.StrictMode>
);
