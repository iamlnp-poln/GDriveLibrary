
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GDriveLink, GDriveFile } from '../types';
import { Download, CheckCircle2, Circle, X, Grid, Share2, Check, FileArchive, Files, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from './Lightbox';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import Skeleton from './ui/Skeleton';
import { cn } from '../lib/utils';

interface GalleryProps {
  previewData?: {
    title: string;
    files?: GDriveFile[];
  };
}

type DownloadMode = 'individual' | 'zip';

const Gallery: React.FC<GalleryProps> = ({ previewData }) => {
  const params = useParams();
  const shortId = params?.shortId as string;
  
  const [linkData, setLinkData] = useState<GDriveLink | null>(null);
  const [files, setFiles] = useState<GDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('individual');

  useEffect(() => {
    if (previewData) {
      setLinkData({ title: previewData.title } as GDriveLink);
      const mockFiles: GDriveFile[] = previewData.files || Array.from({ length: 12 }).map((_, i) => ({
        id: `preview-file-${i}`,
        name: `Preview Photo ${i + 1}.jpg`,
        mimeType: 'image/jpeg',
        thumbnailLink: `https://picsum.photos/seed/preview-${i}/400/600`,
        webContentLink: `https://picsum.photos/seed/preview-${i}/1200/1800`,
        size: (Math.random() * 5000000 + 1000000).toString()
      }));
      setFiles(mockFiles);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchLinkAndFiles = async () => {
      if (!shortId) return;
      setLoading(true);
      try {
        const q = query(collection(db, "links"), where("shortId", "==", shortId), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError("Gallery not found.");
          setLoading(false);
          return;
        }
        
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as GDriveLink;
        setLinkData(data);

        const filesResponse = await fetch(`/api/folder/${data.folderId}`);
        if (!filesResponse.ok) {
          const errorData = await filesResponse.json();
          throw new Error(errorData.details || "Failed to fetch folder contents. Make sure the folder is shared with the service account.");
        }
        
        const driveFiles: GDriveFile[] = await filesResponse.json();
        
        const processedFiles = driveFiles.map(file => ({
          ...file,
          thumbnailLink: `/api/image/${file.id}`,
          webContentLink: `/api/image/${file.id}`
        }));
        
        setFiles(processedFiles);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Gallery load error:", err);
        setError(err.message || "Failed to load gallery.");
        setLoading(false);
      }
    };

    fetchLinkAndFiles();
  }, [shortId, previewData]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    const selectedFiles = files.filter(f => selectedIds.has(f.id));

    try {
      if (downloadMode === 'zip') {
        const zip = new JSZip();
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const response = await fetch(file.webContentLink!);
          const blob = await response.blob();
          zip.file(file.name, blob);
          setDownloadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
        const content = await zip.generateAsync({ type: "blob" });
        const saveAs = (FileSaver as any).saveAs || FileSaver;
        if (typeof saveAs === 'function') {
          saveAs(content, `${linkData?.title || 'gallery'}-photos.zip`);
        } else {
          const url = window.URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${linkData?.title || 'gallery'}-photos.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } else {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const link = document.createElement('a');
          link.href = file.webContentLink!;
          link.setAttribute('download', file.name);
          link.setAttribute('target', '_blank');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
          if (i < selectedFiles.length - 1) await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Error during download process.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleShare = () => {
    if (previewData) return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-12" />
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-full rounded-2xl" style={{ height: `${Math.random() * 200 + 200}px` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Access Denied or Error</h2>
        <p className="text-slate-500 dark:text-white/50 mb-8 leading-relaxed">{error}</p>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-left">
          <p className="font-bold mb-2">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Ensure the folder ID is correct.</li>
            <li>Share the folder with the service account email.</li>
            <li>Check if the service account has "Viewer" permissions.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">{linkData?.title}</h1>
          <p className="text-slate-400 dark:text-white/40 flex items-center gap-2">
            {files.length} Photos &bull; Poln by{' '}
            <a href="https://www.instagram.com/_iamlnp_/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4 font-medium">@_iamlnp_</a>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isSelectionMode && (
            <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/10">
              <button onClick={() => setDownloadMode('individual')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all", downloadMode === 'individual' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400")}><Files className="w-3.5 h-3.5" />Individual</button>
              <button onClick={() => setDownloadMode('zip')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all", downloadMode === 'zip' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400")}><FileArchive className="w-3.5 h-3.5" />Zip</button>
            </div>
          )}
          {!previewData && <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm font-medium text-slate-700 dark:text-white">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}{copied ? "Copied" : "Share"}</button>}
          <button onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds(new Set()); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium", isSelectionMode ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white" : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10")}>{isSelectionMode ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}{isSelectionMode ? `Selected (${selectedIds.size})` : "Select"}</button>
          {selectedIds.size > 0 && <button onClick={handleDownloadSelected} disabled={isDownloading} className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-slate-200 dark:shadow-none">{isDownloading ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />{downloadProgress}%</span> : <><Download className="w-4 h-4" />{downloadMode === 'zip' ? 'Download Zip' : 'Download All'}</>}</button>}
        </div>
      </div>
      {files.length === 0 ? <div className="py-40 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl"><p className="text-slate-400 dark:text-white/20 font-medium">This folder is empty or contains no images.</p></div> : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {files.map((file, index) => (
            <motion.div key={file.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative group cursor-pointer break-inside-avoid" onClick={() => { if (isSelectionMode) toggleSelect(file.id); else setActiveImageIndex(index); }}>
              <div className={cn("relative overflow-hidden rounded-2xl transition-all duration-500 shadow-sm", selectedIds.has(file.id) ? "ring-4 ring-slate-900 dark:ring-white scale-[0.98]" : "ring-0")}>
                <img src={file.thumbnailLink} alt={file.name} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className={cn("absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", isSelectionMode && "opacity-100 bg-black/20")}>
                  {isSelectionMode ? <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all", selectedIds.has(file.id) ? "bg-white border-white" : "border-white/50")}>{selectedIds.has(file.id) && <Check className="w-5 h-5 text-black" />}</div> : <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><Grid className="w-5 h-5 text-white" /></div>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>{activeImageIndex !== null && <Lightbox files={files} currentIndex={activeImageIndex} onClose={() => setActiveImageIndex(null)} onNext={() => setActiveImageIndex((activeImageIndex + 1) % files.length)} onPrev={() => setActiveImageIndex((activeImageIndex - 1 + files.length) % files.length)} />}</AnimatePresence>
    </div>
  );
};

export default Gallery;
