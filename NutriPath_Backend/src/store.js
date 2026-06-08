import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { healthyBeverageFoods, healthyDrinkRecipes, seedData } from "./data/seed.js";
import { loadSqlServerData } from "./sqlserver-import.js";
import { loadSupabaseData, persistSupabaseData, resetSupabaseData } from "./supabase-postgres-store.js";

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

function normalizeCatalogData(db) {
  if (!db || typeof db !== "object") return db;

  if (Array.isArray(db.foods)) {
    const healthyBeverageIds = new Set(healthyBeverageFoods.map((food) => food.id));
    const retainedFoods = db.foods.filter((food) => !healthyBeverageIds.has(food.id));
    db.foods = [...retainedFoods, ...clone(healthyBeverageFoods)];
  }

  if (Array.isArray(db.recipes)) {
    const healthyRecipeIds = new Set(healthyDrinkRecipes.map((recipe) => recipe.id));
    const retainedRecipes = db.recipes.filter((recipe) => !healthyRecipeIds.has(recipe.id));
    db.recipes = [...retainedRecipes, ...clone(healthyDrinkRecipes)];
  }

  if (Array.isArray(db.mealLogs)) {
    for (const log of db.mealLogs) {
      if (log.waterMl === undefined && log.waterGlasses !== undefined) {
        log.waterMl = Math.max(0, Math.round((Number(log.waterGlasses) || 0) * 250));
      }
    }
  }

  return db;
}

export async function createStore(options = {}) {
  const dataSource = String(options.dataSource || process.env.NUTRIPATH_DATA_SOURCE || "json").toLowerCase();
  if (dataSource === "sqlserver") {
    let cache = normalizeCatalogData(await loadSqlServerData());

    return {
      filePath: "sqlserver:NutriPath",
      dataSource: "sqlserver",
      get db() {
        return cache;
      },
      async reload() {
        cache = normalizeCatalogData(await loadSqlServerData());
        return cache;
      },
      async save() {
        return cache;
      },
      async reset() {
        cache = normalizeCatalogData(await loadSqlServerData());
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

  if (["supabase", "postgres", "postgresql"].includes(dataSource)) {
    let cache = normalizeCatalogData(await loadSupabaseData());

    return {
      filePath: "supabase:postgresql",
      dataSource: "supabase",
      get db() {
        return cache;
      },
      async reload() {
        cache = normalizeCatalogData(await loadSupabaseData());
        return cache;
      },
      async save() {
        await persistSupabaseData(cache);
        return cache;
      },
      async reset() {
        cache = normalizeCatalogData(await resetSupabaseData());
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

  let cache = normalizeCatalogData(JSON.parse(await readFile(filePath, "utf8")));

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
      cache = normalizeCatalogData(JSON.parse(await readFile(filePath, "utf8")));
      return cache;
    },
    async save() {
      await persist();
      return cache;
    },
    async reset() {
      cache = normalizeCatalogData(clone(seedData));
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
