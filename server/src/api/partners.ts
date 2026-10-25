import { Router } from 'express';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import { importPartnerEvents } from '../services/partnerImport.ts';
import { requirePartner } from './auth.ts';
import { sendError } from './http.ts';

/** POST /api/partners/import — пакетне поповнення подій від театрів і музеїв (REQ-1.2) */
export function partnersRouter(repo: EventsRepo, partnerKeys: Record<string, string>) {
  const router = Router();
  router.use(requirePartner(partnerKeys));

  router.post('/import', (req, res) => {
    const events: unknown = req.body?.events;
    if (!Array.isArray(events)) return sendError(res, 400, 'Body must be { events: [...] }');
    res.json(importPartnerEvents(repo, res.locals.partnerId, events));
  });

  return router;
}
