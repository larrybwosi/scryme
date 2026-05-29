'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AlertTriangle, ShieldAlert, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
  icon?: ReactNode;
  destructive?: boolean;
  confirmButtonVariant?: 'destructive' | 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  isLoading = false,
  icon,
  destructive = true,
  confirmButtonVariant = 'destructive',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const variantConfig = {
    destructive: {
      icon: icon || <AlertTriangle className="h-5 w-5 text-destructive" />,
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      text: 'text-destructive',
    },
    warning: {
      icon: icon || <ShieldAlert className="h-5 w-5 text-amber-500" />,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
    },
    success: {
      icon: icon || <CheckCircle className="h-5 w-5 text-emerald-500" />,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-500',
    },
    info: {
      icon: icon || <AlertCircle className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-500',
    },
  };

  const config = variantConfig[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/50 shadow-2xl">
        <div className="flex flex-col">
          {/* Header with gradient background based on variant */}
          <div className={`${config.bg} ${config.border} border-b px-6 py-5`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${config.bg} border ${config.border}`}>{config.icon}</div>
              <div className="flex-1">
                <AlertDialogTitle className="text-lg font-semibold text-foreground">{title}</AlertDialogTitle>
                <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
                  {description}
                </AlertDialogDescription>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="px-6 py-5 bg-card">
            {destructive && (
              <div className="mb-4 p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">This action cannot be undone.</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer with enterprise-style buttons */}
          <AlertDialogFooter className="px-6 py-4 bg-muted/20 border-t border-border/50">
            <div className="flex items-center justify-between w-full gap-3">
              <AlertDialogCancel
                className={`flex-1 h-11 border-border bg-background hover:bg-muted/50 text-foreground font-medium`}
                disabled={isLoading}
              >
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={`flex-1 h-11 font-medium transition-all duration-200 ${
                  isLoading
                    ? 'bg-muted cursor-not-allowed'
                    : confirmButtonVariant === 'destructive'
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
