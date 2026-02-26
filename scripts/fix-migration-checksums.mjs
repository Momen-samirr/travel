#!/usr/bin/env node
/**
 * Fix Prisma migration checksums after editing migration files.
 * Run: node scripts/fix-migration-checksums.mjs
 * Then run the printed SQL against your database (e.g. psql or Prisma Studio raw SQL).
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "prisma", "migrations");

const migrations = [
  "20250218180000_update_pricing_structure",
  "20260218120000_update_package_types",
  "20260218173909_update_package_types",
];

console.log("-- Run this SQL against your database to fix migration checksums:\n");

for (const name of migrations) {
  const path = join(migrationsDir, name, "migration.sql");
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch (e) {
    console.error(`Could not read ${path}:`, e.message);
    continue;
  }
  const checksum = createHash("sha256").update(content).digest("hex");
  console.log(
    `UPDATE _prisma_migrations SET checksum = '${checksum}' WHERE migration_name = '${name}';`
  );
}

console.log("\n-- Then run: npx prisma migrate dev");
