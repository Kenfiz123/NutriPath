import { seedData } from "./data/seed.js";

let poolPromise = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getConnectionString() {
  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("Missing SUPABASE_DATABASE_URL, DATABASE_URL, or POSTGRES_URL for Supabase normalized data source.");
  }
  return connectionString;
}

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid PostgreSQL identifier: ${identifier}`);
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function getSchema() {
  return process.env.NUTRIPATH_SUPABASE_SCHEMA || "public";
}

function table(name) {
  return `${quoteIdentifier(getSchema())}.${quoteIdentifier(name)}`;
}

function legacyAppStateTable() {
  const configured = process.env.NUTRIPATH_SUPABASE_TABLE || "public.nutripath_app_state";
  const parts = configured.split(".");
  if (parts.length === 1) return `${quoteIdentifier("public")}.${quoteIdentifier(parts[0])}`;
  if (parts.length === 2) return `${quoteIdentifier(parts[0])}.${quoteIdentifier(parts[1])}`;
  throw new Error("NUTRIPATH_SUPABASE_TABLE must be a table name or schema.table.");
}

async function getPgPool() {
  if (!poolPromise) {
    poolPromise = import("pg")
      .then(({ Pool }) => {
        const sslDisabled = process.env.SUPABASE_DATABASE_SSL === "false";
        return new Pool({
          connectionString: getConnectionString(),
          max: Number(process.env.SUPABASE_DATABASE_POOL_MAX || 5),
          ssl: sslDisabled ? false : { rejectUnauthorized: process.env.SUPABASE_DATABASE_SSL_REJECT_UNAUTHORIZED === "true" },
        });
      })
      .catch((error) => {
        if (error?.code === "ERR_MODULE_NOT_FOUND" || /Cannot find package 'pg'/.test(String(error?.message || ""))) {
          throw new Error("Missing backend dependency 'pg'. Run `npm install` in NutriPath_Backend before using Supabase PostgreSQL.");
        }
        throw error;
      });
  }
  return poolPromise;
}

async function ensureNormalizedSchema(pool) {
  const schema = quoteIdentifier(getSchema());
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${table("nutripath_members")} (
      id text PRIMARY KEY,
      email text UNIQUE NOT NULL,
      name text NOT NULL,
      tier text,
      role text,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_foods")} (
      id text PRIMARY KEY,
      name text NOT NULL,
      category text NOT NULL,
      calories numeric,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_plans")} (
      id text PRIMARY KEY,
      name text NOT NULL,
      monthly_price integer,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_meal_logs")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      log_date date NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (member_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_recipes")} (
      id text PRIMARY KEY,
      name text NOT NULL,
      calories integer,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_personalized_recipes")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      name text NOT NULL,
      generated_at timestamptz,
      saved_at timestamptz,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_payments")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      invoice text UNIQUE,
      status text,
      paid_at timestamptz,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_auth_credentials")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      email text UNIQUE NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_oauth_identities")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      provider text,
      provider_user_id text,
      email text,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_chat_messages")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      sender text,
      message_time timestamptz,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_notifications")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      notification_key text,
      read_at timestamptz,
      created_at timestamptz,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_personal_foods")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      name text NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_coach_plans")} (
      id text PRIMARY KEY,
      member_id text NOT NULL,
      created_at timestamptz,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_ai_safety_logs")} (
      id text PRIMARY KEY,
      created_at timestamptz,
      data jsonb NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_reference_items")} (
      collection text NOT NULL,
      item_id text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, item_id)
    );

    CREATE TABLE IF NOT EXISTS ${table("nutripath_settings")} (
      setting_key text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS nutripath_foods_category_idx ON ${table("nutripath_foods")} (category);
    CREATE INDEX IF NOT EXISTS nutripath_meal_logs_member_date_idx ON ${table("nutripath_meal_logs")} (member_id, log_date DESC);
    CREATE INDEX IF NOT EXISTS nutripath_payments_member_paid_idx ON ${table("nutripath_payments")} (member_id, paid_at DESC);
    CREATE INDEX IF NOT EXISTS nutripath_chat_messages_member_time_idx ON ${table("nutripath_chat_messages")} (member_id, message_time DESC);
    CREATE INDEX IF NOT EXISTS nutripath_notifications_member_read_idx ON ${table("nutripath_notifications")} (member_id, read_at);
  `);
}

