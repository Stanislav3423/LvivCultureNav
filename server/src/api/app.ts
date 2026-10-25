import express, { type ErrorRequestHandler } from 'express';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import type { RoutingService } from '../services/routing.ts';
import { adminRouter } from './admin.ts';
import { eventsRouter } from './events.ts';
import { sendError } from './http.ts';
import { partnersRouter } from './partners.ts';
import { routeRouter } from './route.ts';

export interface AppDeps {
  repo: EventsRepo;
  routing: RoutingService;
  adminKey: string;
  /** partnerId → ключ */
  partnerKeys: Record<string, string>;
}

export function createApp(deps: AppDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/events', eventsRouter(deps.repo));
  app.use('/api/route', routeRouter(deps.repo, deps.routing));
  app.use('/api/admin', adminRouter(deps.repo, deps.adminKey));
  app.use('/api/partners', partnersRouter(deps.repo, deps.partnerKeys));

  app.use('/api', (_req, res) => {
    sendError(res, 404, 'Not found');
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return sendError(res, 400, 'Invalid JSON body');
    console.error(err);
    sendError(res, 500, 'Internal server error');
  };
  app.use(onError);

  return app;
}
