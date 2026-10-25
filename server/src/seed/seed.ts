import type { EventsRepo } from '../repo/eventsRepo.ts';
import { SEED_EVENTS } from './events.ts';

function insertDemoEvents(repo: EventsRepo): number {
  for (const e of SEED_EVENTS) repo.create(e);
  return SEED_EVENTS.length;
}

/** Порожню базу заповнює демонстраційними подіями; повертає кількість доданих (0 — база не порожня) */
export function seedIfEmpty(repo: EventsRepo): number {
  return repo.list().length === 0 ? insertDemoEvents(repo) : 0;
}

/** Замінює всі події демонстраційними (npm run seed) */
export function reseed(repo: EventsRepo): number {
  repo.clear();
  return insertDemoEvents(repo);
}
