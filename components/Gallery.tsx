'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GDriveLink, GDriveFile } from '../types';
import { Download, CheckCircle2, Circle, X, Grid, Share2, Check, FileArchive, ShieldAlert, Heart, FileText } from 'lucide-react';
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
  isPickingMode?: boolean;
}

const MOCK_HEIGHTS = [320, 450, 280, 500, 350, 400, 300, 480, 380, 420, 290, 460];

interface GalleryItemProps {
  file: GDriveFile;
  index: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  isPickingMode: boolean;
  isPicked: boolean;
  onToggleSelect: (id: string) => void;
  onTogglePick: (id: string, e?: React.MouseEvent) => void;
  onOpenLightbox: (index: number) => void;
}

const GalleryItem = React.memo(({ 
  file, 
  index, 
  isSelectionMode, 
  isSelected, 
  isPickingMode, 
  isPicked, 
  onToggleSelect, 
  onTogglePick, 
  onOpenLightbox 
}: GalleryItemProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const height = MOCK_HEIGHTS[index % MOCK_HEIGHTS.length];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.01, 0.5) }}
      className="relative group cursor-pointer break-inside-avoid mb-4"
      onClick={() => {
        if (isSelectionMode) onToggleSelect(file.id);
        else onOpenLightbox(index);
      }}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-500 shadow-sm bg-slate-100 dark:bg-white/5",
        isSelected ? "ring-4 ring-slate-900 dark:ring-white scale-[0.98]" : "ring-0"
      )}
      style={{ minHeight: !isLoaded ? `${height}px` : 'auto' }}
      >
        {!isLoaded && <div className="absolute inset-0 z-0"><Skeleton className="w-full h-full rounded-2xl" /></div>}

        <img 
          src={file.thumbnailLink} 
          alt={file.name}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-auto object-cover transition-all duration-700 group-hover:scale-110",
            isLoaded ? "opacity-100" : "opacity-0",
            isPickingMode && "pointer-events-none select-none"
          )}
          onContextMenu={(e) => isPickingMode && e.preventDefault()}
          loading="lazy"
        />

        {/* Filename Overlay - Luôn hiển thị để tối ưu cảm ứng */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-20",
          isLoaded ? "opacity-100" : "opacity-0"
        )}>
          <p className="text-white text-[10px] font-medium truncate drop-shadow-md">
            {file.name}
          </p>
        </div>

        {isPickingMode && isLoaded && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-10 select-none overflow-hidden">
            <div className="rotate-[-45deg] text-slate-900 dark:text-white font-bold text-xl whitespace-nowrap tracking-[0.5em] uppercase">
              Poln by @_iamlnp_
            </div>
          </div>
        )}
        
        {/* Interaction Layer - Luôn hiển thị nút để tối ưu cảm ứng */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300 z-30 opacity-100",
          (isSelected || isPicked) ? "bg-black/10" : "bg-transparent"
        )}>
          {isSelectionMode ? (
            <div className="absolute top-3 right-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-lg backdrop-blur-md",
                isSelected ? "bg-white border-white text-black" : "bg-black/20 border-white/50 text-white"
              )}>
                {isSelected ? <Check className="w-5 h-5" /> : <Circle className="w-4 h-4 opacity-50" />}
              </div>
            </div>
          ) : isPickingMode ? (
            <button 
              onClick={(e) => onTogglePick(file.id, e)}
              className={cn(
                "absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all transform active:scale-90 shadow-lg z-40",
                isPicked ? "bg-red-500 text-white" : "bg-black/20 text-white border border-white/30"
              )}
            >
              <Heart className={cn("w-5 h-5", isPicked && "fill-current")} />
            </button>
          ) : (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                <Grid className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

GalleryItem.displayName = 'GalleryItem';

const Gallery: React.FC<GalleryProps> = ({ previewData, isPickingMode: propIsPickingMode }) => {
  const params = useParams();
  const shortId = params?.shortId as string;
  
  const [linkData, setLinkData] = useState<GDriveLink | null>(null);
  const [files, setFiles] = useState<GDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const isPickingMode = propIsPickingMode ?? linkData?.isPickingMode ?? false;

  useEffect(() => {
    if (shortId) {
      const saved = localStorage.getItem(`picked_${shortId}`);
      if (saved) setPickedIds(new Set(JSON.parse(saved)));
    }
  }, [shortId]);

  useEffect(() => {
    if (shortId && pickedIds.size > 0) {
      localStorage.setItem(`picked_${shortId}`, JSON.stringify(Array.from(pickedIds)));
    } else if (shortId && pickedIds.size === 0) {
      localStorage.removeItem(`picked_${shortId}`);
    }
  }, [pickedIds, shortId]);

  useEffect(() => {
    if (previewData) {
      setLinkData({ title: previewData.title, isPickingMode: propIsPickingMode } as GDriveLink);
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
        if (!filesResponse.ok) throw new Error("Failed to fetch folder contents.");
        
        const driveFiles: GDriveFile[] = await filesResponse.json();
        
        const processedFiles = driveFiles.map(file => {
          const baseGoogleUrl = file.thumbnailLink?.replace(/=s\d+$/, '');
          return {
            ...file,
            thumbnailLink: `${baseGoogleUrl}=s1000`,
            webContentLink: data.isPickingMode ? `${baseGoogleUrl}=s1600` : `${baseGoogleUrl}=s0`
          };
        });
        
        setFiles(processedFiles);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load gallery.");
        setLoading(false);
      }
    };

    fetchLinkAndFiles();
  }, [shortId, previewData, propIsPickingMode]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const togglePick = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPickedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const exportPickedList = () => {
    const pickedFiles = files.filter(f => pickedIds.has(f.id));
    const content = pickedFiles.map(f => f.name).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    FileSaver.saveAs(blob, `${linkData?.title || 'picked'}-list.txt`);
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    try {
      const zip = new JSZip();
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const response = await fetch(`/api/image/${file.id}`);
        const blob = await response.blob();
        zip.file(file.name, blob);
        setDownloadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      const content = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(content, `${linkData?.title || 'gallery'}-photos.zip`);
    } catch (err) {
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
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5 }} className="mb-4">
              <Skeleton className="w-full rounded-2xl" style={{ height: `${MOCK_HEIGHTS[i % MOCK_HEIGHTS.length]}px` }} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">{linkData?.title}</h1>
          <p className="text-slate-400 dark:text-white/40 flex items-center gap-2 text-sm">
            Poln by{' '}
            <a href="https://www.instagram.com/_iamlnp_/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4 font-medium">@_iamlnp_</a>
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-3">
          {!isPickingMode && (
            <button 
              onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds(new Set()); }} 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium", 
                isSelectionMode ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white" : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10"
              )}
            >
              {isSelectionMode ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {isSelectionMode ? `Selected (${selectedIds.size})` : "Select"}
            </button>
          )}
          
          {!previewData && <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm font-medium text-slate-700 dark:text-white">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}{copied ? "Copied" : "Share"}</button>}
        </motion.div>
      </div>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
        {files.map((file, index) => (
          <GalleryItem 
            key={file.id} 
            file={file} 
            index={index} 
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(file.id)}
            isPickingMode={isPickingMode}
            isPicked={pickedIds.has(file.id)}
            onToggleSelect={toggleSelect}
            onTogglePick={togglePick}
            onOpenLightbox={setActiveImageIndex}
          />
        ))}
      </div>

      {/* Fixed Floating Pill for Picking Mode or Download Mode */}
      <AnimatePresence>
        {((isPickingMode && pickedIds.size > 0) || (!isPickingMode && selectedIds.size > 0)) && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 px-4 w-full max-w-xs"
          >
            {isPickingMode ? (
              <button 
                onClick={exportPickedList}
                className="w-full flex items-center justify-center gap-3 py-4 bg-red-500 text-white font-bold rounded-full shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-all active:scale-95"
              >
                <FileText className="w-5 h-5" />
                Export List ({pickedIds.size})
              </button>
            ) : (
              <button 
                onClick={handleDownloadSelected} 
                disabled={isDownloading} 
                className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-full shadow-2xl shadow-black/20 dark:shadow-white/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
                    {downloadProgress}%
                  </span>
                ) : (
                  <>
                    <FileArchive className="w-5 h-5" />
                    Download .zip ({selectedIds.size})
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeImageIndex !== null && (
          <Lightbox 
            files={files} 
            currentIndex={activeImageIndex} 
            isPickingMode={isPickingMode}
            isPicked={pickedIds.has(files[activeImageIndex].id)}
            onTogglePick={() => togglePick(files[activeImageIndex].id)}
            onClose={() => setActiveImageIndex(null)} 
            onNext={() => setActiveImageIndex((activeImageIndex + 1) % files.length)} 
            onPrev={() => setActiveImageIndex((activeImageIndex - 1 + files.length) % files.length)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;