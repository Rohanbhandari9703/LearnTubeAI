import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // "email" | "otp" | "signup"
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(""); // For development only

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/send-otp", {
        email: formData.email,
      });

      if (res.data.success) {
        // In development, check if OTP is in response
        if (res.data.otp) {
          setDevOtp(res.data.otp);
        }
        setStep("otp");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: formData.email,
        otp: otp,
      });

      if (res.data.success) {
        setEmailVerified(true);
        setStep("signup");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!emailVerified) {
      setError("Please verify your email first");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        // Store user info in localStorage
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold mb-2">
              Join <span className="text-blue-500">LearnTube AI</span>
            </h1>
            <p className="text-zinc-400">Create your account to get started</p>
          </div>

          {/* Step 1: Enter Email */}
          {step === "email" && (
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading || !formData.email}
                className="w-full text-lg px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? "Sending OTP..." : "Send Verification Code"}
              </button>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === "otp" && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-zinc-400 mb-4">
                  A 6-digit verification code has been sent to <strong>{formData.email}</strong>
                </p>
                {devOtp && (
                  <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-xl text-sm mb-4">
                    <strong>Dev Mode:</strong> OTP is {devOtp}
                  </div>
                )}
                <label htmlFor="otp" className="block text-sm font-medium mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full text-lg px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="w-full text-sm text-zinc-400 hover:text-white"
              >
                Change Email
              </button>
            </div>
          )}

          {/* Step 3: Complete Signup */}
          {step === "signup" && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-sm text-green-400 mb-4">
                    ✓ Email verified: {formData.email}
                  </p>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-2"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter your password (min 6 characters)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Confirm your password"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-lg px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-zinc-400">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-500 hover:text-blue-400 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
