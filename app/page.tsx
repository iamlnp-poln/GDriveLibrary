
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, ADMIN_UID, loginWithEmail, loginWithGoogle, logout } from './lib/firebase';
import AdminDashboard from './components/AdminDashboard';
import Gallery from './components/Gallery';
import { LogIn, ShieldCheck, Mail, Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
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

const Navbar = ({ user }: { user: User | null }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-colors">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="h-10 flex items-center">
          <img 
            src="/assets/poln_logo.png" 
            alt="GDrive Library Logo" 
            className="h-full w-auto object-contain dark:invert-0 invert transition-all"
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
              to="/admin" 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          ) : (
            <Link 
              to="/admin" 
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

const Footer = () => (
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

const Home = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter text-slate-900 dark:text-white">
        Your Private <br />
        <span className="text-slate-300 dark:text-white/40">Photo Library.</span>
      </h1>
      <p className="text-lg text-slate-500 dark:text-white/50 mb-8 max-w-md mx-auto">
        Securely share Google Drive folders with beautiful, minimalist galleries. No login required for guests.
      </p>
      <div className="flex gap-4 justify-center">
        <Link 
          to="/admin" 
          className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
        >
          Get Started
        </Link>
      </div>
    </motion.div>
  </div>
);

const AdminLogin = () => {
  const [error, setError] = useState("");
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const u = await loginWithGoogle();
      if (u.uid !== ADMIN_UID) {
        setError("Access Denied: You are not the authorized admin.");
        await logout();
      }
    } catch (err) {
      setError("Failed to login with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const u = await loginWithEmail(email, password);
      if (u.uid !== ADMIN_UID) {
        setError("Access Denied: You are not the authorized admin.");
        await logout();
      }
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center shadow-xl shadow-slate-100 dark:shadow-none"
      >
        <ShieldCheck className="w-12 h-12 mx-auto mb-6 text-slate-300 dark:text-white/40" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Admin Access</h2>
        <p className="text-slate-500 dark:text-white/50 mb-8">Sign in to manage your library.</p>
        
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isEmailMode ? (
            <motion.div
              key="google"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-200 dark:shadow-none"
              >
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </button>
              <button 
                onClick={() => setIsEmailMode(true)}
                className="text-sm text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                Or use email & password
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailLogin}
              className="space-y-4 text-left"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-white/30" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors text-slate-900 dark:text-white"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-white/30" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors text-slate-900 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-200 dark:shadow-none"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => setIsEmailMode(false)}
                className="w-full text-center text-sm text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                Back to Google Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/20 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white selection:bg-slate-900 dark:selection:bg-white selection:text-white dark:selection:text-black transition-colors duration-300">
        <Navbar user={user} />
        <main className="pt-16 min-h-[calc(100vh-64px)]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/admin" 
              element={user?.uid === ADMIN_UID ? <AdminDashboard user={user} /> : <AdminLogin />} 
            />
            <Route path="/s/:shortId" element={<Gallery />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
