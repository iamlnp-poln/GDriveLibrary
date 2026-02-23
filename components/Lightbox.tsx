
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize, Loader2, Heart } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { GDriveFile } from '../types';
import { formatBytes, cn } from '../lib/utils';

interface LightboxProps {
  files: GDriveFile[];
  currentIndex: number;
  isPickingMode?: boolean;
  isPicked?: boolean;
  onTogglePick?: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ files, currentIndex, isPickingMode, isPicked, onTogglePick, onClose, onNext, onPrev }) => {
  const file = files[currentIndex];
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  useEffect(() => {
    setIsHighResLoaded(false);
  }, [currentIndex]);

  const handleDownload = async () => {
    if (isPickingMode) return;
    try {
      const response = await fetch(`/api/image/${file.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <div className="h-16 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="hidden md:block text-white">
            <h3 className="text-sm font-medium truncate max-w-[200px]">{file.name}</h3>
            <p className="text-xs text-white/40">{currentIndex + 1} of {files.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPickingMode ? (
            <button 
              onClick={onTogglePick}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all transform active:scale-95",
                isPicked ? "bg-red-500 text-white" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-4 h-4", isPicked && "fill-current")} />
              {isPicked ? "Picked" : "Pick this"}
            </button>
          ) : (
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <button onClick={onPrev} className="absolute left-4 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors text-white"><ChevronLeft className="w-6 h-6" /></button>

        <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute bottom-8 left-1/2 -translate-y-1/2 z-20 flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
                <button onClick={() => zoomOut()} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => resetTransform()} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Maximize className="w-4 h-4" /></button>
                <button onClick={() => zoomIn()} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ZoomIn className="w-4 h-4" /></button>
              </div>
              
              <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={file.thumbnailLink} 
                    alt=""
                    className={cn(
                      "absolute max-w-full max-h-full object-contain transition-opacity duration-700",
                      isHighResLoaded ? "opacity-0" : "opacity-100"
                    )}
                  />

                  <motion.img 
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHighResLoaded ? 1 : 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    src={file.webContentLink} 
                    alt={file.name}
                    onLoad={() => setIsHighResLoaded(true)}
                    className={cn(
                      "relative max-w-full max-h-full object-contain select-none z-10",
                      isPickingMode && "pointer-events-none"
                    )}
                    onContextMenu={(e) => isPickingMode && e.preventDefault()}
                  />

                  {isPickingMode && isHighResLoaded && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-10 select-none overflow-hidden">
                      <div className="rotate-[-45deg] text-white font-bold text-5xl whitespace-nowrap tracking-[1em] uppercase">
                        Poln's Gallery • @_iamlnp_
                      </div>
                    </div>
                  )}

                  {!isHighResLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                      <div className="bg-black/20 backdrop-blur-sm p-3 rounded-full">
                        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        <button onClick={onNext} className="absolute right-4 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors text-white"><ChevronRight className="w-6 h-6" /></button>
      </div>

      <div className="md:hidden p-4 bg-gradient-to-t from-black/80 to-transparent z-20 text-white">
        <h3 className="text-sm font-medium truncate">{file.name}</h3>
        <p className="text-xs text-white/40">{formatBytes(file.size)}</p>
      </div>
    </motion.div>
  );
};

export default Lightbox;
