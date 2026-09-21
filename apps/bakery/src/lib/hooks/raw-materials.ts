import { client } from '@/lib/sdk';

export async function fetchRawMaterials() {
  return client.get('/ingredients');
}

export async function createRawMaterial(data: any) {
  return client.post('/ingredients', data);
}

export async function updateRawMaterial(id: string, data: any) {
  return client.patch(`/ingredients/${id}`, data);
}

export async function deleteRawMaterial(id: string) {
  return client.delete(`/ingredients/${id}`);
}
