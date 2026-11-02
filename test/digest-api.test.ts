import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const directories: string[] = [];
const config = (runsDir: string) => ({
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir,
});

function temporaryRunsDir() {
  const root = mkdtempSync(join(tmpdir(), 'rig-digest-api-'));
  const runsDir = join(root, 'runs');
  mkdirSync(runsDir);
  directories.push(root);
  return runsDir;
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('digest JSON API', () => {
  it('returns the digest rows sorted by job and counts malformed lines', async () => {
    const runsDir = temporaryRunsDir();
    writeFileSync(join(runsDir, 'test-night.jsonl'), [
      JSON.stringify({ at: '2026-10-28T02:00:00+01:00', job: 'zeta', status: 'ok', owner: null }),
      JSON.stringify({ at: '2026-10-28T01:00:00+01:00', job: 'alpha', status: 'retry', owner: 'Ada', error: 'again' }),
      'not json',
    ].join('\n'));

    const response = await createApp(config(runsDir)).request('/api/digest/test-night');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.badLines).toBe(1);
    expect(body.rows.map((row: { job: string }) => row.job)).toEqual(['alpha', 'zeta']);
    expect(body.rows[0]).toMatchObject({ job: 'alpha', retries: 1, lastStatus: 'retry' });
  });

  it('returns an empty digest for an empty night', async () => {
    const runsDir = temporaryRunsDir();
    writeFileSync(join(runsDir, 'empty.jsonl'), '');
    const response = await createApp(config(runsDir)).request('/api/digest/empty');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [], badLines: 0 });
  });

  it('returns 404 when the night file does not exist', async () => {
    const response = await createApp(config(temporaryRunsDir())).request('/api/digest/missing');
    expect(response.status).toBe(404);
  });
});
