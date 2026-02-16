import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../src/context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition text-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 bg-white hover:bg-gray-100 border-gray-200 text-gray-800"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
