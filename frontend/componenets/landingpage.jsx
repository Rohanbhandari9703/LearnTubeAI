import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Sparkles, Clock, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  return <div className="bg-zinc-900 border border-zinc-800 rounded-xl">{children}</div>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!subject || !time) {
      setError("Please enter a subject and available time.");
      return;
    }
    setLoading(true);
    try {
      const totalMinutes = Number(time) * 60 || parseInt(time, 10) || 0;
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: subject, totalMinutes })
      });
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
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#3b82f6,_transparent_40%)] opacity-30" />
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
            className="mt-6 text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto"
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
            <form onSubmit={handleSubmit} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 w-full max-w-xl space-y-4">
              <input
                type="text"
                placeholder="Enter subject (e.g. DBMS, DSA, React)"
                className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <input
                type="number"
                placeholder="Available time (hours)"
                className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
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
      <section className="bg-zinc-900/60 py-20">
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
        <p className="mt-4 text-zinc-300">Let AI plan your learning. You just focus on studying.</p>
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
        <p className="text-zinc-400 text-sm">{desc}</p>
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
      <p className="text-zinc-400">{desc}</p>
    </div>
  );
}
