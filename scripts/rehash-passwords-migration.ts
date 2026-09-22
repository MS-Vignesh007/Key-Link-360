/**
 * Standalone Password Storage Audit & Re-hash Migration Script
 *
 * Scans all user accounts in local data-store.json (and Supabase if configured)
 * to audit password hashing strength and convert any plaintext or weakly hashed
 * credentials to secure bcrypt (minimum cost factor: 12).
 *
 * Usage:
 *   npx tsx scripts/rehash-passwords-migration.ts
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  BCRYPT_SALT_ROUNDS,
  hashPassword,
  isBcryptHash,
  PasswordAlgorithm
} from "../server/auth/crypto";

dotenv.config();

interface UserEntry {
  id: string;
  email: string;
  passwordHash: string | null;
  passwordSalt: string | null;
  [key: string]: unknown;
}

function detectHashType(hash: string | null | undefined): { type: PasswordAlgorithm; rounds?: number } {
  if (!hash || typeof hash !== "string") {
    return { type: "legacy_plaintext" };
  }
  const bcryptMatch = hash.match(/^\$2[aby]\$(\d{2})\$/);
  if (bcryptMatch) {
    const rounds = parseInt(bcryptMatch[1], 10);
    if (rounds >= BCRYPT_SALT_ROUNDS) {
      return { type: "bcrypt", rounds };
    }
    return { type: "bcrypt_low_cost", rounds };
  }
  if (hash.length === 128 && /^[0-9a-fA-F]+$/.test(hash)) {
    return { type: "legacy_scrypt" };
  }
  if (hash.length === 64 && /^[0-9a-fA-F]+$/.test(hash)) {
    return { type: "legacy_sha256" };
  }
  if (hash.length === 40 && /^[0-9a-fA-F]+$/.test(hash)) {
    return { type: "legacy_sha1" };
  }
  if (hash.length === 32 && /^[0-9a-fA-F]+$/.test(hash)) {
    return { type: "legacy_md5" };
  }
  return { type: "legacy_plaintext" };
}

async function main() {
  console.log("=================================================");
  console.log("  KEYLINK360 — Password Storage Audit & Migration");
  console.log("=================================================");
  console.log(`Target Standard: Bcrypt (Rounds >= ${BCRYPT_SALT_ROUNDS})\n`);

  const storePath = path.join(process.cwd(), "data-store.json");
  if (!fs.existsSync(storePath)) {
    console.error("❌ data-store.json not found at project root.");
    process.exit(1);
  }

  console.log("📂 Reading data-store.json...");
  const rawContent = fs.readFileSync(storePath, "utf-8");
  const root = JSON.parse(rawContent) as { auth?: { users?: UserEntry[] } };

  const users: UserEntry[] = Array.isArray(root.auth?.users) ? root.auth.users : [];
  console.log(`🔍 Found ${users.length} user account(s) in local store.\n`);

  const summary = {
    total: users.length,
    bcryptCompliant: 0,
    lowCostBcrypt: 0,
    legacyScrypt: 0,
    legacySha256: 0,
    legacySha1: 0,
    legacyMd5: 0,
    plaintextMigrated: 0,
    unknown: 0
  };

  let localStoreMutated = false;

  for (const user of users) {
    const { type, rounds } = detectHashType(user.passwordHash);

    switch (type) {
      case "bcrypt":
        summary.bcryptCompliant++;
        console.log(`  ✓ [Compliant] User: ${user.email} (Bcrypt rounds: ${rounds})`);
        break;

      case "bcrypt_low_cost":
        summary.lowCostBcrypt++;
        console.log(`  ⚠ [Low-Cost Bcrypt] User: ${user.email} (Rounds: ${rounds} < ${BCRYPT_SALT_ROUNDS}) → Queued for on-login rehash.`);
        break;

      case "legacy_scrypt":
        summary.legacyScrypt++;
        console.log(`  ⚡ [Legacy Scrypt] User: ${user.email} → Queued for automatic on-login rehash to bcrypt(${BCRYPT_SALT_ROUNDS}).`);
        break;

      case "legacy_sha256":
        summary.legacySha256++;
        console.log(`  ⚡ [Legacy SHA-256] User: ${user.email} → Queued for automatic on-login rehash to bcrypt(${BCRYPT_SALT_ROUNDS}).`);
        break;

      case "legacy_sha1":
        summary.legacySha1++;
        console.log(`  ⚡ [Legacy SHA-1] User: ${user.email} → Queued for automatic on-login rehash to bcrypt(${BCRYPT_SALT_ROUNDS}).`);
        break;

      case "legacy_md5":
        summary.legacyMd5++;
        console.log(`  ⚡ [Legacy MD5] User: ${user.email} → Queued for automatic on-login rehash to bcrypt(${BCRYPT_SALT_ROUNDS}).`);
        break;

      case "legacy_plaintext":
        if (user.passwordHash) {
          // Immediately re-hash plaintext passwords offline
          const { salt, hash } = hashPassword(user.passwordHash, BCRYPT_SALT_ROUNDS);
          user.passwordHash = hash;
          user.passwordSalt = salt;
          user.updatedAt = new Date().toISOString();
          summary.plaintextMigrated++;
          localStoreMutated = true;
          console.log(`  🔒 [Plaintext Migrated] User: ${user.email} → Immediately hashed with Bcrypt (cost ${BCRYPT_SALT_ROUNDS}).`);
        } else {
          summary.unknown++;
          console.log(`  ℹ [No Password / OAuth] User: ${user.email}`);
        }
        break;
    }
  }

  if (localStoreMutated) {
    fs.writeFileSync(storePath, JSON.stringify(root, null, 2), "utf-8");
    console.log("\n💾 Saved updated credentials to data-store.json.");
  }

  // Supabase sync if credentials available
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key) {
    try {
      console.log("\n☁ Connecting to Supabase to verify auth_users table...");
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data: sbUsers, error: sbErr } = await supabase.from("auth_users").select("id, email, password_hash, password_salt");
      if (!sbErr && Array.isArray(sbUsers)) {
        console.log(`  Found ${sbUsers.length} user record(s) in Supabase.`);
        for (const sbUser of sbUsers) {
          const { type } = detectHashType(sbUser.password_hash);
          if (type === "legacy_plaintext" && sbUser.password_hash) {
            const { salt, hash } = hashPassword(sbUser.password_hash, BCRYPT_SALT_ROUNDS);
            await supabase.from("auth_users").update({
              password_hash: hash,
              password_salt: salt,
              updated_at: new Date().toISOString()
            }).eq("id", sbUser.id);
            console.log(`  🔒 Migrated plaintext user in Supabase: ${sbUser.email}`);
          }
        }
      }
    } catch (sbError) {
      console.warn("  Supabase sync skipped/error:", sbError);
    }
  }

  console.log("\n=================================================");
  console.log("  AUDIT & MIGRATION SUMMARY");
  console.log("=================================================");
  console.log(`  Total User Accounts:       ${summary.total}`);
  console.log(`  Bcrypt (${BCRYPT_SALT_ROUNDS}+ rounds) Active: ${summary.bcryptCompliant}`);
  console.log(`  Plaintext Fixed Offline:   ${summary.plaintextMigrated}`);
  console.log(`  Legacy Hashes Queued:      ${summary.legacyScrypt + summary.legacySha256 + summary.legacySha1 + summary.legacyMd5 + summary.lowCostBcrypt}`);
  console.log(`\n  ✅ On-login transparent migration is active:`);
  console.log(`     Any legacy or weak password hash will be automatically`);
  console.log(`     upgraded to Bcrypt(12) upon next successful login.`);
  console.log("=================================================\n");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
