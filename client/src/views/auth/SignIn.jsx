import React, { useState } from "react";
import InputField from "components/fields/InputField";
import Checkbox from "components/checkbox";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { success, role } = await login({ email, password });
   

    if (!success) {
    setError("Invalid email or password.");
    toast.error("Invalid email or password!");
    setLoading(false);
  } else {
    toast.success("Login successful!");
    setTimeout(() => {
      if (role === "admin") {
        navigate("/admin/default");
      } else if (role === "user") {
        navigate("/member/dashboard");
      } else {
        navigate("/auth/sign-in");
      }
    }, 2000);
  }
  };

  return (
    <div className="mt-16 flex h-full w-full items-center px-2">
       <ToastContainer position="top-right" autoClose={2000} />
      <div className="w-full max-w-md">
        <h4 className="mb-2 text-4xl font-bold text-navy-700 dark:text-white">Sign In</h4>
        <p className="mb-6 text-gray-600">Enter your credentials to sign in</p>

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            placeholder="Enter email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            label="Password"
            placeholder="Enter password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 mt-2">{error}</p>}

          <div className="my-3 flex justify-between items-center">
            <Checkbox />
            <a href="#" className="text-sm text-brand-500">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 mt-2 rounded-lg text-white font-medium ${loading ? "bg-gray-400" : "bg-[#75B61A] hover:bg-green-600"}`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm">Not registered yet? </span>
          <Link to="/auth/sign-up" className="text-sm text-brand-500 hover:text-brand-600">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
