import { Button } from '@repo/ui/components/ui/button';
import { MoveLeft, FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="flex flex-col items-center max-w-md animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative h-24 w-24 bg-card border shadow-sm rounded-2xl flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-4">Page Not Found</h2>

        <p className="text-muted-foreground mb-8 text-balance">
          Sorry, we couldn't find the page you're looking for. It might have been removed, moved, or doesn't exist.
        </p>

        <Button onClick={() => navigate('/')} size="lg" className="gap-2">
          <MoveLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
