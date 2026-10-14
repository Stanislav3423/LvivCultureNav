import { Router } from 'express';
import type { ImportResult, PartnerEventInput } from '@lcn/shared';
import { validateEventInput } from '../domain/validateEvent.ts';
import type { EventsRepo } from '../repo/eventsRepo.ts';
import { requirePartner } from './auth.ts';

/**
 * POST /api/partners/import — пакетне поповнення подій від театрів і музеїв (REQ-1.2).
 * Подія ідентифікується парою (партнер, externalId): повторне надсилання оновлює її.
 */
export function partnersRouter(repo: EventsRepo, partnerKeys: Record<string, string>) {
  const router = Router();
  router.use(requirePartner(partnerKeys));

  router.post('/import', (req, res) => {
    const events: unknown = req.body?.events;
    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Body must be { events: [...] }' });
      return;
    }

    const source = `partner:${res.locals.partnerId}`;
    const result: ImportResult = { created: 0, updated: 0, rejected: [] };

    events.forEach((raw, index) => {
      const rawId: unknown = raw?.externalId;
      const externalId = typeof rawId === 'string' ? rawId.trim() : '';
      const errors = validateEventInput(raw);
      if (!externalId) errors.unshift('externalId is required');
      if (errors.length) {
        result.rejected.push({ index, externalId: typeof rawId === 'string' ? rawId : undefined, errors });
        return;
      }

      const { externalId: _, ...input } = raw as PartnerEventInput;
      const existingId = repo.findIdByExternal(source, externalId);
      if (existingId === undefined) {
        repo.create(input, source, externalId);
        result.created++;
      } else {
        repo.update(existingId, input);
        result.updated++;
      }
    });

    res.json(result);
  });

  return router;
}
