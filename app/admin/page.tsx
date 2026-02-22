
'use client';

import React, { useState } from 'react';
import { useAuth } from '../../components/Providers';
import { ADMIN_UID, loginWithEmail, loginWithGoogle, logout } from '../../lib/firebase';
import AdminDashboard from '../../components/AdminDashboard';
import { ShieldCheck, LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/20 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return user?.uid === ADMIN_UID ? <AdminDashboard user={user} /> : <AdminLogin />;
}
