import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read-night.js';

describe('readNight', () => {
  it('groups the fixture into five jobs and counts its malformed line', () => {
    const result = readNight('runs', '2026-10-28');
    expect(result.rows).toHaveLength(5);
    expect(result.badLines).toBe(1);
    expect(result.rows.find((row) => row.job === 'lane/sync')).toMatchObject({
      runs: 8,
      retries: 1,
      lastStatus: 'ok',
      owner: 'rook',
    });
  });

  it('retains null owners and uses the most recent error and time', () => {
    const result = readNight('runs', '2026-10-28');
    expect(result.rows.find((row) => row.job === 'digest/render')).toMatchObject({
      owner: null,
      firstTime: '2026-10-29T05:41:09+01:00',
      lastTime: '2026-10-29T05:41:09+01:00',
    });
    expect(result.rows.find((row) => row.job === 'notes/backup')).toMatchObject({
      lastStatus: 'fail',
      lastError: 'quota exceeded',
    });
  });
});
