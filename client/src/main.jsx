import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider.jsx";

import "./styles/base.css";
import "./styles/auth.css";
import "./styles/menu.css";
import "./styles/flash.css";
import "./styles/orders.css";
import "./styles/owner.css";
import "./styles/modal.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
