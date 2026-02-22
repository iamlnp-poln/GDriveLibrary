
import React from 'react';

export default function Footer() {
  return (
    <footer className="py-12 border-t border-slate-100 dark:border-white/5 text-center text-slate-400 dark:text-white/30 text-sm">
      <p>
        Project GDrive Library &bull; Poln by{' '}
        <a 
          href="https://www.instagram.com/_iamlnp_/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4 font-medium"
        >
          @_iamlnp_
        </a>
      </p>
    </footer>
  );
}
