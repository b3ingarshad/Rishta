import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_BASE = process.env.REACT_APP_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // to handle initial auth check

  // Try to load user/token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login function - returns true/false
  const login = async ({ email, password }) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(data.token);
      setUser({ id: data.user.id, email: data.user.email });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ id: data.user.id, email: data.user.email }));
      return true;
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  };
  const signup = async ({ email, password }) => {
    try {
      await axios.post("http://localhost:5000/auth/signup", { email, password });
      return true;
    } catch {
      return false;
    }
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user,signup, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
