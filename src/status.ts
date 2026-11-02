import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { lastBeat, type Beat } from './heartbeat.js';
import { readNight } from './digest/read-night.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: { name: string; ok: number; retry: number; fail: number }[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((name) => {
      const { rows } = readNight(config.runsDir, name);
      return {
        name,
        ok: rows.filter((row) => row.lastStatus === 'ok').length,
        retry: rows.filter((row) => row.lastStatus === 'retry').length,
        fail: rows.filter((row) => row.lastStatus === 'fail').length,
      };
    }),
  };
}
