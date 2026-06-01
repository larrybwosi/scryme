'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';

type EntityType = 'batch' | 'template' | 'recipe' | 'item';

interface DeleteConfirmationConfig {
  entityType: EntityType;
  entityName?: string;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

interface DeleteConfirmationContextType {
  confirmDelete: (config: DeleteConfirmationConfig) => Promise<boolean>;
}

const DeleteConfirmationContext = createContext<DeleteConfirmationContextType | null>(null);

interface DeleteConfirmationProviderProps {
  children: ReactNode;
}

export const DeleteConfirmationProvider = ({ children }: DeleteConfirmationProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DeleteConfirmationConfig | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirmDelete = (config: DeleteConfirmationConfig): Promise<boolean> => {
    return new Promise(resolve => {
      setConfig(config);
      setIsOpen(true);
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.(true);
    setResolver(null);
    setConfig(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.(false);
    setResolver(null);
    setConfig(null);
  };

  const getEntityName = () => {
    if (config?.entityName) return config.entityName;

    switch (config?.entityType) {
      case 'batch':
        return 'batch';
      case 'template':
        return 'template';
      case 'recipe':
        return 'recipe';
      default:
        return 'item';
    }
  };

  const getTitle = () => config?.title || 'Confirm Deletion';

  const getDescription = () =>
    config?.description || `Are you sure you want to delete this ${getEntityName()}? This action cannot be undone.`;

  return (
    <DeleteConfirmationContext.Provider value={{ confirmDelete }}>
      {children}
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirm}>
              {config?.confirmText || 'Delete'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              {config?.cancelText || 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DeleteConfirmationContext.Provider>
  );
};

export const useDeleteConfirmation = () => {
  const context = useContext(DeleteConfirmationContext);

  if (!context) {
    throw new Error('useDeleteConfirmation must be used within a DeleteConfirmationProvider');
  }

  return context;
};
