import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import posthog from 'posthog-js';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to system log file for developer troubleshooting
    logger.error('[CRASH] React ErrorBoundary caught an unhandled error', error, {
      componentStack: errorInfo.componentStack ?? 'N/A',
    });
    posthog.captureException(error, { componentStack: errorInfo.componentStack ?? 'N/A' });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background border-zinc-200 dark:bg-zinc-950 p-6 text-center">
          <div className="bg-card border-zinc-200 dark:border-zinc-800 border rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>

            <p className="text-muted-foreground mb-6">
              The application encountered an unexpected error. The error has been logged for your support team.
            </p>

            {this.state.error && (
              <div className="w-full bg-muted/50 rounded-md p-3 mb-6 text-left overflow-hidden">
                <p className="text-xs font-mono text-muted-foreground break-all">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <Button onClick={this.handleReload} className="w-full gap-2 items-center" size="lg">
                <RotateCcw className="h-4 w-4" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
