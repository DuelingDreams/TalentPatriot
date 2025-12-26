import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

// Memoized StatCard to prevent unnecessary re-renders
export const MemoizedStatCard = React.memo(function StatCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconColor = "text-blue-600",
  className
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("p-2 rounded-lg bg-blue-50", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MemoizedStatCard.displayName = 'MemoizedStatCard';