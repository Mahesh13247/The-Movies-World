import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext";

// Disable right-click and developer tools
// document.addEventListener("contextmenu", (e) => e.preventDefault());

// const ctrlShiftKey = (e, keyCode) => {
//   return e.ctrlKey && e.shiftKey && e.keyCode === keyCode.charCodeAt(0);
// };

// document.onkeydown = (e) => {
//   // Disable F12, Ctrl + Shift + I, Ctrl + Shift + J, Ctrl + U
//   if (
//     e.keyCode === 123 ||
//     ctrlShiftKey(e, "I") ||
//     ctrlShiftKey(e, "J") ||
//     ctrlShiftKey(e, "C") ||
//     (e.ctrlKey && e.keyCode === "U".charCodeAt(0))
//   ) {
//     return false;
//   }
// };
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
