import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";

import { AuthProvider } from "./AuthContext"; // Adjust path
import ProtectedRoute from "./ProtectedRoute"; // Adjust path
import SignUp from "views/auth/SignUp";

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        {/* <Route path="auth/signup" element={<SignUp />} /> */}
        {/* Protect all admin routes */}
        {/* <Route element={<ProtectedRoute />}> */}
        <Route path="admin/*" element={<AdminLayout />} />
        {/* </Route> */}

        <Route path="rtl/*" element={<RtlLayout />} />

        <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
        <Route path="/" element={<Navigate to="/auth/sign-up" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
