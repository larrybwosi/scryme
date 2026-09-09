import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceTypeStep } from '../set-up';

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

describe('DeviceTypeStep - Restaurant Hub vs Spoke Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders top-level Hub and Spoke options by default', () => {
    const onNext = vi.fn();
    render(<DeviceTypeStep onNext={onNext} />);

    expect(screen.getByText('Restaurant Initialization Mode')).toBeInTheDocument();
    expect(screen.getByText('Main Hub (Server)')).toBeInTheDocument();
    expect(screen.getByText('Spoke Client')).toBeInTheDocument();
  });

  it('submits Main Hub selection correctly', () => {
    const onNext = vi.fn();
    render(<DeviceTypeStep onNext={onNext} />);

    const nameInput = screen.getByPlaceholderText(/e\.g\. Main Counter POS/i);
    fireEvent.change(nameInput, { target: { value: 'Main Register' } });

    const submitBtn = screen.getByRole('button', { name: /Finalize Configuration/i });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem('DEVICE_NAME')).toBe('Main Register');
    expect(onNext).toHaveBeenCalledWith('MAIN_HUB', undefined);
  });

  it('shows spoke roles and IP input when Spoke Client is selected', () => {
    const onNext = vi.fn();
    render(<DeviceTypeStep onNext={onNext} />);

    const spokeBtn = screen.getByText('Spoke Client');
    fireEvent.click(spokeBtn);

    expect(screen.getByText('Select Spoke Role')).toBeInTheDocument();
    expect(screen.getByText('Waiter Tablet')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Display (KDS)')).toBeInTheDocument();
    expect(screen.getByText('Secondary Register')).toBeInTheDocument();
    expect(screen.getByLabelText(/Main Hub IP Address/i)).toBeInTheDocument();
  });

  it('submits Spoke Client KDS selection with Hub IP', () => {
    const onNext = vi.fn();
    render(<DeviceTypeStep onNext={onNext} />);

    fireEvent.click(screen.getByText('Spoke Client'));
    fireEvent.click(screen.getByText('Kitchen Display (KDS)'));

    const nameInput = screen.getByPlaceholderText(/e\.g\. Main Counter POS/i);
    fireEvent.change(nameInput, { target: { value: 'Kitchen Display 1' } });

    const ipInput = screen.getByLabelText(/Main Hub IP Address/i);
    fireEvent.change(ipInput, { target: { value: '192.168.1.120' } });

    fireEvent.click(screen.getByRole('button', { name: /Finalize Configuration/i }));

    expect(localStorage.getItem('DEVICE_NAME')).toBe('Kitchen Display 1');
    expect(onNext).toHaveBeenCalledWith('KDS', '192.168.1.120');
  });

  it('triggers auto-discovery and populates detected Hub IP', async () => {
    const onNext = vi.fn();

    mockInvoke.mockImplementation(async (cmd) => {
      if (cmd === 'get_local_ip_command') {
        return '192.168.1.50';
      }
      if (cmd === 'get_hub_status') {
        return { is_running: true };
      }
      return {};
    });

    render(<DeviceTypeStep onNext={onNext} />);

    fireEvent.click(screen.getByText('Spoke Client'));

    const autoDiscoverBtn = screen.getByText('Auto-Discover Hub');
    fireEvent.click(autoDiscoverBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get_local_ip_command');
    });

    const ipInput = screen.getByLabelText(/Main Hub IP Address/i) as HTMLInputElement;
    expect(ipInput.value).toBe('192.168.1.50');
  });
});
