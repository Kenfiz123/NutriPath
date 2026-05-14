import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedData } from "./data/seed.js";
import { loadSqlServerData } from "./sqlserver-import.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_PATH = path.resolve(__dirname, "../data/db.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveDbPath(customPath) {
  const selected = customPath || process.env.NUTRIPATH_DB || DEFAULT_DB_PATH;
  return path.isAbsolute(selected) ? selected : path.resolve(process.cwd(), selected);
}

async function ensureFile(filePath) {
  if (existsSync(filePath)) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(seedData, null, 2), "utf8");
}

export async function createStore(options = {}) {
  if ((options.dataSource || process.env.NUTRIPATH_DATA_SOURCE) === "sqlserver") {
    let cache = await loadSqlServerData();

    return {
      filePath: "sqlserver:NutriPath",
      dataSource: "sqlserver",
      get db() {
        return cache;
      },
      async reload() {
        cache = await loadSqlServerData();
        return cache;
      },
      async save() {
        return cache;
      },
      async reset() {
        cache = await loadSqlServerData();
        return cache;
      },
      nextId(prefix, collection) {
        const next = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const id = `${prefix}-${next}`;
        if (!Array.isArray(collection) || !collection.some((item) => item.id === id)) return id;
        return `${prefix}-${next}-${collection.length + 1}`;
      },
    };
  }

  const filePath = resolveDbPath(options.dbPath);
  await ensureFile(filePath);

  let cache = JSON.parse(await readFile(filePath, "utf8"));

  async function persist() {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(cache, null, 2), "utf8");
  }

  return {
    filePath,
    get db() {
      return cache;
    },
    async reload() {
      cache = JSON.parse(await readFile(filePath, "utf8"));
      return cache;
    },
    async save() {
      await persist();
      return cache;
    },
    async reset() {
      cache = clone(seedData);
      await persist();
      return cache;
    },
    nextId(prefix, collection) {
      const next = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const id = `${prefix}-${next}`;
      if (!Array.isArray(collection) || !collection.some((item) => item.id === id)) return id;
      return `${prefix}-${next}-${collection.length + 1}`;
    },
  };
}

export function cloneRecord(value) {
  return clone(value);
}
