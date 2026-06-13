/**
 * A lightweight JSON delta implementation for realtime updates.
 * Only handles shallow differences for speed and simplicity.
 */

export interface Delta {
  updated?: Record<string, any>;
  deleted?: string[];
}

export function createDelta(oldData: any, newData: any): Delta | null {
  if (typeof oldData !== 'object' || oldData === null || typeof newData !== 'object' || newData === null) {
    return null;
  }

  const updated: Record<string, any> = {};
  const deleted: string[] = [];

  // Check for updates and new keys
  for (const key in newData) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      updated[key] = newData[key];
    }
  }

  // Check for deletions
  for (const key in oldData) {
    if (!(key in newData)) {
      deleted.push(key);
    }
  }

  if (Object.keys(updated).length === 0 && deleted.length === 0) {
    return null;
  }

  return {
    ...(Object.keys(updated).length > 0 ? { updated } : {}),
    ...(deleted.length > 0 ? { deleted } : {}),
  };
}

export function applyDelta(oldData: any, delta: Delta): any {
  if (!delta || typeof oldData !== 'object' || oldData === null) {
    return oldData;
  }

  const newData = { ...oldData };

  if (delta.updated) {
    for (const key in delta.updated) {
      newData[key] = delta.updated[key];
    }
  }

  if (delta.deleted) {
    for (const key of delta.deleted) {
      delete newData[key];
    }
  }

  return newData;
}
