import { usePosStore } from '@/store/store';
import { clsx, type ClassValue } from 'clsx';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { isTauri } from '@tauri-apps/api/core';
import { writeFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import { toast } from 'sonner';
import { Store } from '@tauri-apps/plugin-store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const useFormattedCurrency = (): ((amount: number | string, options?: Intl.NumberFormatOptions) => string) => {
  // Get the organization from the application store
  const {
    settings: { currency: storeCurrency },
  } = usePosStore();

  const currency = storeCurrency || 'USD';

  // Determine the user's locale: use navigator.language if available, otherwise fallback to 'en-US'
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  // Return a memoized formatting function that depends on currency and locale
  return useMemo(() => {
    return (amount: number | string, options: Intl.NumberFormatOptions = {}): string => {
      // Parse the amount to a number, handling different input types
      let parsedAmount: number;
      if (typeof amount === 'string') {
        parsedAmount = parseFloat(amount);
      } else {
        parsedAmount = amount as number;
      }

      // Handle invalid amounts
      if (isNaN(parsedAmount)) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 2, // Default to 2 decimal places for invalid amounts
          ...options,
        }).format(0); // Format 0 with the correct currency symbol
      }

      // Attempt to format the amount using Intl.NumberFormat
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 2, // Default to 2 decimal places unless overridden
          ...options, // Merge any additional formatting options
        }).format(parsedAmount);
      } catch (error) {
        // Fallback to basic formatting with the currency symbol
        const fallbackFormatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'USD', // Fallback to USD if the currency is invalid
          maximumFractionDigits: options.maximumFractionDigits ?? 2,
        });
        return fallbackFormatter.format(parsedAmount);
      }
    };
  }, [currency, locale]); // Recreate the formatting function only when currency or locale changes
};

// Helper to handle Tauri vs Browser download logic to avoid code duplication

export const processFileDownload = async (blob: Blob, fileName: string, loadingToastId: string | number) => {
  try {
    if (isTauri()) {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const folderName = 'Dealio';
      const relativePath = `${folderName}/${fileName}`; // Path relative to Documents

      // 1. Check/Create 'Dealio' folder in DOCUMENTS
      const dirExists = await exists(folderName, { baseDir: BaseDirectory.Document });
      if (!dirExists) {
        await mkdir(folderName, { baseDir: BaseDirectory.Document, recursive: true });
      }

      // 2. Write file to DOCUMENTS using the relative path
      await writeFile(relativePath, uint8Array, { baseDir: BaseDirectory.Document });

      // 3. Get Absolute Path for opening the file
      // We need the full path for the OS to open it, but writeFile needed the relative path
      const docDir = await documentDir();
      const absoluteFilePath = await join(docDir, folderName, fileName);

      toast.success(`Saved to Documents/${folderName}`, {
        description: fileName,
        id: loadingToastId,
        action: {
          label: 'Open',
          onClick: async () => {
            try {
              const { openPath } = await import('@tauri-apps/plugin-opener');
              await openPath(absoluteFilePath);
            } catch (e) {
              toast.error('Failed to open file');
            }
          },
        },
        duration: 5000,
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download started', {
        description: `${fileName} is being downloaded`,
        id: loadingToastId,
        duration: 3000,
      });
    }
  } catch (error) {
    toast.error('Failed to save file', {
      description: error instanceof Error ? error.message : 'Unknown error',
      id: loadingToastId,
    });
    throw error;
  }
};

export async function safeStoreSet<T>(store: Store, key: string, value: T | undefined) {
  // JSON supports null, but passing 'undefined' to Tauri's IPC bridge breaks the command
  const safeValue = value === undefined ? null : value;
  await store.set(key, safeValue);
}
