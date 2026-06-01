import * as migration_20260601_144225_initial from './20260601_144225_initial'

export const migrations = [
  {
    up: migration_20260601_144225_initial.up,
    down: migration_20260601_144225_initial.down,
    name: '20260601_144225_initial',
  },
]
