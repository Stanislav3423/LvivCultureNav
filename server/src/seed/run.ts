// npm run seed — перезаповнює базу демонстраційними подіями
import { loadConfig } from '../config.ts';
import { openDb } from '../repo/db.ts';
import { createEventsRepo } from '../repo/eventsRepo.ts';
import { reseed } from './seed.ts';

const config = loadConfig();
const db = openDb(config.dbFile);
const count = reseed(createEventsRepo(db));
console.info(`Seeded ${count} events into ${config.dbFile}`);
db.close();
