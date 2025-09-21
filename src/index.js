
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Auth from "./Auth";
import "./index.css"; // Tailwind CSS

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Auth />
  </BrowserRouter>
);
