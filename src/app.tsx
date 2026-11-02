import { Hono } from 'hono';
import { readNight } from './digest/read-night.js';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';
import { DigestPage } from './views/digest.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return c.notFound();
    let digest;
    try {
      digest = readNight(config.runsDir, night);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
        return c.notFound();
      }
      throw error;
    }
    return c.html(
      <Layout title={`digest · ${night}`} lane={lane()}>
        <DigestPage night={night} rows={digest.rows} badLines={digest.badLines} />
      </Layout>,
    );
  });

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  return app;
}
