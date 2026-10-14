import { Router } from 'express';
import { isLang, type EventFull, type EventView, type Lang } from '@lcn/shared';
import { localize } from '../domain/localize.ts';
import type { EventsRepo } from '../repo/eventsRepo.ts';

export function toView(e: EventFull, lang: Lang): EventView {
  return {
    id: e.id,
    ...localize(e.translations, lang),
    startsAt: e.startsAt,
    lat: e.lat,
    lng: e.lng,
    mediaUrl: e.mediaUrl,
  };
}

/** Публічне API для терміналів: тільки читання, локалізований контент */
export function eventsRouter(repo: EventsRepo) {
  const router = Router();

  router.use((req, res, next) => {
    const lang = req.query.lang ?? 'uk';
    if (!isLang(lang)) {
      res.status(400).json({ error: 'Unsupported lang, use uk | en | pl' });
      return;
    }
    res.locals.lang = lang;
    next();
  });

  router.get('/', (_req, res) => {
    res.json(repo.list().map((e) => toView(e, res.locals.lang)));
  });

  router.get('/:id', (req, res) => {
    const event = repo.get(Number(req.params.id));
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(toView(event, res.locals.lang));
  });

  return router;
}
