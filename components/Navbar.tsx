
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useAuth } from './Providers';
import { ADMIN_UID } from '../lib/firebase';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full" />;

  const isDark = theme === 'dark';

  return (
    <button 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full p-1 transition-colors duration-300 focus:outline-none group"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-4 h-4 bg-white dark:bg-white rounded-full shadow-sm flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="w-2.5 h-2.5 text-slate-900" />
        ) : (
          <Sun className="w-2.5 h-2.5 text-amber-500" />
        )}
      </motion.div>
    </button>
  );
};

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 flex items-center">
            <img 
              src="/assets/poln_logo.png" 
              alt="GDrive Library Logo" 
              className="h-full w-auto object-contain transition-all"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.fallback-text')) {
                  const span = document.createElement('span');
                  span.className = 'fallback-text font-bold text-lg tracking-tight text-slate-900 dark:text-white';
                  span.innerText = 'GDrive Library';
                  parent.appendChild(span);
                }
              }}
            />
          </div>
        </Link>
        
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-4">
            {user?.uid === ADMIN_UID ? (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            ) : (
              <Link 
                href="/admin" 
                className="text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
