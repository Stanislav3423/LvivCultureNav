import { describe, expect, it } from 'vitest';
import { parsePartnerKeys } from '../../src/config.ts';
import { findPartnerId, keysMatch } from '../../src/api/auth.ts';

describe('ключі доступу (US-07, US-08)', () => {
  it('розбирає PARTNER_KEYS з .env', () => {
    expect(parsePartnerKeys('opera:k1, museum : k2,broken,')).toEqual({ opera: 'k1', museum: 'k2' });
    expect(parsePartnerKeys(undefined)).toEqual({});
  });

  it('порівнює ключі', () => {
    expect(keysMatch('secret', 'secret')).toBe(true);
    expect(keysMatch('secret', 'secreT')).toBe(false);
    expect(keysMatch('secret', 'secret-longer')).toBe(false);
    expect(keysMatch('secret', undefined)).toBe(false);
  });

  it('знаходить партнера за ключем', () => {
    const keys = { opera: 'k1', museum: 'k2' };
    expect(findPartnerId(keys, 'k2')).toBe('museum');
    expect(findPartnerId(keys, 'k3')).toBeUndefined();
    expect(findPartnerId(keys, '')).toBeUndefined();
  });
});
