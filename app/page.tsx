
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter text-slate-900 dark:text-white">
          Poln's Gallery <br />
          <span className="text-slate-300 dark:text-white/40">by @_iamlnp_</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-white/50 mb-8 max-w-md mx-auto">
          Securely share Google Drive folders with beautiful, minimalist galleries. No login required for guests.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/admin" 
            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
          >
            Get Started
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
