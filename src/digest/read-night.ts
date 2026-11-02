import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, ReadNight, RunStatus } from './types.js';

type RunRecord = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

function isRunRecord(value: unknown): value is RunRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.at === 'string'
    && typeof record.job === 'string'
    && (record.status === 'ok' || record.status === 'retry' || record.status === 'fail')
    && (record.owner === null || typeof record.owner === 'string')
    && (record.error === undefined || typeof record.error === 'string');
}

export const readNight: ReadNight = (runsDir, night) => {
  const content = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  const rows = new Map<string, DigestRow>();
  let badLines = 0;

  for (const line of content.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      badLines++;
      continue;
    }
    if (!isRunRecord(value)) {
      badLines++;
      continue;
    }

    const row = rows.get(value.job);
    if (!row) {
      rows.set(value.job, {
        job: value.job,
        owner: value.owner,
        runs: 1,
        retries: value.status === 'retry' ? 1 : 0,
        lastStatus: value.status,
        lastError: value.error ?? null,
        firstTime: value.at,
        lastTime: value.at,
      });
      continue;
    }
    row.runs++;
    if (value.status === 'retry') row.retries++;
    row.lastStatus = value.status;
    row.lastError = value.error ?? null;
    row.lastTime = value.at;
    if (row.owner === null && value.owner !== null) row.owner = value.owner;
  }
  return { rows: [...rows.values()], badLines };
};
