import { render, screen } from '@/test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrinterSettings from '@/components/printer.config';
import { usePosStore } from '@/store/store';
import { usePrinter } from '@/hooks/use-printer';

vi.mock('@/store/store', () => ({
  usePosStore: vi.fn(),
}));

vi.mock('@/hooks/use-printer', () => ({
  usePrinter: vi.fn(),
}));

describe('PrinterSettings Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (usePosStore as any).mockImplementation((selector: any) =>
      selector({
        settings: { enableAutoPrint: false },
        updateBusinessSettings: vi.fn(),
      })
    );

    (usePrinter as any).mockReturnValue({
      availablePrinters: [],
      assignments: {},
      assignPrinter: vi.fn(),
      refreshPrinters: vi.fn(),
      loading: false,
      printDocument: vi.fn(),
      autoPrintInvoice: false,
      setAutoPrintInvoice: vi.fn(),
    });
  });

  it('renders test printer icon buttons with accessible labels and tooltips', () => {
    render(<PrinterSettings />);

    const testButtons = [
      { name: 'Test Receipt printer', title: 'Test Receipt printer' },
      { name: 'Test Bill/Cheque printer', title: 'Test Bill/Cheque printer' },
      { name: 'Test Invoice printer', title: 'Test Invoice printer' },
      { name: 'Test Kitchen printer', title: 'Test Kitchen printer' },
      { name: 'Test Bar printer', title: 'Test Bar printer' },
      { name: 'Test Waybill printer', title: 'Test Waybill printer' },
    ];

    testButtons.forEach(({ name, title }) => {
      const button = screen.getByRole('button', { name });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', title);
    });
  });
});
