import React from 'react';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ isVerified, className = "", size = 16 }) {
  if (!isVerified) return null;

  return (
    <div 
      className={`inline-flex items-center justify-center text-blue-500 fill-blue-50 shrink-0 ${className}`}
      title="Verified Official"
    >
      <BadgeCheck size={size} />
    </div>
  );
}
