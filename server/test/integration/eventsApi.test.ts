import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp, opera, rynok } from './helpers.ts';

describe('Публічне API подій: Express + репозиторій + SQLite (US-01, US-02, US-04)', () => {
  let ctx: ReturnType<typeof makeTestApp>;
  let operaId: number;

  beforeEach(() => {
    ctx = makeTestApp();
    operaId = ctx.repo.create(opera()).id;
    ctx.repo.create(rynok());
  });

  it('GET /api/events повертає події запитаною мовою, відсортовані за датою', async () => {
    const res = await request(ctx.app).get('/api/events?lang=en').expect(200);
    expect(res.body.map((e: { title: string }) => e.title)).toEqual(['Rynok Fair', 'Natalka Poltavka']);
    expect(res.body[1]).toMatchObject({
      id: operaId,
      lang: 'en',
      venue: 'Lviv Opera',
      startsAt: '2026-10-17T18:00',
      lat: 49.8441,
      lng: 24.0262,
    });
  });

  it('без параметра lang віддає українською', async () => {
    const res = await request(ctx.app).get('/api/events').expect(200);
    expect(res.body[0]).toMatchObject({ lang: 'uk', title: 'Ярмарок на Ринку' });
  });

  it('GET /api/events/:id підставляє запасну мову, якщо перекладу немає', async () => {
    const res = await request(ctx.app).get(`/api/events/${operaId}?lang=pl`).expect(200);
    expect(res.body).toMatchObject({ id: operaId, lang: 'en', title: 'Natalka Poltavka' });
  });

  it('404 для неіснуючої події', async () => {
    const res = await request(ctx.app).get('/api/events/9999').expect(404);
    expect(res.body.error).toBe('Event not found');
  });

  it('400 для непідтримуваної мови', async () => {
    const res = await request(ctx.app).get('/api/events?lang=de').expect(400);
    expect(res.body.error).toMatch(/lang/);
  });

  it('дані зберігаються в SQLite: переклади лежать в окремій таблиці', () => {
    const rows = ctx.db
      .prepare('SELECT lang FROM event_translations WHERE event_id = ? ORDER BY lang')
      .all(operaId);
    expect(rows).toEqual([{ lang: 'en' }, { lang: 'uk' }]);
  });
});
