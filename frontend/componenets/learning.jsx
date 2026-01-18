import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, RefreshCw, Edit2 } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ProgressDashboard from './ProgressDashboard';
import axios from 'axios';

export default function Learning() {
  const [data, setData] = useState(null);
  const [completedVideos, setCompletedVideos] = useState(new Set());
  const [reloadingVideoIndex, setReloadingVideoIndex] = useState(null);
  const [editingTimeIndex, setEditingTimeIndex] = useState(null);
  const [editTimeValue, setEditTimeValue] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem('playlistData');
      if (saved) setData(JSON.parse(saved));
    } catch (e) {
      setData(null);
    }

    // Load completed videos
    try {
      const saved = localStorage.getItem('completedVideos');
      if (saved) {
        const completed = JSON.parse(saved);
        setCompletedVideos(new Set(completed));
      }
    } catch {}
  }, []);

  // Save completed videos to localStorage whenever it changes
  useEffect(() => {
    if (completedVideos.size > 0) {
      localStorage.setItem('completedVideos', JSON.stringify(Array.from(completedVideos)));
    }
  }, [completedVideos]);

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

  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-8 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-zinc-400">No learning data found.</p>
        <p className="text-zinc-500 mt-2">Generate a playlist first.</p>
      </div>
    </div>
  );

  const items = Array.isArray(data) ? data : data.plan || [];

  // Calculate progress stats
  const totalVideos = useMemo(() => {
    return items.filter((item) => item.videoUrl).length;
  }, [items]);

  const completedCount = useMemo(() => {
    return items.filter((item) => item.videoUrl && completedVideos.has(item.videoUrl)).length;
  }, [items, completedVideos]);

  // Reload video for a specific topic - cycles through video options
  const handleReloadVideo = async (index) => {
    const item = items[index];
    if (!item || !item.subtopic) return;

    // If videoOptions exist, cycle through them
    if (item.videoOptions && item.videoOptions.length > 0) {
      const currentIndex = item.currentVideoIndex || 0;
      const nextIndex = (currentIndex + 1) % item.videoOptions.length; // Cycle through array
      const nextVideo = item.videoOptions[nextIndex];

      const updatedItems = [...items];
      updatedItems[index] = {
        ...item,
        videoUrl: nextVideo.videoUrl,
        videoTitle: nextVideo.videoTitle,
        currentVideoIndex: nextIndex,
      };
      
      const updatedData = Array.isArray(data) ? updatedItems : { ...data, plan: updatedItems };
      setData(updatedData);
      localStorage.setItem("playlistData", JSON.stringify(updatedData));
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

      const updatedItems = [...items];
      const firstVideo = videos[0];
      updatedItems[index] = {
        ...item,
        videoUrl: firstVideo.videoUrl,
        videoTitle: firstVideo.videoTitle,
        videoOptions: videos,
        currentVideoIndex: 0,
      };
      
      const updatedData = Array.isArray(data) ? updatedItems : { ...data, plan: updatedItems };
      setData(updatedData);
      localStorage.setItem("playlistData", JSON.stringify(updatedData));
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

    const item = items[index];
    if (!item || !item.subtopic) return;

    // Update time first
    const updatedItems = [...items];
    updatedItems[index] = {
      ...items[index],
      timeAllocated: newTime,
    };

    const updatedData = Array.isArray(data) ? updatedItems : { ...data, plan: updatedItems };
    setData(updatedData);
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
        updatedItems[index] = {
          ...item,
          timeAllocated: newTime,
          videoUrl: firstVideo.videoUrl,
          videoTitle: firstVideo.videoTitle,
          videoOptions: videos,
          currentVideoIndex: 0,
        };

        const finalData = Array.isArray(data) ? updatedItems : { ...data, plan: updatedItems };
        setData(finalData);
        localStorage.setItem("playlistData", JSON.stringify(finalData));
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
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold mb-8 text-center"
        >
          Your <span className="text-blue-500">Learning Session</span>
        </motion.h1>
        
        {items.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            No items in the playlist.
          </div>
        ) : (
          <>
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
              {items.map((it, i) => {
                const isCompleted = it.videoUrl && completedVideos.has(it.videoUrl);
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-zinc-900 border rounded-xl p-6 shadow-lg transition-colors ${
                      isCompleted 
                        ? 'border-green-700/50 bg-green-900/10' 
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Video Info with Checkbox */}
                      {it.videoUrl ? (
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleVideoCompletion(it.videoUrl)}
                            className="flex-shrink-0 mt-1 transition-transform hover:scale-110"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" fill="currentColor" />
                            ) : (
                              <Circle className="w-6 h-6 text-zinc-500 hover:text-blue-500" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h2 className={`text-xl font-semibold mb-3 ${
                              isCompleted ? 'text-green-400 line-through' : 'text-blue-400'
                            }`}>
                              {it.videoTitle || it.subtopic || it.title || `Lesson ${i + 1}`}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-zinc-400 mb-4">
                              {it.subtopic && (
                                <p>
                                  Topic: <span className="font-medium text-white">{it.subtopic}</span>
                                </p>
                              )}
                              {it.importance && (
                                <p>
                                  Importance: <span className="font-medium text-white">{it.importance}</span>
                                </p>
                              )}
                              <p className="flex items-center gap-2">
                                Time: {editingTimeIndex === i ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={editTimeValue}
                                      onChange={(e) => setEditTimeValue(e.target.value)}
                                      className="w-20 px-2 py-1 rounded bg-black border border-zinc-700 text-white text-sm"
                                      placeholder={it.timeAllocated || '0'}
                                      min="1"
                                    />
                                    <button
                                      onClick={() => handleSaveTimeChange(i)}
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
                                    {it.timeAllocated || '—'} min
                                    <button
                                      onClick={() => {
                                        setEditingTimeIndex(i);
                                        setEditTimeValue(it.timeAllocated || '');
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
                            onClick={() => handleReloadVideo(i)}
                            disabled={reloadingVideoIndex === i}
                            className="flex-shrink-0 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                            title="Reload video for this topic"
                          >
                            <RefreshCw size={16} className={reloadingVideoIndex === i ? "animate-spin" : ""} />
                            {reloadingVideoIndex === i ? "Loading..." : "Reload"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-xl font-semibold text-blue-400 mb-3">
                            {it.subtopic || it.title || `Lesson ${i + 1}`}
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-zinc-400 mb-4">
                            {it.importance && (
                              <p>
                                Importance: <span className="font-medium text-white">{it.importance}</span>
                              </p>
                            )}
                            <p>
                              Time: <span className="font-medium text-white">{it.timeAllocated || '—'} min</span>
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Embedded Video */}
                      {it.videoUrl ? (
                        <YouTubeEmbed 
                          videoUrl={it.videoUrl} 
                          videoTitle={it.videoTitle || it.subtopic}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-zinc-500 text-center py-8 border border-zinc-800 rounded-lg">
                          No video available for this lesson
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
