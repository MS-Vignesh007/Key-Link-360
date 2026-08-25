/**
 * One-shot migration: data-store.json → Supabase (app_kv + all normalized tables).
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * Requires .env (or env vars):
 *   SUPABASE_URL=
 *   SUPABASE_SERVICE_ROLE_KEY=
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { syncRootToNormalizedTables } from "../server/db/syncNormalized";

dotenv.config();

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env / .env");
    console.error("");
    console.error("Add these two lines to your project .env file:");
    console.error('  SUPABASE_URL=https://YOUR_PROJECT.supabase.co');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role_jwt...');
    console.error("");
    console.error(`Currently loaded: SUPABASE_URL=${url ? "yes" : "NO"}, SUPABASE_SERVICE_ROLE_KEY=${key ? "yes" : "NO"}`);
    process.exit(1);
  }

  const storePath = path.join(process.cwd(), "data-store.json");
  if (!fs.existsSync(storePath)) {
    console.error("data-store.json not found at project root.");
    process.exit(1);
  }

  console.log("Reading data-store.json...");
  const root = JSON.parse(fs.readFileSync(storePath, "utf-8")) as Record<string, unknown>;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log("Upserting app_kv root blob...");
  const { error: kvError } = await supabase.from("app_kv").upsert(
    { key: "root", value: root, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (kvError) {
    console.error("app_kv failed:", kvError.message);
    console.error("Did you run supabase/schema.sql in the SQL Editor?");
    process.exit(1);
  }

  console.log("Migrating all fields into normalized tables...");
  const result = await syncRootToNormalizedTables(supabase, root);
  if (!result.ok) {
    console.error("Normalized migrate failed:", result.error);
    console.error("Did you run the latest supabase/schema.sql?");
    process.exit(1);
  }

  console.log("Migration complete.");
  console.log(JSON.stringify(result.counts, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
