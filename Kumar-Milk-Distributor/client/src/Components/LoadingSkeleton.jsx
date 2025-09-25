import React from "react";

const LoadingSkeleton = ({ className = "", style = {} }) => (
  <div
    className={`animate-pulse bg-[color:var(--neutral-gray-200)] rounded ${className}`}
    style={{ opacity: 0.6, ...style }}
  />
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <LoadingSkeleton key={i} className={`h-4 w-${i % 3 === 0 ? '3/4' : 'full'}`} />
    ))}
  </div>
);

export default LoadingSkeleton;


