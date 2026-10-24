import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ROOT_DIR, loadConfig, parsePartnerKeys } from '../../src/config.ts';
import { findPartnerId, keysMatch } from '../../src/api/auth.ts';

describe('конфігурація і ключі доступу (US-07, US-08)', () => {
  it('читає змінні оточення, а без них бере значення для розробки', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(loadConfig({})).toMatchObject({
      port: 3000,
      dbFile: path.resolve(ROOT_DIR, 'server/data/lviv.db'),
      adminKey: 'admin',
      partnerKeys: {},
      osrmUrl: 'https://routing.openstreetmap.de/routed-foot',
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ADMIN_KEY is not set'));

    expect(
      loadConfig({
        PORT: '8080',
        DB_FILE: 'tmp/test.db',
        ADMIN_KEY: 'secret',
        PARTNER_KEYS: 'opera:k1',
        OSRM_URL: 'http://localhost:5000',
        OSRM_USER_AGENT: 'Test/1.0',
      }),
    ).toMatchObject({
      port: 8080,
      dbFile: path.resolve(ROOT_DIR, 'tmp/test.db'),
      adminKey: 'secret',
      partnerKeys: { opera: 'k1' },
      osrmUrl: 'http://localhost:5000',
      osrmUserAgent: 'Test/1.0',
    });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('розбирає PARTNER_KEYS, порівнює ключі й знаходить партнера', () => {
    const keys = parsePartnerKeys('opera:k1, museum : k2,broken,');
    expect(keys).toEqual({ opera: 'k1', museum: 'k2' });
    expect(parsePartnerKeys(undefined)).toEqual({});

    expect(keysMatch('secret', 'secret')).toBe(true);
    expect(keysMatch('secret', 'secreT')).toBe(false);
    expect(keysMatch('secret', undefined)).toBe(false);

    expect(findPartnerId(keys, 'k2')).toBe('museum');
    expect(findPartnerId(keys, 'k3')).toBeUndefined();
  });
});
