import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN_KEY, makeTestApp, opera } from './helpers.ts';

describe('Адмін-API: CRUD подій із ключем адміністратора (US-07, REQ-1.1)', () => {
  let ctx: ReturnType<typeof makeTestApp>;
  const auth = { 'X-Admin-Key': ADMIN_KEY };

  beforeEach(() => {
    ctx = makeTestApp();
  });

  describe('авторизація', () => {
    it('401 без ключа', async () => {
      await request(ctx.app).get('/api/admin/events').expect(401);
      await request(ctx.app).post('/api/admin/events').send(opera()).expect(401);
    });

    it('401 з неправильним ключем', async () => {
      const res = await request(ctx.app).get('/api/admin/events').set('X-Admin-Key', 'guess').expect(401);
      expect(res.body.error).toBe('Invalid admin key');
    });
  });

  it('GET повертає події з усіма перекладами', async () => {
    ctx.repo.create(opera());
    const res = await request(ctx.app).get('/api/admin/events').set(auth).expect(200);
    expect(res.body).toHaveLength(1);
    expect(Object.keys(res.body[0].translations).sort()).toEqual(['en', 'uk']);
  });

  it('POST створює подію, і вона одразу доступна терміналам', async () => {
    const created = await request(ctx.app).post('/api/admin/events').set(auth).send(opera()).expect(201);
    expect(created.body).toMatchObject({ id: expect.any(Number), source: 'admin' });

    const pub = await request(ctx.app).get(`/api/events/${created.body.id}?lang=en`).expect(200);
    expect(pub.body.title).toBe('Natalka Poltavka');
  });

  it('POST з некоректними даними — 400 з переліком помилок і нічого не зберігає', async () => {
    const res = await request(ctx.app)
      .post('/api/admin/events')
      .set(auth)
      .send(opera({ lat: 50.45, lng: 30.52, startsAt: 'вчора' }))
      .expect(400);
    expect(res.body).toEqual({
      error: 'Validation failed',
      details: ['startsAt must be an ISO date', 'coordinates must be within Lviv'],
    });
    expect(ctx.repo.list()).toHaveLength(0);
  });

  it('PUT оновлює подію і замінює переклади', async () => {
    const { id } = ctx.repo.create(opera());
    const update = opera({
      startsAt: '2026-11-01T19:00',
      translations: {
        uk: { title: 'Запорожець за Дунаєм', venue: 'Львівська опера', category: 'Опера', description: '' },
        pl: { title: 'Zaporożec za Dunajem', venue: 'Opera Lwowska', category: 'Opera', description: '' },
      },
    });

    const res = await request(ctx.app).put(`/api/admin/events/${id}`).set(auth).send(update).expect(200);

    expect(res.body.startsAt).toBe('2026-11-01T19:00');
    expect(Object.keys(res.body.translations).sort()).toEqual(['pl', 'uk']);
  });

  it('PUT неіснуючої події — 404, некоректні дані — 400', async () => {
    await request(ctx.app).put('/api/admin/events/404').set(auth).send(opera()).expect(404);
    const { id } = ctx.repo.create(opera());
    await request(ctx.app)
      .put(`/api/admin/events/${id}`)
      .set(auth)
      .send({ ...opera(), translations: {} })
      .expect(400);
  });

  it('DELETE видаляє подію разом з перекладами', async () => {
    const { id } = ctx.repo.create(opera());
    await request(ctx.app).delete(`/api/admin/events/${id}`).set(auth).expect(204);
    await request(ctx.app).delete(`/api/admin/events/${id}`).set(auth).expect(404);
    await request(ctx.app).get(`/api/events/${id}`).expect(404);
    expect(ctx.db.prepare('SELECT COUNT(*) AS n FROM event_translations').get()).toEqual({ n: 0 });
  });

  it('400 на зламаний JSON', async () => {
    const res = await request(ctx.app)
      .post('/api/admin/events')
      .set(auth)
      .set('Content-Type', 'application/json')
      .send('{"startsAt":')
      .expect(400);
    expect(res.body.error).toBe('Invalid JSON body');
  });
});
