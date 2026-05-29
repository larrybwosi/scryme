import { render, screen, waitFor } from '@/test/utils';
import { NotificationCenter } from '../notification-center';
import { notificationService } from '@/lib/notification-service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock notification service
vi.mock('@/lib/notification-service', () => ({
  notificationService: {
    subscribe: vi.fn(() => () => {}),
    getHistory: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  },
}));

// Mock Tauri event listen
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}), // Returns unlisten function
}));

describe('NotificationCenter', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (notificationService.getHistory as any).mockResolvedValue([]);
    (notificationService.getUnreadCount as any).mockResolvedValue(0);
  });

  it('renders notification bell', async () => {
    render(<NotificationCenter />);
    expect(await screen.findByRole('button')).toBeInTheDocument();
  });

  it('shows badge when there are unread notifications', async () => {
    (notificationService.getUnreadCount as any).mockResolvedValue(5);
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('displays notifications in dropdown', async () => {
    const mockNotifications = [
      {
        id: '1',
        title: 'Test Notification',
        body: 'This is a test notification body',
        read: false,
        timestamp: new Date().toISOString(),
        notificationType: 'info',
      },
    ];
    (notificationService.getHistory as any).mockResolvedValue(mockNotifications);
    (notificationService.getUnreadCount as any).mockResolvedValue(1);

    render(<NotificationCenter />);

    // Open dropdown
    const trigger = await screen.findByRole('button');
    await user.click(trigger);

    // Wait for dropdown content
    await waitFor(async () => {
      expect(await screen.findByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test notification body')).toBeInTheDocument();
    });
  });

  it('marks as read on click', async () => {
    const mockNotifications = [
      {
        id: '1',
        title: 'Clickable Notification',
        body: 'This is a test',
        read: false,
        timestamp: new Date().toISOString(),
        notificationType: 'info',
      },
    ];
    (notificationService.getHistory as any).mockResolvedValue(mockNotifications);
    render(<NotificationCenter />);

    // Open dropdown
    const trigger = await screen.findByRole('button');
    await user.click(trigger);

    const notificationItem = await screen.findByText('Clickable Notification');
    await user.click(notificationItem);

    expect(notificationService.markRead).toHaveBeenCalledWith('1');
  });
});
