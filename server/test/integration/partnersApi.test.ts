import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { PartnerEventInput } from '@lcn/shared';
import { PARTNER_KEYS, makeTestApp, opera } from './helpers.ts';

const auth = { 'X-Partner-Key': PARTNER_KEYS.opera };

function partnerEvent(externalId: string, title: string): PartnerEventInput {
  const base = opera();
  return {
    ...base,
    externalId,
    translations: { ...base.translations, uk: { ...base.translations.uk!, title } },
  };
}

describe('POST /api/partners/import — обмін подіями з партнерами (US-08, REQ-1.2)', () => {
  it('відхиляє невідомого партнера і некоректне тіло', async () => {
    const { app } = makeTestApp();
    await request(app).post('/api/partners/import').send({ events: [] }).expect(401);
    await request(app)
      .post('/api/partners/import')
      .set('X-Partner-Key', 'stolen')
      .send({ events: [] })
      .expect(401);
    const bad = await request(app).post('/api/partners/import').set(auth).send({ events: 'all' }).expect(400);
    expect(bad.body.error).toMatch(/events/);
  });

  it('імпортує, оновлює за externalId без дублів і відхиляє некоректні події поодинці', async () => {
    const { app, repo } = makeTestApp();

    const first = await request(app)
      .post('/api/partners/import')
      .set(auth)
      .send({
        events: [
          partnerEvent('op-1', 'Травіата'),
          { ...partnerEvent('op-2', 'Кармен'), lat: 0 },
          partnerEvent('', 'Без ідентифікатора'),
        ],
      })
      .expect(200);
    expect(first.body).toEqual({
      created: 1,
      updated: 0,
      rejected: [
        { index: 1, externalId: 'op-2', errors: ['coordinates must be within Lviv'] },
        { index: 2, externalId: '', errors: ['externalId is required'] },
      ],
    });

    const second = await request(app)
      .post('/api/partners/import')
      .set(auth)
      .send({ events: [partnerEvent('op-1', 'Травіата (нова постановка)')] })
      .expect(200);
    expect(second.body).toEqual({ created: 0, updated: 1, rejected: [] });

    const all = repo.list();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ source: 'partner:opera' });
    expect(all[0].translations.uk?.title).toBe('Травіата (нова постановка)');
  });
});
