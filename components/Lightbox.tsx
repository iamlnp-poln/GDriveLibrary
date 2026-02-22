
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { GDriveFile } from '../types';
import { formatBytes } from '../lib/utils';

interface LightboxProps {
  files: GDriveFile[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ files, currentIndex, onClose, onNext, onPrev }) => {
  const file = files[currentIndex];
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(file.webContentLink!);
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
      {/* Top Bar */}
      <div className="h-16 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="hidden md:block">
            <h3 className="text-sm font-medium truncate max-w-[200px]">{file.name}</h3>
            <p className="text-xs text-white/40">{currentIndex + 1} of {files.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <button 
          onClick={onPrev}
          className="absolute left-4 z-10 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <button onClick={() => zoomOut()} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => resetTransform()} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Maximize className="w-4 h-4" /></button>
                <button onClick={() => zoomIn()} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ZoomIn className="w-4 h-4" /></button>
              </div>
              
              <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                <motion.img 
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={file.webContentLink} 
                  alt={file.name}
                  className="max-w-full max-h-full object-contain select-none"
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        <button 
          onClick={onNext}
          className="absolute right-4 z-10 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Info (Mobile) */}
      <div className="md:hidden p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-sm font-medium truncate">{file.name}</h3>
        <p className="text-xs text-white/40">{formatBytes(file.size)}</p>
      </div>
    </motion.div>
  );
};

export default Lightbox;