function asJson(value) {
  return JSON.stringify(value ?? null);
}

function dated(value) {
  return value || null;
}

async function loadRows(pool, tableName, orderBy = "id") {
  const result = await pool.query(`SELECT data FROM ${table(tableName)} ORDER BY ${orderBy};`);
  return result.rows.map((row) => row.data);
}

async function loadReferenceCollections(pool) {
  const result = await pool.query(`SELECT collection, data FROM ${table("nutripath_reference_items")} ORDER BY collection, sort_order, item_id;`);
  const collections = {};
  for (const row of result.rows) {
    collections[row.collection] ??= [];
    collections[row.collection].push(row.data);
  }
  return collections;
}

async function loadSettings(pool) {
  const result = await pool.query(`SELECT setting_key, data FROM ${table("nutripath_settings")};`);
  return Object.fromEntries(result.rows.map((row) => [row.setting_key, row.data]));
}

async function loadLegacyAppState(pool) {
  try {
    const stateKey = process.env.NUTRIPATH_SUPABASE_STATE_KEY || "default";
    const result = await pool.query(`SELECT data FROM ${legacyAppStateTable()} WHERE id = $1;`, [stateKey]);
    return result.rows[0]?.data || null;
  } catch {
    return null;
  }
}

function withMeta(data) {
  const next = clone(data || seedData);
  next.meta = {
    ...(next.meta || {}),
    name: "NutriPath API",
    version: "1.0.0",
    source: "supabase-normalized",
    loadedAt: new Date().toISOString(),
  };
  return next;
}

function normalizeInitialState(data) {
  const next = withMeta(data || seedData);
  next.activityLevels ??= clone(seedData.activityLevels);
  next.exerciseTypes ??= clone(seedData.exerciseTypes);
  next.members ??= [];
  next.foods ??= clone(seedData.foods);
  next.mealLogs ??= [];
  next.weeklyProgress ??= [];
  next.personalizedRecipes ??= [];
  next.recipes ??= clone(seedData.recipes);
  next.plans ??= clone(seedData.plans);
  next.faqs ??= clone(seedData.faqs);
  next.payments ??= [];
  next.authCredentials ??= [];
  next.oauthIdentities ??= [];
  next.chatHistory ??= [];
  next.notifications ??= [];
  next.personalFoods ??= [];
  next.coachPlans ??= [];
  next.aiSafetyLogs ??= [];
  next.chat ??= clone(seedData.chat);
  next.admin ??= clone(seedData.admin);
  return next;
}

