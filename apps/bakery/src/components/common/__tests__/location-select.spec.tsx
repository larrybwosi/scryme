import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { LocationSelect } from '../location-select';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import sdk from '@/lib/sdk';

vi.mock('@/lib/sdk', () => ({
  default: {
    pos: {
      listLocations: vi.fn(),
    },
  },
  isTauri: () => false,
  isOfflineMode: () => false,
}));

describe('LocationSelect Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('fetches locations and displays selected location name when data structure is { locations: [...] }', async () => {
    const mockLocations = [
      { id: 'loc-1', name: 'Main Bakery', address: { city: 'Nairobi', country: 'Kenya' } },
      { id: 'loc-2', name: 'Downtown Branch', city: 'Mombasa', country: 'Kenya' },
    ];

    (sdk.pos.listLocations as any).mockResolvedValue({ locations: mockLocations });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationSelect value="loc-1" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Main Bakery')).toBeTruthy();
    });

    expect(sdk.pos.listLocations).toHaveBeenCalledTimes(1);
  });

  it('handles empty locations response gracefully', async () => {
    (sdk.pos.listLocations as any).mockResolvedValue({ locations: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationSelect placeholder="Select a location..." />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Select a location...')).toBeTruthy();
    });
  });
});
