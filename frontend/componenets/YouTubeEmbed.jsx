import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';

/**
 * Extracts YouTube video ID from various URL formats
 */
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Gets YouTube thumbnail URL
 */
const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
};

/**
 * YouTube Video Embed Component
 * Shows a small thumbnail by default that expands to an embedded video player when clicked
 */
const YouTubeEmbed = ({ videoUrl, videoTitle, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const videoId = getYouTubeVideoId(videoUrl);
  const thumbnail = getYouTubeThumbnail(videoUrl);

  if (!videoId) {
    return (
      <div className={`text-zinc-400 ${className}`}>
        Invalid YouTube URL
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className={className}>
      {!isExpanded ? (
        // Thumbnail view - click to play
        <div
          onClick={() => setIsExpanded(true)}
          className="relative cursor-pointer group rounded-2xl overflow-hidden max-w-3xl mx-auto"
        >
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={videoTitle || 'YouTube video'}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-zinc-800 flex items-center justify-center">
                <Play className="w-12 h-12 text-blue-500" />
              </div>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors duration-300">
              <div className="bg-blue-600/90 backdrop-blur-sm rounded-full p-4 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-blue-500/30">
                <Play className="w-6 h-6 text-white" fill="white" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Expanded video player view
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-3xl mx-auto"
          >
            <div className="relative w-full rounded-2xl overflow-hidden bg-black">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  title={videoTitle || 'YouTube video player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-3 flex items-center gap-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors text-sm mx-auto"
            >
              <X className="w-4 h-4" />
              <span>Minimize video</span>
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default YouTubeEmbed;
export { getYouTubeVideoId, getYouTubeThumbnail };
