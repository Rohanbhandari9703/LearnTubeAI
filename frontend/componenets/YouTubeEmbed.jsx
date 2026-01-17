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
        // Compact thumbnail view - click to expand
        <div
          onClick={() => setIsExpanded(true)}
          className="relative cursor-pointer group rounded-lg overflow-hidden"
        >
          <div className="flex gap-3 items-center">
            {/* Small thumbnail */}
            <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={videoTitle || 'YouTube video'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Play className="w-8 h-8 text-blue-500" />
                </div>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                <div className="bg-blue-600 rounded-full p-2 group-hover:bg-blue-700 transition-colors">
                  <Play className="w-4 h-4 text-white" fill="white" />
                </div>
              </div>
            </div>
            {/* Video title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">
                {videoTitle || 'Click to play video'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Click to expand and play</p>
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
            className="relative"
          >
            <div className="relative w-full rounded-lg overflow-hidden bg-black">
              <div className="relative" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
                <iframe
                  src={embedUrl}
                  title={videoTitle || 'YouTube video player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                />
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-3 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
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