export async function loadSupabaseNormalizedData() {
  const pool = await getPgPool();
  await ensureNormalizedSchema(pool);

  const [members, foods, plans] = await Promise.all([
    loadRows(pool, "nutripath_members", "name"),
    loadRows(pool, "nutripath_foods", "category, name"),
    loadRows(pool, "nutripath_plans", "id"),
  ]);

  if (members.length === 0 && foods.length === 0 && plans.length === 0) {
    const initial = normalizeInitialState(await loadLegacyAppState(pool));
    await persistSupabaseNormalizedData(initial);
    return initial;
  }

  const [
    mealLogs,
    recipes,
    personalizedRecipes,
    payments,
    authCredentials,
    oauthIdentities,
    chatHistory,
    notifications,
    personalFoods,
    coachPlans,
    aiSafetyLogs,
    referenceCollections,
    settings,
  ] = await Promise.all([
    loadRows(pool, "nutripath_meal_logs", "log_date, id"),
    loadRows(pool, "nutripath_recipes", "name"),
    loadRows(pool, "nutripath_personalized_recipes", "saved_at DESC NULLS LAST, generated_at DESC NULLS LAST"),
    loadRows(pool, "nutripath_payments", "paid_at DESC NULLS LAST, id"),
    loadRows(pool, "nutripath_auth_credentials", "email"),
    loadRows(pool, "nutripath_oauth_identities", "email"),
    loadRows(pool, "nutripath_chat_messages", "message_time, id"),
    loadRows(pool, "nutripath_notifications", "created_at DESC NULLS LAST, id"),
    loadRows(pool, "nutripath_personal_foods", "updated_at DESC, name"),
    loadRows(pool, "nutripath_coach_plans", "created_at DESC NULLS LAST, id"),
    loadRows(pool, "nutripath_ai_safety_logs", "created_at DESC NULLS LAST, id"),
    loadReferenceCollections(pool),
    loadSettings(pool),
  ]);

  return withMeta({
    meta: settings.meta || seedData.meta,
    activityLevels: referenceCollections.activityLevels || clone(seedData.activityLevels),
    exerciseTypes: referenceCollections.exerciseTypes || clone(seedData.exerciseTypes),
    members,
    foods,
    mealLogs,
    weeklyProgress: referenceCollections.weeklyProgress || [],
    personalizedRecipes,
    recipes,
    plans,
    faqs: referenceCollections.faqs || clone(seedData.faqs),
    payments,
    authCredentials,
    oauthIdentities,
    aiSafetyLogs,
    chatHistory,
    personalFoods,
    coachPlans,
    notifications,
    chat: settings.chat || clone(seedData.chat),
    admin: settings.admin || clone(seedData.admin),
  });
}

async function deleteNormalizedRows(client) {
  const tables = [
    "nutripath_ai_safety_logs",
    "nutripath_coach_plans",
    "nutripath_personal_foods",
    "nutripath_notifications",
    "nutripath_chat_messages",
    "nutripath_oauth_identities",
    "nutripath_auth_credentials",
    "nutripath_payments",
    "nutripath_personalized_recipes",
    "nutripath_recipes",
    "nutripath_meal_logs",
    "nutripath_plans",
    "nutripath_foods",
    "nutripath_members",
    "nutripath_reference_items",
    "nutripath_settings",
  ];
  for (const tableName of tables) await client.query(`DELETE FROM ${table(tableName)};`);
}

async function insertReferenceItems(client, collection, items = []) {
  for (const [index, item] of items.entries()) {
    const itemId = item.id || item.date || item.day || String(index + 1);
    await client.query(
      `INSERT INTO ${table("nutripath_reference_items")} (collection, item_id, sort_order, data) VALUES ($1, $2, $3, $4::jsonb);`,
      [collection, String(itemId), index, asJson(item)],
    );
  }
}

