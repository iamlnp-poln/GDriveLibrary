
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, orderBy, where, getDocs } from 'firebase/firestore';
import { db, logout } from '../lib/firebase';
import { GDriveLink } from '../types';
import { slugify, cn } from '../lib/utils';
import { Plus, Trash2, ExternalLink, Copy, Check, LogOut, FolderOpen, Eye, X, Layout, AlertTriangle, Loader2, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Gallery from './Gallery';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [links, setLinks] = useState<GDriveLink[]>([]);
  const [title, setTitle] = useState("");
  const [shortId, setShortId] = useState("");
  const [folderId, setFolderId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isManualShortId, setIsManualShortId] = useState(false);

  // Modal & Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const SERVICE_ACCOUNT_EMAIL = "gdrive-gallery@gdrivelibra.iam.gserviceaccount.com";

  useEffect(() => {
    const q = query(collection(db, "links"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GDriveLink));
      setLinks(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isManualShortId) {
      setShortId(slugify(title));
    }
  }, [title, isManualShortId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const checkShortIdExists = async (sid: string) => {
    const q = query(collection(db, "links"), where("shortId", "==", sid));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !folderId || !shortId) return;

    setIsProcessing(true);
    try {
      const finalShortId = slugify(shortId);
      const exists = await checkShortIdExists(finalShortId);
      if (exists) {
        setNotification({ type: 'error', message: `Short ID "${finalShortId}" already exists.` });
        setIsProcessing(false);
        return;
      }

      let cleanFolderId = folderId;
      if (folderId.includes("drive.google.com")) {
        const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match) cleanFolderId = match[1];
      }

      await addDoc(collection(db, "links"), {
        title,
        folderId: cleanFolderId,
        shortId: finalShortId,
        createdAt: Date.now()
      });

      setTitle("");
      setShortId("");
      setFolderId("");
      setIsManualShortId(false);
      setNotification({ type: 'success', message: 'Gallery link created successfully!' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to create link.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "links", deleteId));
      setNotification({ type: 'success', message: 'Link deleted successfully.' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to delete link.' });
    } finally {
      setIsProcessing(false);
      setDeleteId(null);
    }
  };

  const copyLink = (sId: string) => {
    const url = `${window.location.origin}/#/s/${sId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyServiceEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setNotification({ type: 'success', message: 'Service email copied!' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              "fixed top-24 left-1/2 z-[100] px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border",
              notification.type === 'success' 
                ? "bg-green-500 text-white border-green-600" 
                : "bg-red-500 text-white border-red-600"
            )}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-slate-900 dark:text-white animate-spin" />
              <p className="text-slate-900 dark:text-white font-medium">Processing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-4 mb-6 text-red-500">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Link?</h3>
              </div>
              <p className="text-slate-500 dark:text-white/60 mb-8">
                Are you sure you want to delete this gallery link? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-white/50">Manage your shared galleries &bull; @_iamlnp_</p>
        </div>
        <button onClick={() => logout()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors" title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Critical Instruction Box */}
      <div className="mb-12 p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 mb-1">Important: Share your GDrive Folder</h3>
          <p className="text-amber-800/70 dark:text-amber-400/60 text-sm leading-relaxed">
            For the gallery to load real images, you <strong>must</strong> share your Google Drive folder with the service account email below as a <strong>Viewer</strong>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="bg-white/50 dark:bg-black/30 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              {SERVICE_ACCOUNT_EMAIL}
            </code>
            <button onClick={copyServiceEmail} className="p-1.5 hover:bg-amber-500/10 rounded-lg text-amber-700 dark:text-amber-400 transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 sticky top-24 shadow-sm dark:shadow-none">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Plus className="w-5 h-5" />
              Create New Link
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5 ml-1">Gallery Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Persona Albume" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5 ml-1">Short ID (Editable)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/30 text-sm">/s/</span>
                  <input type="text" value={shortId} onChange={(e) => { setShortId(e.target.value); setIsManualShortId(true); }} placeholder="persona-albume" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors text-slate-900 dark:text-white text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5 ml-1">Folder ID or URL</label>
                <input type="text" value={folderId} onChange={(e) => setFolderId(e.target.value)} placeholder="Google Drive Folder ID" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors text-slate-900 dark:text-white" required />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowPreview(true)} className="flex-1 py-3 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"><Eye className="w-4 h-4" />Preview</button>
                <button type="submit" disabled={isProcessing} className="flex-[2] py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-slate-200 dark:shadow-none">{isProcessing ? "Creating..." : "Generate Link"}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {links.map((link) => (
                <motion.div key={link.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shadow-sm dark:shadow-none"><FolderOpen className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{link.title}</h3>
                      <p className="text-sm text-slate-400 dark:text-white/40">/s/{link.shortId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(link.shortId)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors" title="Copy Link">{copiedId === link.shortId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}</button>
                    <a href={`#/s/${link.shortId}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
                    <button onClick={() => handleDeleteClick(link.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 dark:text-white/40 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {links.length === 0 && <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl"><p className="text-slate-300 dark:text-white/20">No links created yet.</p></div>}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
              <div className="flex items-center gap-3"><Layout className="w-5 h-5 text-slate-400 dark:text-white/40" /><span className="font-bold text-slate-900 dark:text-white">Live Preview</span></div>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-900 dark:text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0a0a0a]">
              <Gallery previewData={{ title: title || "Untitled Gallery" }} />
              <div className="max-w-5xl mx-auto pb-20 px-4"><div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5 text-center"><p className="text-slate-300 dark:text-white/20 font-medium">This is a live preview of how your gallery will look to guests.</p></div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
