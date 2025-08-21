import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MemoizedCardProps {
  id: string;
  title: string;
  content: React.ReactNode;
  className?: string;
  onClick?: () => void;
  lastUpdated?: string; // For memo optimization
}

// Memoized card component that only re-renders when props change
export const MemoizedCard = memo(function MemoizedCard({ 
  id, 
  title, 
  content, 
  className = '', 
  onClick,
  lastUpdated 
}: MemoizedCardProps) {
  return (
    <Card 
      key={id}
      className={`cursor-pointer transition-shadow hover:shadow-lg ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        {content}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.className === nextProps.className &&
    prevProps.lastUpdated === nextProps.lastUpdated
  );
});