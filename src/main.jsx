import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import GlobalTranslator from "./components/GlobalTranslator.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <GlobalTranslator />
  </StrictMode>,
);
