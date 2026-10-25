import type { Response } from 'express';
import type { ApiError } from '@lcn/shared';

/** Єдиний формат відповіді з помилкою: { error, details? } */
export function sendError(res: Response, status: number, error: string | ApiError) {
  res.status(status).json(typeof error === 'string' ? { error } : error);
}

export function notFound(res: Response) {
  sendError(res, 404, 'Event not found');
}

/** Ідентифікатор події з URL або query: додатне ціле число, інакше undefined */
export function parseId(raw: unknown): number | undefined {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}
