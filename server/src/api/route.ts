import { Router } from 'express';
import { TERMINALS, isTerminalId } from '@lcn/shared';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import type { RoutingService } from '../services/routing.ts';
import { notFound, parseId, sendError } from './http.ts';

/** GET /api/route?terminal=station|center&eventId=1 — пішохідний маршрут від терміналу до події */
export function routeRouter(repo: EventsRepo, routing: RoutingService) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { terminal } = req.query;
    if (!isTerminalId(terminal)) return sendError(res, 400, 'Unknown terminal, use station | center');
    const id = parseId(req.query.eventId);
    if (id === undefined) return sendError(res, 400, 'eventId must be a positive integer');
    const event = repo.get(id);
    if (!event) return notFound(res);
    res.json(await routing.route(TERMINALS[terminal], { lat: event.lat, lng: event.lng }));
  });

  return router;
}
