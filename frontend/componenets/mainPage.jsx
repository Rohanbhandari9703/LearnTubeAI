import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, RefreshCw, Edit2, Save, Clock, Sparkles } from "lucide-react";
import YouTubeEmbed from "./YouTubeEmbed";
import ProgressDashboard from "./ProgressDashboard";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

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
  const [showSubtopics, setShowSubtopics] = useState(false);
  const [customSubtopics, setCustomSubtopics] = useState("");
  const [language, setLanguage] = useState("en");

  const totalDurationInMinutes = useMemo(() => {
    return plan.reduce((sum, item) => sum + (item.duration || 0), 0);
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
      const subtopicsList = customSubtopics ? customSubtopics.split(",").map(s => s.trim()).filter(s => s !== "") : [];
      const res = await axios.post("http://localhost:5000/api/chat", {
        input: subject,
        totalMinutes: Number(time) * 60,
        subtopics: subtopicsList,
        language: language
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
    } catch { }

    // Load completed videos
    try {
      const saved = localStorage.getItem("completedVideos");
      if (saved) {
        const completed = JSON.parse(saved);
        setCompletedVideos(new Set(completed));
      }
    } catch { }

    // Check if user is logged in
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch { }
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
        duration: nextVideo.duration,
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
        duration: firstVideo.duration,
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
          duration: firstVideo.duration,
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
    <div className="min-h-screen bg-gray-50 dark:bg-black text-zinc-900 dark:text-white px-6 py-20 transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="max-w-6xl mx-auto mb-16 flex justify-between items-center px-4">
        <Link to="/home" className="text-3xl font-black hover:opacity-80 transition tracking-tight">
          <span className="text-blue-500">LearnTube</span> AI
        </Link>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          {user && (
            <Link
              to="/saved-playlists"
              className="px-5 py-2.5 rounded-2xl glass font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition shadow-sm"
            >
              My Library
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
          Design Your <span className="text-blue-500">Learning Path</span>
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto font-medium">
          Tell us your goals. We'll build the perfect roadmap for you.
        </p>
      </motion.div>

      {/* Input Card */}
      <div className="max-w-3xl mx-auto glass rounded-[2.5rem] p-10 shadow-2xl border border-white/20 dark:border-white/5 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Subject</label>
            <input
              type="text"
              placeholder="e.g. React, calculus..."
              className="w-full px-6 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 ring-blue-500/10 transition-all font-medium text-lg"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Available Time</label>
            <div className="relative">
              <input
                type="number"
                placeholder="Hours"
                className="w-full px-6 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium text-lg"
                min={1}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">Hours</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-end">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Search Language</label>
            <select
              className="w-full px-6 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white appearance-none font-medium text-lg"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English (US)</option>
              <option value="hi">Hindi (IN)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="ru">Russian</option>
            </select>
          </div>
          <button
            onClick={() => setShowSubtopics(!showSubtopics)}
            className={`py-3.5 rounded-2xl border-2 border-dotted transition-all font-semibold flex items-center justify-center gap-2 ${showSubtopics ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
          >
            <Edit2 size={16} />
            {showSubtopics ? "Auto Subtopics" : "Custom Subtopics"}
          </button>
        </div>

        {showSubtopics && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-1"
          >
            <label className="block text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Specific Subtopics</label>
            <textarea
              placeholder="Topic 1, Topic 2, Topic 3..."
              className="w-full px-6 py-4 rounded-2xl bg-zinc-50/50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white min-h-[120px] font-medium transition-all"
              value={customSubtopics}
              onChange={(e) => setCustomSubtopics(e.target.value)}
            />
          </motion.div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-xl shadow-blue-500/20 font-black text-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={24} />
              <span>Planning Session...</span>
            </>
          ) : (
            "Build My Study Plan"
          )}
        </button>

        {formError && <p className="text-red-500 bg-red-500/10 py-3 px-4 rounded-xl text-center font-medium border border-red-500/20">{formError}</p>}
        {error && <p className="text-red-500 bg-red-500/10 py-3 px-4 rounded-xl text-center font-medium border border-red-500/20">{error}</p>}
      </div>

      {/* Plan Section */}
      {plan.length > 0 && (
        <div className="max-w-5xl mx-auto mt-24">
          <div className="flex flex-wrap justify-between items-end gap-6 mb-12 px-2">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-2">
                Your Curriculum
              </h2>
              <p className="text-zinc-500 font-medium">Follow this step-by-step path to mastery.</p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <button
                  onClick={handleSavePlaylist}
                  disabled={savingPlaylist}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                >
                  <Save size={20} />
                  {savingPlaylist ? "Syncing..." : "Save Library"}
                </button>
              )}
            </div>
          </div>

          {/* Progress Dashboard */}
          {totalVideos > 0 && (
            <div className="mb-16">
              <ProgressDashboard
                totalVideos={totalVideos}
                completedVideos={completedCount}
              />
            </div>
          )}

          <div className="space-y-10 relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-zinc-200 dark:via-zinc-800 to-transparent hidden md:block" />

            {plan.map((item, idx) => {
              const isCompleted = item.videoUrl && completedVideos.has(item.videoUrl);

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-0 md:pl-20"
                >
                  {/* Timeline Node */}
                  <div className={`absolute left-6 top-10 w-4 h-4 rounded-full border-4 hidden md:block z-10 transition-all duration-500 ${isCompleted ? 'bg-green-500 border-green-500/20 scale-125' : 'bg-white dark:bg-zinc-900 border-blue-500'
                    }`} />

                  <div className={`glass rounded-[2.5rem] p-8 md:p-10 shadow-2xl transition-all duration-500 hover:shadow-blue-500/10 border ${isCompleted
                    ? 'border-green-500/30 bg-green-500/[0.02]'
                    : 'border-white/20 dark:border-white/5'
                    }`}>
                    {item.videoUrl ? (
                      <div className="space-y-8">
                        {/* Video Info Header */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                          <div className="flex gap-6 items-start flex-1 min-w-[280px]">
                            <button
                              onClick={() => toggleVideoCompletion(item.videoUrl)}
                              className="flex-shrink-0 mt-1 transition-all hover:scale-110 active:scale-90"
                            >
                              {isCompleted ? (
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                  <CheckCircle2 size={24} />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
                                  <Circle size={24} />
                                </div>
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.importance === 'high' ? 'bg-red-500/10 text-red-500' :
                                  item.importance === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-blue-500/10 text-blue-500'
                                  }`}>
                                  {item.importance} Priority
                                </span>
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{item.subtopic}</span>
                              </div>
                              <h3 className={`text-2xl md:text-3xl font-black leading-tight transition-all ${isCompleted ? 'opacity-50 line-through' : 'text-zinc-900 dark:text-white'
                                }`}>
                                {item.videoTitle}
                              </h3>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                              {editingTimeIndex === idx ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editTimeValue}
                                    onChange={(e) => setEditTimeValue(e.target.value)}
                                    className="w-16 bg-transparent border-b border-blue-500 focus:outline-none font-bold text-center"
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveTimeChange(idx)} className="text-blue-500 hover:text-blue-600 font-bold text-xs uppercase">Save</button>
                                </div>
                              ) : (
                                <>
                                  <Clock size={16} className="text-blue-500" />
                                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.timeAllocated} min</span>
                                  <button
                                    onClick={() => { setEditingTimeIndex(idx); setEditTimeValue(item.timeAllocated); }}
                                    className="text-zinc-400 hover:text-blue-500 transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => handleReloadVideo(idx)}
                              disabled={reloadingVideoIndex === idx}
                              className="p-4 rounded-2xl glass hover:bg-white dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 transition-all disabled:opacity-50 text-blue-500 group"
                              title="Shuffle Video"
                            >
                              <RefreshCw size={20} className={`${reloadingVideoIndex === idx ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                            </button>
                          </div>
                        </div>

                        {/* Video Player */}
                        <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-blue-500/10 border border-white/10">
                          <YouTubeEmbed
                            videoUrl={item.videoUrl}
                            videoTitle={item.videoTitle}
                            className="w-full aspect-video"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                          <Circle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-400">Video coming soon</h3>
                        <p className="text-zinc-500 mt-1">{item.subtopic}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Combined Summary & Navigation */}
          <div className="mt-20 glass rounded-[2.5rem] p-10 flex flex-wrap justify-between items-center gap-8 border border-white/20 dark:border-white/5">
            <div className="flex gap-10">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Effort</span>
                <span className="text-2xl font-black text-blue-500">{totalHours}h {remainingMinutes}m</span>
              </div>
              <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-10">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Topic Coverage</span>
                <span className="text-2xl font-black text-blue-500">{plan.length} Modules</span>
              </div>
            </div>
            <Link
              to="/home"
              className="px-8 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
            >
              Start New Topic
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
