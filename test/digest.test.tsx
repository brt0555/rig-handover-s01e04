import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: '' };
const dirs: string[] = [];
function runsDir() {
  const dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('digest page', () => {
  it('renders sorted digest rows and marks failures and repeated retries', async () => {
    const dir = runsDir();
    writeFileSync(join(dir, '2026-10-28.jsonl'), [
      JSON.stringify({ at: '08:00+01:00', job: 'zeta', status: 'fail', owner: null }),
      ...Array.from({ length: 3 }, (_, i) => JSON.stringify({ at: `08:0${i}+01:00`, job: 'alpha', status: 'retry', owner: 'ops' })),
    ].join('\n'));
    const response = await createApp({ ...config, runsDir: dir }).request('/digest/2026-10-28');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('zeta'));
    expect(html).toContain('ops');
    expect(html).toContain('—');
    expect(html).toContain('class="warn"');
  });

  it('renders an empty night and returns 404 when the night file is absent', async () => {
    const dir = runsDir();
    writeFileSync(join(dir, '2026-10-28.jsonl'), '');
    const app = createApp({ ...config, runsDir: dir });
    const empty = await app.request('/digest/2026-10-28');
    expect(empty.status).toBe(200);
    expect(await empty.text()).toContain('nothing ran');
    expect((await app.request('/digest/2026-10-29')).status).toBe(404);
  });
});
