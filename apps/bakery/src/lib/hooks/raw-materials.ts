import { client } from '../sdk';

export const useRawMaterials = () => {
  return client.get('/ingredients');
};
