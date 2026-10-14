// npm run seed — перезаповнює базу демонстраційними подіями
import { loadConfig } from '../config.ts';
import { openDb } from '../repo/db.ts';
import { createEventsRepo } from '../repo/eventsRepo.ts';
import { SEED_EVENTS } from './events.ts';

const config = loadConfig();
const db = openDb(config.dbFile);
db.exec('DELETE FROM events');
const repo = createEventsRepo(db);
for (const e of SEED_EVENTS) repo.create(e);
console.info(`Seeded ${SEED_EVENTS.length} events into ${config.dbFile}`);
db.close();
