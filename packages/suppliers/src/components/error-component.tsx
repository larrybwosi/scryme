'use client';

import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/ui/alert';

interface ErrorComponentProps {
  error?: Error;
  title?: string;
  description?: string;
  onRetry?: () => void;
  showContactSupport?: boolean;
  showHomeButton?: boolean;
}

export function ErrorComponent({
  error,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  showContactSupport = true,
  showHomeButton = true,
}: ErrorComponentProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@company.com?subject=Support Request: Error on Supplier Page';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
          <CardDescription className="text-gray-600 mt-2">{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="text-xs font-mono wrap-break-word">
                {error.message || 'Unknown error occurred'}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p className="mb-2">You can try:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Refreshing the page</li>
              <li>Checking your internet connection</li>
              <li>Clearing your browser cache</li>
              {showContactSupport && <li>Contacting support if the problem persists</li>}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {onRetry !== undefined && (
              <Button onClick={handleRetry} className="flex-1 flex items-center gap-2" variant="default">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}

            {showHomeButton && (
              <Button onClick={handleGoHome} className="flex-1 flex items-center gap-2" variant="outline">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          {showContactSupport && (
            <Button onClick={handleContactSupport} className="w-full flex items-center gap-2" variant="ghost" size="sm">
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Specific error components for different scenarios
export function NetworkErrorComponent({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorComponent
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      showContactSupport={true}
    />
  );
}

export function NotFoundErrorComponent({ resource = 'page' }: { resource?: string }) {
  return (
    <ErrorComponent
      title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found`}
      description={`The ${resource} you're looking for doesn't exist or may have been moved.`}
      showContactSupport={false}
      showHomeButton={true}
    />
  );
}

export function AccessDeniedErrorComponent() {
  return (
    <ErrorComponent
      title="Access Denied"
      description="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
      showContactSupport={true}
      showHomeButton={true}
    />
  );
}

export function ServerErrorComponent({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorComponent
      title="Server Error"
      description="Our servers are experiencing issues. Please try again in a few moments."
      onRetry={onRetry}
      showContactSupport={true}
    />
  );
}

// Loading error component specifically for supplier-related errors
export function SupplierErrorComponent({ error, onRetry }: { error?: Error; onRetry?: () => void }) {
  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Supplier Data Error</CardTitle>
          <CardDescription>We encountered an issue loading your supplier information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-sm">{error.message}</AlertDescription>
            </Alert>
          )}
          <div className="text-sm text-gray-600">
            <p>This might be due to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li>Network connectivity issues</li>
              <li>Temporary server problems</li>
              <li>Invalid supplier data</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload Suppliers
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
