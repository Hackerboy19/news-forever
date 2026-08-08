import React from 'react';
import { SEOManager, SEOManagerProps } from './SEOManager';

/**
 * SEOHead Component wrapper over SEOManager
 * Ensures 100% backward compatibility while using SEOManager for head tag updates.
 */
export const SEOHead: React.FC<SEOManagerProps> = (props) => {
  return <SEOManager {...props} />;
};

export default SEOHead;

