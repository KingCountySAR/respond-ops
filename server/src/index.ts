import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ApiResponse } from '@shared';

const app = new Hono();

app.use('/api/*', cors());

app.get('/api/health', (c) => {
  const response: ApiResponse<{ status: string }> = {
    data: { status: 'ok' },
  };
  return c.json(response);
});

const port = Number(process.env.PORT) || 5173;

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
