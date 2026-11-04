import * as migration_20261104_073540_init from './20261104_073540_init';

export const migrations = [
  {
    up: migration_20261104_073540_init.up,
    down: migration_20261104_073540_init.down,
    name: '20261104_073540_init'
  },
];
