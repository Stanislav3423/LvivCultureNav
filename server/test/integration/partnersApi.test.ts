import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PartnerEventInput } from '@lcn/shared';
import { PARTNER_KEYS, makeTestApp, opera } from './helpers.ts';

function partnerEvent(externalId: string, title: string): PartnerEventInput {
  const base = opera();
  return {
    ...base,
    externalId,
    translations: { ...base.translations, uk: { ...base.translations.uk!, title } },
  };
}

describe('POST /api/partners/import — обмін подіями з партнерами (US-08, REQ-1.2)', () => {
  let ctx: ReturnType<typeof makeTestApp>;
  const auth = { 'X-Partner-Key': PARTNER_KEYS.opera };

  beforeEach(() => {
    ctx = makeTestApp();
  });

  it('401 без ключа партнера або з невідомим ключем', async () => {
    await request(ctx.app).post('/api/partners/import').send({ events: [] }).expect(401);
    await request(ctx.app)
      .post('/api/partners/import')
      .set('X-Partner-Key', 'stolen')
      .send({ events: [] })
      .expect(401);
  });

  it('імпортує нові події, позначаючи джерело партнера', async () => {
    const res = await request(ctx.app)
      .post('/api/partners/import')
      .set(auth)
      .send({ events: [partnerEvent('op-1', 'Травіата'), partnerEvent('op-2', 'Кармен')] })
      .expect(200);

    expect(res.body).toEqual({ created: 2, updated: 0, rejected: [] });
    expect(ctx.repo.list().map((e) => e.source)).toEqual(['partner:opera', 'partner:opera']);
  });

  it('повторний імпорт з тим самим externalId оновлює подію, а не дублює', async () => {
    await request(ctx.app)
      .post('/api/partners/import')
      .set(auth)
      .send({ events: [partnerEvent('op-1', 'Травіата')] });

    const res = await request(ctx.app)
      .post('/api/partners/import')
      .set(auth)
      .send({ events: [partnerEvent('op-1', 'Травіата (нова постановка)')] })
      .expect(200);

    expect(res.body).toEqual({ created: 0, updated: 1, rejected: [] });
    const all = ctx.repo.list();
    expect(all).toHaveLength(1);
    expect(all[0].translations.uk?.title).toBe('Травіата (нова постановка)');
  });

  it('некоректні події відхиляються поодинці, решта імпортується', async () => {
    const res = await request(ctx.app)
      .post('/api/partners/import')
      .set(auth)
      .send({
        events: [
          partnerEvent('op-1', 'Травіата'),
          { ...partnerEvent('op-2', 'Кармен'), lat: 0 },
          { ...partnerEvent('', 'Без ідентифікатора') },
        ],
      })
      .expect(200);

    expect(res.body.created).toBe(1);
    expect(res.body.rejected).toEqual([
      { index: 1, externalId: 'op-2', errors: ['coordinates must be within Lviv'] },
      { index: 2, externalId: '', errors: ['externalId is required'] },
    ]);
  });

  it('400, якщо events — не масив', async () => {
    const res = await request(ctx.app)
      .post('/api/partners/import')
      .set(auth)
      .send({ events: 'all' })
      .expect(400);
    expect(res.body.error).toMatch(/events/);
  });
});
