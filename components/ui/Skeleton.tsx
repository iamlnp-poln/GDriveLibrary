
import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, style }) => {
  return (
    <div 
      className={cn("animate-pulse bg-slate-200 dark:bg-white/5 rounded-md", className)} 
      style={style}
    />
  );
};

export default Skeleton;
