import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Sparkles, Clock, Brain, LogOut, Upload, Image as ImageIcon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import axios from "axios";

// Simple reusable button (no Next.js / shadcn dependency)
function Button({ children }) {
  return (
    <button className="text-lg px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition shadow-lg">
      {children}
    </button>
  );
}

// Simple card component
function Card({ children }) {
  return <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-none">{children}</div>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [inputMode, setInputMode] = useState("text"); // "text" or "image"
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, {
        withCredentials: true,
      });
      localStorage.removeItem("user");
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (inputMode === "image") {
      if (!selectedImage) {
        setError("Please select an image.");
        return;
      }
      if (!time) {
        setError("Please enter available time.");
        return;
      }
    } else {
      if (!subject || !time) {
        setError("Please enter a subject and available time.");
        return;
      }
    }

    setLoading(true);
    try {
      const totalMinutes = Number(time) * 60 || parseInt(time, 10) || 0;

      let res;
      if (inputMode === "image") {
        // OCR-based flow
        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("totalMinutes", totalMinutes);

        res = await fetch("http://localhost:5000/api/chat/image", {
          method: "POST",
          body: formData
        });
      } else {
        // Text-based flow
        res = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: subject, totalMinutes })
        });
      }

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      localStorage.setItem("playlistData", JSON.stringify(data));
      const dest = data?.mode === "learn" ? "/learn" : "/main";
      navigate(dest);
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/home" className="text-2xl font-bold hover:opacity-80 transition">
          <span className="text-blue-500">LearnTube</span> AI
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-zinc-300">Welcome, {user.name}</span>
              <Link
                to="/saved-playlists"
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition"
              >
                Saved Playlists
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#3b82f6,_transparent_40%)] opacity-20 dark:opacity-30" />
        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight"
          >
            Learn Smarter with <span className="text-blue-500">LearnTube AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto"
          >
            Enter a subject and your available time. Our AI curates the most relevant YouTube videos
            into a perfectly timed learning playlist — no distractions, no clickbait.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 flex justify-center"
          >
            <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-xl dark:shadow-none backdrop-blur-sm">
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("text");
                    setSelectedImage(null);
                    setImagePreview(null);
                    setError("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${inputMode === "text"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                >
                  Text Input
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("image");
                    setSubject("");
                    setError("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${inputMode === "image"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                >
                  <Upload size={16} className="inline mr-2" />
                  Upload Image
                </button>
              </div>

              {inputMode === "text" ? (
                <input
                  type="text"
                  placeholder="Enter subject (e.g. DBMS, DSA, React)"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500 transition bg-gray-50/50 dark:bg-black/50">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="mx-auto mb-2 text-zinc-400" size={32} />
                          <p className="text-sm text-zinc-400">Click to upload image</p>
                          <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <input
                type="number"
                placeholder="Available time (hours)"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={1}
              />
              <Button type="submit">{loading ? 'Generating...' : 'Generate Playlist'}</Button>
              {error && <div className="text-red-400 mt-2">{error}</div>}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-14"
        >
          Why LearnTube AI?
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard icon={<Brain />} title="AI-Curated Learning" desc="Smart topic breakdown and importance-based video selection." />
          <FeatureCard icon={<Clock />} title="Time Optimized" desc="Playlists fit exactly into your available study time." />
          <FeatureCard icon={<PlayCircle />} title="Best YouTube Content" desc="Filters out outdated and low-quality videos automatically." />
          <FeatureCard icon={<Sparkles />} title="Zero Manual Search" desc="No more scrolling endlessly for the right video." />
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-100/60 dark:bg-zinc-900/60 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <Step number="1" title="Enter Subject" desc="Tell us what you want to learn." />
            <Step number="2" title="Set Time" desc="Choose how much time you can spend." />
            <Step number="3" title="Learn" desc="Get an AI-generated YouTube playlist instantly." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Start Learning the Smart Way</h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">Let AI plan your learning. You just focus on studying.</p>
        <div className="mt-8">
          <Button>Get Started</Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <Card>
      <div className="p-6 text-center">
        <div className="flex justify-center mb-4 text-blue-500">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">{desc}</p>
      </div>
    </Card>
  );
}

function Step({ number, title, desc }) {
  return (
    <div>
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{desc}</p>
    </div>
  );
}
