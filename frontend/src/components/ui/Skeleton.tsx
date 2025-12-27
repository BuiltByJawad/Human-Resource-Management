"use client";

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/60 ${className}`}
    />
  )
}
