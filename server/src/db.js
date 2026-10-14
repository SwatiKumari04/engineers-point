import { MongoClient } from "mongodb";
import { config } from "./config.js";
import { MENU_SEED } from "./data/menu.seed.js";

const client = new MongoClient(config.mongoUri);
let db;

// dbName override lets tests point at a separate database.
export async function connectDb(dbName = config.dbName) {
  await client.connect();
  db = client.db(dbName);
  console.log("MongoDB connected");
  await seedMenu();
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected yet");
  return db;
}

export async function closeDb() {
  await client.close();
}

// Test helper: wipe every collection and re-seed the menu for a clean slate.
export async function resetDatabase() {
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.collection(c.name).deleteMany({});
  }
  await seedMenu();
}

async function seedMenu() {
  const menu = db.collection("menu");
  await menu.createIndex({ id: 1 }, { unique: true });
  const ops = MENU_SEED.map((item) => ({
    updateOne: {
      filter: { id: item.id },
      update: { $setOnInsert: { ...item, available: true } },
      upsert: true,
    },
  }));
  await menu.bulkWrite(ops);
}