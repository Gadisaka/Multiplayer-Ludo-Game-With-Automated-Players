// https://ludo-serverside.onrender.com
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, loading, error, user } = useAuthStore();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "PLAYER",
  });
  const [formError, setFormError] = useState(null);

  // Get message from location state (for deactivation redirects)
  const redirectMessage = location.state?.message;
  const messageType = location.state?.type;

  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (isSignup) {
      if (
        !form.username ||
        !form.phone ||
        !form.password ||
        !form.confirmPassword
      ) {
        setFormError("Please fill in all fields.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
      await signup({
        username: form.username,
        phone: form.phone,
        password: form.password,
      });
      // Optionally, you can auto-login or redirect to login after signup
    } else {
      if (!form.phone || !form.password) {
        setFormError("Please fill in all fields.");
        return;
      }
      await login({
        phone: form.phone,
        password: form.password,
        role: "PLAYER",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20 animate-pattern"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-2000"></div>
      <div className="absolute bottom-20 left-40 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-4000"></div>

      <div className="relative w-full max-w-md z-10">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8 animate-slide-in-up">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">
              {isSignup ? "Join Ludo King" : "Welcome Back"}
            </h2>
            <p className="text-blue-100 text-sm">
              {isSignup
                ? "Create your account and start playing!"
                : "Sign in to continue your journey"}
            </p>
          </div>

          {/* Redirect Message (for deactivation) */}
          {redirectMessage && (
            <div
              className={`p-4 rounded-xl border ${
                messageType === "error"
                  ? "bg-red-500/20 border-red-400/30 text-red-100"
                  : "bg-blue-500/20 border-blue-400/30 text-blue-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {messageType === "error" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  )}
                </svg>
                <span className="text-sm font-medium">{redirectMessage}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {isSignup && (
                <div className="group">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-blue-100 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-blue-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={form.username}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-blue-100 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-blue-100 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {isSignup && (
                <div className="group">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-blue-100 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-blue-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {(formError || error) && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formError || error}</span>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            {/* {!isSignup && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-yellow-400 bg-white/10 border-white/20 rounded focus:ring-yellow-400 focus:ring-2"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-blue-100"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
            )} */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:animate-button-pulse"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>
                    {isSignup ? "Creating account..." : "Signing in..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{isSignup ? "Create Account" : "Sign In"}</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </button>
          </form>

          {/* Toggle Signup/Login */}
          <div className="text-center">
            <button
              onClick={() => setIsSignup((prev) => !prev)}
              className="text-blue-200 hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              {isSignup ? (
                <span>
                  Already have an account?{" "}
                  <span className="text-yellow-400 font-semibold">Sign in</span>
                </span>
              ) : (
                <span>
                  Don't have an account?{" "}
                  <span className="text-yellow-400 font-semibold">
                    Create one
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
