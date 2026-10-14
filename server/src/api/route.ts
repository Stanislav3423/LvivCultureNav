import { Router } from 'express';
import { TERMINALS, isTerminalId } from '@lcn/shared';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import type { RoutingService } from '../services/routing.ts';

/** GET /api/route?terminal=station|center&eventId=1 — пішохідний маршрут від терміналу до події */
export function routeRouter(repo: EventsRepo, routing: RoutingService) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { terminal, eventId } = req.query;
    if (!isTerminalId(terminal)) {
      res.status(400).json({ error: 'Unknown terminal, use station | center' });
      return;
    }
    const id = Number(eventId);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'eventId must be a positive integer' });
      return;
    }
    const event = repo.get(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(await routing.route(TERMINALS[terminal], { lat: event.lat, lng: event.lng }));
  });

  return router;
}
