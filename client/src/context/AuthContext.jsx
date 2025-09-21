import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async ({ email, password }) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
         return { success: true, role: data.user.role }; 
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const signup = async (formData) => {
    try {
      const { data } = await axios.post(`${API_BASE}api/auth/register`, formData);
      return data;
    } catch (err) {
      throw err.response?.data || { message: "Signup failed" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!user && !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
