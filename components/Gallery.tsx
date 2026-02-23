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

const MOCK_HEIGHTS = [320, 450, 280, 500, 350, 400, 300, 480, 380, 420, 290, 460];

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
          throw new Error(errorData.details || "Failed to fetch folder contents.");
        }
        
        const driveFiles: GDriveFile[] = await filesResponse.json();
        
        const processedFiles = driveFiles.map(file => {
          /**
           * THUẬT TOÁN TỐI ƯU BĂNG THÔNG TUYỆT ĐỐI:
           * Chúng ta lấy phần gốc của thumbnailLink (bỏ phần =s220 ở cuối).
           * - thumbnailLink: dùng =s1000 để hiện ở Grid (Google gánh load).
           * - webContentLink: dùng =s0 để hiện ảnh GỐC ở Lightbox (Google gánh load).
           * Vercel bây giờ chỉ đóng vai trò render HTML/JS, không tốn băng thông cho ảnh.
           */
          const baseGoogleUrl = file.thumbnailLink?.replace(/=s\d+$/, '');

          return {
            ...file,
            thumbnailLink: `${baseGoogleUrl}=s1000`, // Load từ Google CDN
            webContentLink: `${baseGoogleUrl}=s0`    // Load ảnh GỐC từ Google CDN
          };
        });
        
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
          // Khi download Zip, ta vẫn phải fetch qua Proxy để tránh lỗi CORS của trình duyệt
          const response = await fetch(`/api/image/${file.id}`);
          const blob = await response.blob();
          zip.file(file.name, blob);
          setDownloadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
        const content = await zip.generateAsync({ type: "blob" });
        const saveAs = (FileSaver as any).saveAs || FileSaver;
        saveAs(content, `${linkData?.title || 'gallery'}-photos.zip`);
      } else {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const link = document.createElement('a');
          // Download lẻ dùng trực tiếp link Google để tiết kiệm băng thông
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

  const GalleryItem = ({ file, index }: { file: GDriveFile, index: number }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const height = MOCK_HEIGHTS[index % MOCK_HEIGHTS.length];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: index * 0.05,
          ease: [0.21, 0.47, 0.32, 0.98] 
        }}
        className="relative group cursor-pointer break-inside-avoid mb-4"
        onClick={() => {
          if (isSelectionMode) toggleSelect(file.id);
          else setActiveImageIndex(index);
        }}
      >
        <div className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-500 shadow-sm bg-slate-100 dark:bg-white/5",
          selectedIds.has(file.id) ? "ring-4 ring-slate-900 dark:ring-white scale-[0.98]" : "ring-0"
        )}
        style={{ minHeight: !isLoaded ? `${height}px` : 'auto' }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 z-0">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
          )}

          <img 
            src={file.thumbnailLink} 
            alt={file.name}
            onLoad={() => setIsLoaded(true)}
            className={cn(
              "w-full h-auto object-cover transition-all duration-700 group-hover:scale-110",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
          />
          
          <div className={cn(
            "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10",
            isSelectionMode && "opacity-100 bg-black/20"
          )}>
            {isSelectionMode ? (
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                selectedIds.has(file.id) ? "bg-white border-white" : "border-white/50"
              )}>
                {selectedIds.has(file.id) && <Check className="w-5 h-5 text-black" />}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Grid className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-12" />
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="mb-4"
            >
              <Skeleton 
                className="w-full rounded-2xl" 
                style={{ height: `${MOCK_HEIGHTS[i % MOCK_HEIGHTS.length]}px` }} 
              />
            </motion.div>
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">{linkData?.title}</h1>
          <p className="text-slate-400 dark:text-white/40 flex items-center gap-2">
            {files.length} Photos &bull; Poln by{' '}
            <a href="https://www.instagram.com/_iamlnp_/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4 font-medium">@_iamlnp_</a>
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center gap-3"
        >
          {isSelectionMode && (
            <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/10">
              <button onClick={() => setDownloadMode('individual')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all", downloadMode === 'individual' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400")}><Files className="w-3.5 h-3.5" />Individual</button>
              <button onClick={() => setDownloadMode('zip')} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all", downloadMode === 'zip' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400")}><FileArchive className="w-3.5 h-3.5" />Zip</button>
            </div>
          )}
          {!previewData && <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm font-medium text-slate-700 dark:text-white">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}{copied ? "Copied" : "Share"}</button>}
          <button onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds(new Set()); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium", isSelectionMode ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white" : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10")}>{isSelectionMode ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}{isSelectionMode ? `Selected (${selectedIds.size})` : "Select"}</button>
          {selectedIds.size > 0 && <button onClick={handleDownloadSelected} disabled={isDownloading} className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-slate-200 dark:shadow-none">{isDownloading ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />{downloadProgress}%</span> : <><Download className="w-4 h-4" />{downloadMode === 'zip' ? 'Download Zip' : 'Download All'}</>}</button>}
        </motion.div>
      </div>

      {files.length === 0 ? (
        <div className="py-40 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
          <p className="text-slate-400 dark:text-white/20 font-medium">This folder is empty or contains no images.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {files.map((file, index) => (
            <GalleryItem key={file.id} file={file} index={index} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeImageIndex !== null && (
          <Lightbox 
            files={files} 
            currentIndex={activeImageIndex} 
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