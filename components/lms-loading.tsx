"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-burgundy ${sizeClasses[size]} ${className}`} 
         aria-hidden="true" />
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = 'Loading...', className = '' }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}
      role="status"
      aria-label={message}
    >
      <div className="glass rounded-2xl p-6 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-sm opacity-70">{message}</p>
      </div>
    </motion.div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function SkeletonLoader({ className = '', lines = 3 }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-white/20 dark:bg-white/10 rounded h-4 mb-2 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

interface CourseCardSkeletonProps {
  count?: number;
}

export function CourseCardSkeleton({ count = 6 }: CourseCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
          <div className="h-48 bg-white/20 dark:bg-white/10" />
          <div className="p-6">
            <div className="h-4 bg-white/20 dark:bg-white/10 rounded mb-2 w-1/3" />
            <div className="h-6 bg-white/20 dark:bg-white/10 rounded mb-2" />
            <div className="h-4 bg-white/20 dark:bg-white/10 rounded mb-4 w-3/4" />
            <div className="h-4 bg-white/20 dark:bg-white/10 rounded mb-4 w-1/2" />
            <div className="h-10 bg-white/20 dark:bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
