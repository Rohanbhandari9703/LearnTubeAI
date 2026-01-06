import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const MainPage = () => {
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const totalDurationInMinutes = useMemo(() => {
    return plan.reduce((sum, item) => sum + (item.timeAllocated || 0), 0);
  }, [plan]);

  const totalHours = Math.floor(totalDurationInMinutes / 60);
  const remainingMinutes = Math.round(totalDurationInMinutes % 60);

  const handleGenerate = async () => {
    if (!subject || !time) {
      setFormError("Please fill all the fields");
      return;
    }
    setFormError("");
    setLoading(true);
    setError("");
    setPlan([]);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        input: subject,
        totalMinutes: Number(time) * 60,
      });
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Network error");
    }

    setLoading(false);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("playlistData");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPlan(parsed);
        else if (parsed.plan) setPlan(parsed.plan);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white px-6 py-20">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Your <span className="text-blue-500">Learning Plan</span>
        </h1>
        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
          Enter what you want to learn and how much time you have.
          LearnTube AI will do the planning for you.
        </p>
      </motion.div>

      {/* Input Card */}
      <div className="max-w-3xl mx-auto bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Topic (DBMS, DSA, React...)"
            className="px-4 py-3 rounded-xl bg-black border border-zinc-700 focus:border-blue-500 outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            type="number"
            placeholder="Time (hours)"
            className="px-4 py-3 rounded-xl bg-black border border-zinc-700 focus:border-blue-500 outline-none"
            min={1}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition shadow-lg font-semibold"
        >
          {loading ? "Generating Plan..." : "Generate Learning Plan"}
        </button>

        {formError && <p className="mt-3 text-red-500 text-center">{formError}</p>}
        {error && <p className="mt-3 text-red-500 text-center">{error}</p>}
      </div>

      {/* Plan Section */}
      {plan.length > 0 && (
        <div className="max-w-5xl mx-auto mt-20">
          <h2 className="text-2xl font-bold mb-8 text-center">
            📘 AI-Generated Study Plan
          </h2>

          <div className="space-y-6">
            {plan.map((item, idx) => {
              // Extract video ID from YouTube URL to get thumbnail
              const getYouTubeThumbnail = (url) => {
                if (!url) return null;
                const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
              };
              const thumbnail = getYouTubeThumbnail(item.videoUrl);

              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow"
                >
                  {item.videoUrl ? (
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-4"
                    >
                      {/* Thumbnail */}
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt={item.videoTitle}
                          className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-lg font-semibold text-blue-400 hover:underline">
                          {item.videoTitle}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-2">
                          Topic: <span className="font-medium">{item.subtopic}</span>
                        </p>
                        <p className="text-sm text-zinc-400">
                          Importance: <span className="font-medium">{item.importance}</span>
                        </p>
                        <p className="text-sm text-zinc-400">
                          Time: <span className="font-medium">{item.timeAllocated} min</span>
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400">
                        {item.subtopic}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        Importance: <span className="font-medium">{item.importance}</span>
                      </p>
                      <p className="text-sm text-zinc-400">
                        Time: <span className="font-medium">{item.timeAllocated} min</span>
                      </p>
                      <p className="mt-3 text-zinc-500">No video found</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between flex-wrap gap-4">
            <span className="text-blue-400 font-semibold">
              ⏱ Total Time: {totalHours}h {remainingMinutes}m
            </span>
            <span className="text-blue-400 font-semibold">
              🎥 Videos: {plan.filter(p => p.videoUrl).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
