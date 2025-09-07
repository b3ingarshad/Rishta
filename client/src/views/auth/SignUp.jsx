import React, { useState } from "react";
import InputField from "components/fields/InputField";
import Checkbox from "components/checkbox";
import { useAuth } from "../../AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    console.log(email, password,"email, password");
    
    const success = await signup({ email, password });
    if (!success) {
      setError("Failed to create account. Try again.");
    } else {
      setError("");
      navigate("/auth/sign-in"); // Redirect to sign in after successful signup
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-4 text-4xl font-bold text-navy-700 dark:text-white">Sign Up</h4>
        <p className="mb-8 text-base text-gray-600 dark:text-gray-300">
          Create your account by filling the form below.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <InputField
            variant="auth"
            extra="mb-4"
            label="Email*"
            placeholder="mail@simmmple.com"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputField
            variant="auth"
            extra="mb-4"
            label="Password*"
            placeholder="Min. 8 characters"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <InputField
            variant="auth"
            extra="mb-4"
            label="Confirm Password*"
            placeholder="Re-enter password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-500 py-3 text-base font-semibold text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 flex text-sm font-medium text-navy-700 dark:text-gray-400">
          <span>Already have an account?</span>
          <Link to="/auth/sign-in" className="ml-1 text-brand-500 hover:text-brand-600 dark:text-white">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
