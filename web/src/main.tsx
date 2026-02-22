import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { installCsrfFetchInterceptor } from "./utils/csrf";

installCsrfFetchInterceptor();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
