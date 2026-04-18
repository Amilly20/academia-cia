import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error("Error rendering app:", error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Erro ao carregar aplicação</h1><p>${error}</p></div>`;
}
