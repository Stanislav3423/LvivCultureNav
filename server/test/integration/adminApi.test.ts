import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ADMIN_KEY, makeTestApp, opera } from './helpers.ts';

const auth = { 'X-Admin-Key': ADMIN_KEY };

describe('Адмін-API: CRUD подій із ключем адміністратора (US-07, REQ-1.1)', () => {
  it('відхиляє запити без правильного ключа і зламаний JSON', async () => {
    const { app } = makeTestApp();
    await request(app).get('/api/admin/events').expect(401);
    const wrong = await request(app)
      .post('/api/admin/events')
      .set('X-Admin-Key', 'guess')
      .send(opera())
      .expect(401);
    expect(wrong.body.error).toBe('Invalid admin key');

    const broken = await request(app)
      .post('/api/admin/events')
      .set(auth)
      .set('Content-Type', 'application/json')
      .send('{"startsAt":')
      .expect(400);
    expect(broken.body.error).toBe('Invalid JSON body');
  });

  it('створює, читає, оновлює і видаляє подію; некоректні дані — 400', async () => {
    const { app, repo, db } = makeTestApp();

    const invalid = await request(app)
      .post('/api/admin/events')
      .set(auth)
      .send(opera({ lat: 50.45, lng: 30.52, startsAt: 'вчора' }))
      .expect(400);
    expect(invalid.body).toEqual({
      error: 'Validation failed',
      details: ['startsAt must be an ISO date', 'coordinates must be within Lviv'],
    });
    expect(repo.list()).toHaveLength(0);

    const created = await request(app).post('/api/admin/events').set(auth).send(opera()).expect(201);
    const id = created.body.id;
    expect(created.body.source).toBe('admin');
    expect((await request(app).get(`/api/events/${id}?lang=en`).expect(200)).body.title).toBe(
      'Natalka Poltavka',
    );

    const all = await request(app).get('/api/admin/events').set(auth).expect(200);
    expect(Object.keys(all.body[0].translations).sort()).toEqual(['en', 'uk']);

    const update = opera({
      startsAt: '2026-11-01T19:00',
      translations: {
        pl: { title: 'Zaporożec za Dunajem', venue: 'Opera', category: '', description: '' },
        uk: opera().translations.uk,
      },
    });
    const updated = await request(app).put(`/api/admin/events/${id}`).set(auth).send(update).expect(200);
    expect(updated.body.startsAt).toBe('2026-11-01T19:00');
    expect(Object.keys(updated.body.translations).sort()).toEqual(['pl', 'uk']);
    await request(app)
      .put(`/api/admin/events/${id}`)
      .set(auth)
      .send({ ...opera(), translations: {} })
      .expect(400);
    await request(app).put('/api/admin/events/404').set(auth).send(opera()).expect(404);

    await request(app).delete(`/api/admin/events/${id}`).set(auth).expect(204);
    await request(app).delete(`/api/admin/events/${id}`).set(auth).expect(404);
    expect(db.prepare('SELECT COUNT(*) AS n FROM event_translations').get()).toEqual({ n: 0 }); // каскадно
  });
});
