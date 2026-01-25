import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadSettingsFromLocalStorage } from "./lib/settings";

// Load saved settings before app renders
loadSettingsFromLocalStorage();

createRoot(document.getElementById("root")!).render(<App />);
