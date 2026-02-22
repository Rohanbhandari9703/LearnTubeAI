import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../src/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-12 h-12 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:border-blue-500/50 text-blue-500 shadow-xl shadow-blue-500/5"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={theme}
                    initial={{ y: 20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                >
                    {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}
