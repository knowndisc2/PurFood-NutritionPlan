
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Auth from "./Auth";
import "./index.css"; // Tailwind CSS

// Use BrowserRouter with GitHub Pages SPA support
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/PurFood-NutritionPlan">
      <Auth />
    </BrowserRouter>
  </React.StrictMode>
);
