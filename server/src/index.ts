import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createApp } from './api/app.ts';
import { loadConfig } from './config.ts';
import { openDb } from './repo/db.ts';
import { createEventsRepo } from './repo/eventsRepo.ts';
import { seedIfEmpty } from './seed/seed.ts';
import { createOsrmRouting } from './services/routing.ts';

const config = loadConfig();
const db = openDb(config.dbFile);
const repo = createEventsRepo(db);

const seeded = seedIfEmpty(repo);
if (seeded) console.info(`Empty database — seeded ${seeded} demo events`);

const routing = createOsrmRouting({
  baseUrl: config.osrmUrl,
  userAgent: config.osrmUserAgent,
  minIntervalMs: 1000,
});

const app = createApp({ repo, routing, adminKey: config.adminKey, partnerKeys: config.partnerKeys });

// Зібраний клієнт (npm run build) роздається тим самим сервером
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.info(`LvivCultureNav server: http://localhost:${config.port}`);
});
