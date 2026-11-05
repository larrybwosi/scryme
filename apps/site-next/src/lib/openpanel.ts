/**
 * Safe client-side telemetry wrapper for OpenPanel in site-next.
 */
export function trackOpenPanelEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return
  try {
    const op = (window as any).op
    if (typeof op === 'function') {
      op('track', event, properties)
    }
  } catch (err) {
    // Graceful ignore
  }
}
