import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ProgressDashboard from './ProgressDashboard';

export default function Learning() {
  const [data, setData] = useState(null);
  const [completedVideos, setCompletedVideos] = useState(new Set());

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
                              <p>
                                Time: <span className="font-medium text-white">{it.timeAllocated || '—'} min</span>
                              </p>
                            </div>
                          </div>
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
