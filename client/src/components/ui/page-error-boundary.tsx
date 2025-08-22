import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  description?: string;
}

function ErrorFallback({ error, resetErrorBoundary, title, description }: ErrorFallbackProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            {title || 'Something went wrong'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {description || 'An error occurred while loading this content'}
          </p>
          <div className="mt-4 space-y-2">
            <Button 
              onClick={resetErrorBoundary} 
              className="w-full"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <details className="text-left">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                {error.message}
              </pre>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Page-level error boundary with retry functionality
 * Prevents errors from propagating to the app-level error boundary
 */
export function PageErrorBoundary({ 
  children, 
  fallbackTitle, 
  fallbackDescription, 
  onError 
}: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback 
          {...props} 
          title={fallbackTitle} 
          description={fallbackDescription} 
        />
      )}
      onError={(error, errorInfo) => {
        console.error('Page Error Boundary caught an error:', error, errorInfo);
        onError?.(error, errorInfo);
      }}
      onReset={() => {
        // This will re-render the children, effectively retrying
        console.log('Page Error Boundary: Retrying after error...');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}