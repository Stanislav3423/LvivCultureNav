import {
  partnerSource,
  type EventInput,
  type ImportRejection,
  type ImportResult,
  type PartnerEventInput,
} from '@lcn/shared';
import { validateEventInput } from '../domain/validateEvent.ts';
import type { EventsRepo } from '../repo/eventsRepo.ts';

interface AcceptedEvent {
  externalId: string;
  input: EventInput;
}

type Checked = { accepted: AcceptedEvent } | { rejected: ImportRejection };

/** Перша фаза: перевірка однієї події партнера без звернень до бази */
export function checkPartnerEvent(raw: unknown, index: number): Checked {
  const rawId: unknown = (raw as { externalId?: unknown } | null)?.externalId;
  const externalId = typeof rawId === 'string' ? rawId.trim() : '';
  const errors = validateEventInput(raw);
  if (!externalId) errors.unshift('externalId is required');
  if (errors.length) {
    return { rejected: { index, externalId: typeof rawId === 'string' ? rawId : undefined, errors } };
  }
  const { externalId: _, ...input } = raw as PartnerEventInput;
  return { accepted: { externalId, input } };
}

/** Подія ідентифікується парою (партнер, externalId): повторне надсилання оновлює її */
function upsert(
  repo: EventsRepo,
  source: string,
  { externalId, input }: AcceptedEvent,
): 'created' | 'updated' {
  const existingId = repo.findIdByExternal(source, externalId);
  if (existingId === undefined) {
    repo.create(input, source, externalId);
    return 'created';
  }
  repo.update(existingId, input);
  return 'updated';
}

/** Пакетне поповнення подій від театрів і музеїв (REQ-1.2); некоректні події відхиляються поодинці */
export function importPartnerEvents(repo: EventsRepo, partnerId: string, events: unknown[]): ImportResult {
  const source = partnerSource(partnerId);
  const result: ImportResult = { created: 0, updated: 0, rejected: [] };
  events.forEach((raw, index) => {
    const checked = checkPartnerEvent(raw, index);
    if ('rejected' in checked) result.rejected.push(checked.rejected);
    else result[upsert(repo, source, checked.accepted)]++;
  });
  return result;
}
