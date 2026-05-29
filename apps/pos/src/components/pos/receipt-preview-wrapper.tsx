import { useEffect, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';

// IMPORTANT: Configure the worker for production
// Using unpkg is the easiest way to ensure the worker loads correctly in Tauri without complex build config
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Setup styles for react-pdf to ensure the canvas fits the container
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export const ReceiptPreviewWrapper = ({ document }: { document: React.ReactElement<any> | null }) => {
  const [instance, update] = usePDF({ document: document as any });

  // Hold onto the last successfully rendered URL so the preview never
  // disappears while a new PDF is being generated — this eliminates the flash.
  const [stableUrl, setStableUrl] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    update(document as any);
  }, [document, update]);

  // Only update stableUrl when a new valid URL comes in
  useEffect(() => {
    if (instance.url) {
      setStableUrl(instance.url);
      isFirstLoad.current = false;
    }
  }, [instance.url]);

  // Only show the full-screen loader on the very first load (no prior URL to show)
  if (isFirstLoad.current && instance.loading) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-3 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">Generating Preview...</p>
      </div>
    );
  }

  if (instance.error) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-2 text-destructive">
        <p className="font-bold">Error generating PDF</p>
        <p className="text-xs max-w-[200px] text-center">{instance.error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex justify-center overflow-y-auto bg-gray-100 dark:bg-neutral-900/50 p-4 relative">
      {/* Subtle updating indicator — shows on re-renders without hiding the preview */}
      {instance.loading && stableUrl && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-2.5 py-1 shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground">updating</span>
        </div>
      )}

      {stableUrl ? (
        <Document file={stableUrl} loading={null} className="shadow-2xl">
          <Page
            pageNumber={1}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            scale={2.0}
            className="rounded-lg overflow-hidden border border-border"
          />
        </Document>
      ) : null}
    </div>
  );
};
