import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, RefreshCw, Edit2, Save } from "lucide-react";
import YouTubeEmbed from "./YouTubeEmbed";
import ProgressDashboard from "./ProgressDashboard";
import { Link } from "react-router-dom";

const MainPage = () => {
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [completedVideos, setCompletedVideos] = useState(new Set());
  const [user, setUser] = useState(null);
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [reloadingVideoIndex, setReloadingVideoIndex] = useState(null);
  const [editingTimeIndex, setEditingTimeIndex] = useState(null);
  const [editTimeValue, setEditTimeValue] = useState("");

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
      // Reset completed videos when generating new plan
      setCompletedVideos(new Set());
      localStorage.removeItem("completedVideos");
    } catch (err) {
      setError(err.response?.data?.error || "Network error");
    }

    setLoading(false);
  };

  // Load plan and progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("playlistData");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPlan(parsed);
        else if (parsed.plan) setPlan(parsed.plan);
      }
    } catch {}

    // Load completed videos
    try {
      const saved = localStorage.getItem("completedVideos");
      if (saved) {
        const completed = JSON.parse(saved);
        setCompletedVideos(new Set(completed));
      }
    } catch {}

    // Check if user is logged in
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch {}
  }, []);

  // Save completed videos to localStorage whenever it changes
  useEffect(() => {
    if (completedVideos.size > 0 || plan.length > 0) {
      localStorage.setItem("completedVideos", JSON.stringify(Array.from(completedVideos)));
    }
  }, [completedVideos, plan]);

  // Toggle video completion
  const toggleVideoCompletion = (videoUrl) => {
    setCompletedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoUrl)) {
        newSet.delete(videoUrl);
      } else {
        newSet.add(videoUrl);
      }
      return newSet;
    });
  };

  // Calculate progress stats
  const totalVideos = useMemo(() => {
    return plan.filter((item) => item.videoUrl).length;
  }, [plan]);

  const completedCount = useMemo(() => {
    return plan.filter((item) => item.videoUrl && completedVideos.has(item.videoUrl)).length;
  }, [plan, completedVideos]);

  // Save playlist to backend
  const handleSavePlaylist = async () => {
    if (!user) return;
    setSavingPlaylist(true);
    try {
      await axios.post(
        "http://localhost:5000/api/playlists",
        {
          topic: subject || "My Learning Plan",
          playlistData: plan,
        },
        { withCredentials: true }
      );
      alert("Playlist saved successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save playlist");
    } finally {
      setSavingPlaylist(false);
    }
  };

  // Reload video for a specific topic - cycles through video options
  const handleReloadVideo = async (index) => {
    const item = plan[index];
    if (!item || !item.subtopic) return;

    // If videoOptions exist, cycle through them
    if (item.videoOptions && item.videoOptions.length > 0) {
      const currentIndex = item.currentVideoIndex || 0;
      const nextIndex = (currentIndex + 1) % item.videoOptions.length; // Cycle through array
      const nextVideo = item.videoOptions[nextIndex];

      const updatedPlan = [...plan];
      updatedPlan[index] = {
        ...item,
        videoUrl: nextVideo.videoUrl,
        videoTitle: nextVideo.videoTitle,
        currentVideoIndex: nextIndex,
      };
      setPlan(updatedPlan);
      localStorage.setItem("playlistData", JSON.stringify(updatedPlan));
      return;
    }

    // If no videoOptions, fetch new ones
    setReloadingVideoIndex(index);
    try {
      const query = `${item.subtopic} explained in ${item.timeAllocated} minutes`;
      const res = await axios.post("http://localhost:5000/api/youtube/search", {
        query,
        maxDuration: item.timeAllocated,
      });

      const videos = res.data.videos || [];
      if (videos.length === 0) {
        alert("No videos found for this topic");
        return;
      }

      const updatedPlan = [...plan];
      const firstVideo = videos[0];
      updatedPlan[index] = {
        ...item,
        videoUrl: firstVideo.videoUrl,
        videoTitle: firstVideo.videoTitle,
        videoOptions: videos,
        currentVideoIndex: 0,
      };
      setPlan(updatedPlan);
      localStorage.setItem("playlistData", JSON.stringify(updatedPlan));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reload video");
    } finally {
      setReloadingVideoIndex(null);
    }
  };

  // Save time change for a specific topic - triggers new search
  const handleSaveTimeChange = async (index) => {
    const newTime = parseFloat(editTimeValue);
    if (isNaN(newTime) || newTime <= 0) {
      alert("Please enter a valid time (in minutes)");
      return;
    }

    const item = plan[index];
    if (!item || !item.subtopic) return;

    // Update time first
    const updatedPlan = [...plan];
    updatedPlan[index] = {
      ...plan[index],
      timeAllocated: newTime,
    };
    setPlan(updatedPlan);
    setEditingTimeIndex(null);
    setEditTimeValue("");

    // Trigger new search with new time constraint
    setReloadingVideoIndex(index);
    try {
      const query = `${item.subtopic} explained in ${newTime} minutes`;
      const res = await axios.post("http://localhost:5000/api/youtube/search", {
        query,
        maxDuration: newTime,
      });

      const videos = res.data.videos || [];
      if (videos.length > 0) {
        const firstVideo = videos[0];
        updatedPlan[index] = {
          ...item,
          timeAllocated: newTime,
          videoUrl: firstVideo.videoUrl,
          videoTitle: firstVideo.videoTitle,
          videoOptions: videos,
          currentVideoIndex: 0,
        };
        setPlan(updatedPlan);
        localStorage.setItem("playlistData", JSON.stringify(updatedPlan));
      } else {
        alert("No videos found for this topic with the new time constraint");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to search for videos with new time");
    } finally {
      setReloadingVideoIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white px-6 py-20">
      {/* Navigation Bar */}
      <nav className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <span className="text-blue-500">LearnTube</span> AI
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <Link
              to="/saved-playlists"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              Saved Playlists
            </Link>
          )}
        </div>
      </nav>
      
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              📘 AI-Generated Study Plan
            </h2>
            {user && (
              <button
                onClick={handleSavePlaylist}
                disabled={savingPlaylist}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={18} />
                {savingPlaylist ? "Saving..." : "Save Playlist"}
              </button>
            )}
          </div>

          {/* Progress Dashboard */}
          {totalVideos > 0 && (
            <div className="mb-8">
              <ProgressDashboard 
                totalVideos={totalVideos}
                completedVideos={completedCount}
              />
            </div>
          )}

          <div className="space-y-6">
            {plan.map((item, idx) => {
              const isCompleted = item.videoUrl && completedVideos.has(item.videoUrl);
              
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  className={`bg-zinc-900 border rounded-xl p-6 shadow transition-colors ${
                    isCompleted 
                      ? 'border-green-700/50 bg-green-900/10' 
                      : 'border-zinc-800'
                  }`}
                >
                  {item.videoUrl ? (
                    <div className="space-y-4">
                      {/* Video Info with Checkbox */}
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleVideoCompletion(item.videoUrl)}
                          className="flex-shrink-0 mt-1 transition-transform hover:scale-110"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" fill="currentColor" />
                          ) : (
                            <Circle className="w-6 h-6 text-zinc-500 hover:text-blue-500" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-3 ${
                            isCompleted ? 'text-green-400 line-through' : 'text-blue-400'
                          }`}>
                            {item.videoTitle}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-zinc-400 mb-4">
                            <p>
                              Topic: <span className="font-medium text-white">{item.subtopic}</span>
                            </p>
                            <p>
                              Importance: <span className="font-medium text-white">{item.importance}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              Time: {editingTimeIndex === idx ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editTimeValue}
                                    onChange={(e) => setEditTimeValue(e.target.value)}
                                    className="w-20 px-2 py-1 rounded bg-black border border-zinc-700 text-white text-sm"
                                    placeholder={item.timeAllocated}
                                    min="1"
                                  />
                                  <button
                                    onClick={() => handleSaveTimeChange(idx)}
                                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTimeIndex(null);
                                      setEditTimeValue("");
                                    }}
                                    className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="font-medium text-white flex items-center gap-2">
                                  {item.timeAllocated} min
                                  <button
                                    onClick={() => {
                                      setEditingTimeIndex(idx);
                                      setEditTimeValue(item.timeAllocated);
                                    }}
                                    className="text-blue-400 hover:text-blue-300"
                                    title="Edit time"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleReloadVideo(idx)}
                          disabled={reloadingVideoIndex === idx}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                          title="Reload video for this topic"
                        >
                          <RefreshCw size={16} className={reloadingVideoIndex === idx ? "animate-spin" : ""} />
                          {reloadingVideoIndex === idx ? "Loading..." : "Reload"}
                        </button>
                      </div>
                      {/* Embedded Video */}
                      <YouTubeEmbed 
                        videoUrl={item.videoUrl} 
                        videoTitle={item.videoTitle}
                        className="w-full"
                      />
                    </div>
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
