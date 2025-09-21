import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/admin/index";
import AuthLayout from "layouts/auth";
import MemberLayout from "layouts/member";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="auth/*" element={<AuthLayout />} />

        {/* Admin Protected Routes */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Member Protected Routes */}
        <Route
          path="member/*"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <MemberLayout />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
