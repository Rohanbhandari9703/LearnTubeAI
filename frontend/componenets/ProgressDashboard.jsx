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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-[2rem] p-8 shadow-2xl shadow-blue-500/5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold dark:text-white">Learning Momentum</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Videos */}
        <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-700/30 transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Circle className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Units</span>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{totalVideos}</p>
        </div>

        {/* Completed Videos */}
        <div className="bg-green-500/5 dark:bg-green-500/10 rounded-2xl p-5 border border-green-500/20 transition-all hover:bg-green-500/10">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Mastered</span>
          </div>
          <p className="text-3xl font-black text-green-600 dark:text-green-400">{completedVideos}</p>
        </div>

        {/* Remaining Videos */}
        <div className="bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 transition-all hover:bg-blue-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Circle className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">To Go</span>
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{remainingVideos}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-end mb-3">
          <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Mastery Level</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-4 overflow-hidden p-1 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 rounded-full shadow-lg shadow-blue-500/30"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressDashboard;
