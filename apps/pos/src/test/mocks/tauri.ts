import { mockInvoke } from '../setup';

// Re-export for compatibility with existing tests
export { mockInvoke };

// Helper to setup a specific response for a command
export const mockCommand = (cmd: string, response: any) => {
  mockInvoke.mockImplementation(async (invokedCmd: string, args: any) => {
    if (invokedCmd === cmd) {
      if (typeof response === 'function') {
        return response(args);
      }
      return response;
    }
    return undefined;
  });
};

// Reset all mocks
export const resetMocks = () => {
  mockInvoke.mockReset();
};