export async function persistSupabaseNormalizedData(data) {
  const pool = await getPgPool();
  await ensureNormalizedSchema(pool);
  const state = normalizeInitialState(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await deleteNormalizedRows(client);

    for (const member of state.members || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_members")} (id, email, name, tier, role, data) VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
        [member.id, member.email, member.name, member.tier || null, member.role || null, asJson(member)],
      );
    }

    for (const food of state.foods || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_foods")} (id, name, category, calories, data) VALUES ($1, $2, $3, $4, $5::jsonb);`,
        [food.id, food.name, food.category, Number(food.calories) || 0, asJson(food)],
      );
    }

    for (const plan of state.plans || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_plans")} (id, name, monthly_price, data) VALUES ($1, $2, $3, $4::jsonb);`,
        [plan.id, plan.name, Number(plan.monthlyPrice) || 0, asJson(plan)],
      );
    }

    for (const log of state.mealLogs || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_meal_logs")} (id, member_id, log_date, data) VALUES ($1, $2, $3, $4::jsonb);`,
        [log.id, log.memberId, log.date, asJson(log)],
      );
    }

    for (const recipe of state.recipes || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_recipes")} (id, name, calories, data) VALUES ($1, $2, $3, $4::jsonb);`,
        [recipe.id, recipe.name, Number(recipe.calories) || 0, asJson(recipe)],
      );
    }

    for (const recipe of state.personalizedRecipes || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_personalized_recipes")} (id, member_id, name, generated_at, saved_at, data) VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
        [recipe.id, recipe.memberId, recipe.name, dated(recipe.generatedAt), dated(recipe.savedAt), asJson(recipe)],
      );
    }

    for (const payment of state.payments || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_payments")} (id, member_id, invoice, status, paid_at, data) VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
        [payment.id, payment.memberId, payment.invoice || null, payment.status || null, dated(payment.paidAt), asJson(payment)],
      );
    }

    for (const credential of state.authCredentials || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_auth_credentials")} (id, member_id, email, data) VALUES ($1, $2, $3, $4::jsonb);`,
        [credential.id, credential.memberId, credential.email, asJson(credential)],
      );
    }

    for (const identity of state.oauthIdentities || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_oauth_identities")} (id, member_id, provider, provider_user_id, email, data) VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
        [identity.id, identity.memberId, identity.provider || identity.providerName || null, identity.providerUserId || null, identity.email || null, asJson(identity)],
      );
    }

    for (const [index, message] of (state.chatHistory || []).entries()) {
      await client.query(
        `INSERT INTO ${table("nutripath_chat_messages")} (id, member_id, sender, message_time, data) VALUES ($1, $2, $3, $4, $5::jsonb);`,
        [message.id || `chat-${index + 1}`, message.memberId, message.sender || null, dated(message.time), asJson(message)],
      );
    }

    for (const notification of state.notifications || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_notifications")} (id, member_id, notification_key, read_at, created_at, data) VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
        [notification.id, notification.memberId, notification.key || null, dated(notification.readAt), dated(notification.createdAt), asJson(notification)],
      );
    }

    for (const food of state.personalFoods || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_personal_foods")} (id, member_id, name, data) VALUES ($1, $2, $3, $4::jsonb);`,
        [food.id, food.memberId, food.name, asJson(food)],
      );
    }

    for (const plan of state.coachPlans || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_coach_plans")} (id, member_id, created_at, data) VALUES ($1, $2, $3, $4::jsonb);`,
        [plan.id, plan.memberId, dated(plan.createdAt || plan.generatedAt), asJson(plan)],
      );
    }

    for (const log of state.aiSafetyLogs || []) {
      await client.query(
        `INSERT INTO ${table("nutripath_ai_safety_logs")} (id, created_at, data) VALUES ($1, $2, $3::jsonb);`,
        [log.id, dated(log.createdAt || log.time), asJson(log)],
      );
    }

    await insertReferenceItems(client, "activityLevels", state.activityLevels);
    await insertReferenceItems(client, "exerciseTypes", state.exerciseTypes);
    await insertReferenceItems(client, "weeklyProgress", state.weeklyProgress);
    await insertReferenceItems(client, "faqs", state.faqs);

    await client.query(`INSERT INTO ${table("nutripath_settings")} (setting_key, data) VALUES ($1, $2::jsonb), ($3, $4::jsonb), ($5, $6::jsonb);`, [
      "meta",
      asJson(state.meta),
      "chat",
      asJson(state.chat),
      "admin",
      asJson(state.admin),
    ]);

    await client.query("COMMIT");
    return state;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function resetSupabaseNormalizedData() {
  const initial = normalizeInitialState(seedData);
  await persistSupabaseNormalizedData(initial);
  return initial;
}

export async function closeSupabaseNormalizedPool() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  await pool.end();
  poolPromise = null;
}
