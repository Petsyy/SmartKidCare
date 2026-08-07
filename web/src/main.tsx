import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { installCsrfFetchInterceptor } from "./utils/csrf";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

installCsrfFetchInterceptor();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
