import { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyRouteProps {
  component: ComponentType;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center gap-2 text-slate-600">
      <Loader2 className="w-5 h-5 animate-spin" />
      Loading...
    </div>
  </div>
);

export function LazyRoute({ component: Component, fallback }: LazyRouteProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <Component />
    </Suspense>
  );
}