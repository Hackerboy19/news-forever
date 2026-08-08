import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Reusable shadcn/ui inspired Skeleton component for Light English layout state loading.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200/70 dark:bg-stone-800/70 ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
