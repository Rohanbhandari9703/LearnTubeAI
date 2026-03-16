import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Sparkles, Clock, Brain, LogOut, Upload, RefreshCw, Image as ImageIcon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import axios from "axios";

// Simple reusable button
function Button({ children, type = "button", className = "" }) {
  return (
    <button
      type={type}
      className={`text-lg px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 ${className}`}
    >
      {children}
    </button>
  );
}

// Simple card component
function Card({ children, className = "" }) {
  return (
    <div className={`glass rounded-[2rem] shadow-2xl shadow-blue-500/5 transition-all duration-500 hover:shadow-blue-500/10 ${className}`}>
      {children}
    </div>
  );
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
  const [showSubtopics, setShowSubtopics] = useState(false);
  const [customSubtopics, setCustomSubtopics] = useState("");
  const [language, setLanguage] = useState("en");

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
        formData.append("language", language);

        res = await fetch("http://localhost:5000/api/chat/image", {
          method: "POST",
          body: formData
        });
      } else {
        // Text-based flow
        const subtopicsList = customSubtopics ? customSubtopics.split(",").map(s => s.trim()).filter(s => s !== "") : [];
        res = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: subject,
            totalMinutes,
            subtopics: subtopicsList,
            language: language
          })
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
          >
            Master Any Topic <br />
            <span className="text-blue-500 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
              Without the Noise
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-8 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium"
          >
            Enter your subject and available time. Our AI curates a laser-focused
            YouTube playlist — perfectly timed, distraction-free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 flex justify-center"
          >
            <form onSubmit={handleSubmit} className="glass rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl space-y-6 shadow-2xl backdrop-blur-xl border border-white/20 dark:border-white/5">
              {/* Input Mode Toggle */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("text");
                    setSelectedImage(null);
                    setImagePreview(null);
                    setError("");
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${inputMode === "text"
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                >
                  Topic Study
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("image");
                    setSubject("");
                    setError("");
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${inputMode === "image"
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                >
                  <Upload size={16} className="inline mr-2" />
                  Image/OCR
                </button>
              </div>

              {inputMode === "text" ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">What do you want to learn?</label>
                  <input
                    type="text"
                    placeholder="e.g. Quantum Physics, Web Dev..."
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 ring-blue-500/10 transition-all font-medium text-lg placeholder:text-zinc-400"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Upload Syllabus or Notes</label>
                  <label className="block group">
                    <div className="flex items-center justify-center w-full h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] cursor-pointer group-hover:border-blue-500 transition-all bg-zinc-50/50 dark:bg-black/20 group-hover:bg-blue-500/5">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-xl p-2" />
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <Upload size={24} />
                          </div>
                          <p className="font-semibold text-zinc-600 dark:text-zinc-300">Choose an image</p>
                          <p className="text-sm text-zinc-400 mt-1">PNG, JPG up to 10MB</p>
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

              <div className="grid md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Search Language</label>
                  <div className="relative">
                    <select
                      className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white appearance-none font-medium text-lg cursor-pointer"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">English (Global)</option>
                      <option value="hi">Hindi (India)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                      <option value="ru">Russian</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <Clock size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Total Time</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Hours"
                      className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium text-lg"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      min={1}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">Hours</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubtopics(!showSubtopics)}
                  className={`w-full py-3 rounded-2xl border-2 border-dotted transition-all font-semibold flex items-center justify-center gap-2 ${showSubtopics ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                >
                  <Sparkles size={18} />
                  {showSubtopics ? "Use Auto-generated Subtopics" : "Define Custom Subtopics"}
                </button>
              </div>

              {showSubtopics && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-1"
                >
                  <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Subtopics (Optional)</label>
                  <textarea
                    placeholder="Example: Basics, Higher Logic, Project Work..."
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white min-h-[120px] font-medium transition-all"
                    value={customSubtopics}
                    onChange={(e) => setCustomSubtopics(e.target.value)}
                  />
                </motion.div>
              )}

              <Button type="submit" className="w-full !py-5 mt-4 text-xl">
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Curating your plan...</span>
                  </div>
                ) : (
                  "Generate Learning Plan"
                )}
              </Button>
              {error && <div className="text-red-500 bg-red-500/10 py-3 px-4 rounded-xl text-center font-medium border border-red-500/20">{error}</div>}
            </form>
          </motion.div>
        </div>
      </section >

      {/* Features Section */}
      < section className="max-w-6xl mx-auto px-6 py-20" >
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
      </section >

      {/* How it Works */}
      < section className="bg-gray-100/60 dark:bg-zinc-900/60 py-20" >
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <Step number="1" title="Enter Subject" desc="Tell us what you want to learn." />
            <Step number="2" title="Set Time" desc="Choose how much time you can spend." />
            <Step number="3" title="Learn" desc="Get an AI-generated YouTube playlist instantly." />
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-24 text-center" >
        <h2 className="text-3xl md:text-4xl font-bold">Start Learning the Smart Way</h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">Let AI plan your learning. You just focus on studying.</p>
        <div className="mt-8">
          <Button>Get Started</Button>
        </div>
      </section >
    </div >
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
