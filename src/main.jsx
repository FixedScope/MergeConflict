import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MergeConflict from "../merge-conflict.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MergeConflict />
  </StrictMode>
);
