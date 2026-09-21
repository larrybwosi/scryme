import { useQuery } from '@tanstack/react-query';
import sdk, { isTauri, isOfflineMode } from '../sdk';
import { tauriInvoke } from '../tauri-bridge';

export const useRawMaterials = () => {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke('get_ingredients');
      }
      return sdk.client.get('/ingredients');
    },
  });
};
