import { Router, type Request, type Response } from 'express';
import type { EventInput } from '@lcn/shared';
import { validateEventInput } from '../domain/validateEvent.ts';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import { requireAdmin } from './auth.ts';
import { notFound, parseId, sendError } from './http.ts';

/** Перевіряє тіло запиту; при помилці сам відповідає 400 і повертає undefined */
function parseEvent(req: Request, res: Response): EventInput | undefined {
  const errors = validateEventInput(req.body);
  if (errors.length) {
    sendError(res, 400, { error: 'Validation failed', details: errors });
    return undefined;
  }
  return req.body as EventInput;
}

/** CRUD подій для сторінки /admin (REQ-1.1) */
export function adminRouter(repo: EventsRepo, adminKey: string) {
  const router = Router();
  router.use(requireAdmin(adminKey));

  router.get('/events', (_req, res) => {
    res.json(repo.list());
  });

  router.post('/events', (req, res) => {
    const input = parseEvent(req, res);
    if (input) res.status(201).json(repo.create(input));
  });

  router.put('/events/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (id === undefined || !repo.get(id)) return notFound(res);
    const input = parseEvent(req, res);
    if (input) res.json(repo.update(id, input));
  });

  router.delete('/events/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (id === undefined || !repo.remove(id)) return notFound(res);
    res.status(204).end();
  });

  return router;
}
