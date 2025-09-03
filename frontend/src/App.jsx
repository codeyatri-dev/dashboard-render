// App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CodeyatriDashboard from "./CodeYatriDashboard";
import LoginPage from "./LoginPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Persist login state in localStorage so page reload doesn't log out
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const handleLogin = (username, password) => {
    // Demo login - in production, validate against your backend
    if (username && password) {
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <CodeyatriDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
