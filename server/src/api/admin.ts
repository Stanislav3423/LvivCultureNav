import { Router, type Request, type Response } from 'express';
import type { EventInput } from '@lcn/shared';
import { validateEventInput } from '../domain/validateEvent.ts';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import { requireAdmin } from './auth.ts';

/** Перевіряє тіло запиту; при помилці сам відповідає 400 і повертає undefined */
function parseEvent(req: Request, res: Response): EventInput | undefined {
  const errors = validateEventInput(req.body);
  if (errors.length) {
    res.status(400).json({ error: 'Validation failed', details: errors });
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
    const id = Number(req.params.id);
    if (!repo.get(id)) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    const input = parseEvent(req, res);
    if (input) res.json(repo.update(id, input));
  });

  router.delete('/events/:id', (req, res) => {
    if (!repo.remove(Number(req.params.id))) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.status(204).end();
  });

  return router;
}
