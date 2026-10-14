import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export interface Config {
  port: number;
  dbFile: string;
  adminKey: string;
  partnerKeys: Record<string, string>;
  osrmUrl: string;
  osrmUserAgent: string;
  clientDist: string;
}

/** "opera:key1,museum:key2" → { opera: 'key1', museum: 'key2' } */
export function parsePartnerKeys(raw: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of (raw ?? '').split(',')) {
    const [id, key] = pair.split(':').map((s) => s.trim());
    if (id && key) result[id] = key;
  }
  return result;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const envFile = path.join(ROOT_DIR, '.env');
  if (env === process.env && fs.existsSync(envFile)) process.loadEnvFile(envFile);

  const adminKey = env.ADMIN_KEY ?? 'admin';
  if (!env.ADMIN_KEY) console.warn('ADMIN_KEY is not set, using the development key "admin"');

  return {
    port: Number(env.PORT ?? 3000),
    dbFile: path.resolve(ROOT_DIR, env.DB_FILE ?? 'server/data/lviv.db'),
    adminKey,
    partnerKeys: parsePartnerKeys(env.PARTNER_KEYS),
    osrmUrl: env.OSRM_URL ?? 'https://routing.openstreetmap.de/routed-foot',
    osrmUserAgent: env.OSRM_USER_AGENT ?? 'LvivCultureNav/0.1 (university lab project)',
    clientDist: path.join(ROOT_DIR, 'client/dist'),
  };
}
