import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable,text,integer } from 'drizzle-orm/sqlite-core';
import { eq,and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
export const events=sqliteTable('events',{id:text('id').primaryKey(),owner:text('owner').notNull(),kind:text('kind').notNull(),createdAt:text('created_at').notNull(),data:text('data').notNull(),synced:integer('synced').notNull().default(0)});
export class Store{
 raw:Database.Database; db:ReturnType<typeof drizzle>;
 constructor(path:string){if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});this.raw=new Database(path);this.raw.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,owner TEXT NOT NULL,kind TEXT NOT NULL,created_at TEXT NOT NULL,data TEXT NOT NULL,synced INTEGER NOT NULL DEFAULT 0); CREATE INDEX IF NOT EXISTS events_owner ON events(owner,created_at)');this.db=drizzle({client:this.raw});}
 list(owner:string,kind?:string){return this.db.select().from(events).where(kind?and(eq(events.owner,owner),eq(events.kind,kind)):eq(events.owner,owner)).all().sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(e=>({...e,data:JSON.parse(e.data)}));}
 append(owner:string,kind:string,data:unknown,id:string=randomUUID(),createdAt=new Date().toISOString(),synced=0){const existing=this.db.select().from(events).where(eq(events.id,id)).get();if(existing){if(existing.owner!==owner)throw Error('Event belongs to another account');if(existing.kind!==kind||!isDeepStrictEqual(JSON.parse(existing.data),data))throw Error('Event identity already used for different content');return existing;}createdAt=new Date(createdAt).toISOString();this.db.insert(events).values({id,owner,kind,createdAt,data:JSON.stringify(data),synced}).run();return {id,owner,kind,createdAt,data:JSON.stringify(data),synced};}
 pending(owner:string){return this.db.select().from(events).where(and(eq(events.owner,owner),eq(events.synced,0))).all();}
 markSynced(owner:string,ids:string[]){for(const id of ids)this.db.update(events).set({synced:1}).where(and(eq(events.owner,owner),eq(events.id,id))).run();}
 close(){this.raw.close();}
}
