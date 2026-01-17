import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react';

/**
 * Progress Dashboard Component
 * Shows completion statistics for the learning plan
 */
const ProgressDashboard = ({ totalVideos, completedVideos, className = "" }) => {
  const remainingVideos = totalVideos - completedVideos;
  const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-white">Learning Progress</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Total Videos */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">Total Videos</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalVideos}</p>
        </div>

        {/* Completed Videos */}
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{completedVideos}</p>
        </div>

        {/* Remaining Videos */}
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Remaining</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{remainingVideos}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-400">Progress</span>
          <span className="text-sm font-semibold text-white">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressDashboard;
