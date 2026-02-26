-- Fix migration checksums after editing migration files.
-- Run this once against your database, then run: npx prisma migrate dev
-- Example with connection string: psql "$DATABASE_URL" -f prisma/migrations/fix-checksums.sql

UPDATE _prisma_migrations SET checksum = 'fdfc98686b96155bf5a72aaf2b801a930c12bc6ec7da8a3bf66c09cb25382a33' WHERE migration_name = '20250218180000_update_pricing_structure';
UPDATE _prisma_migrations SET checksum = '53fc1113dc97a4476708c625dab28c463bb2150f0f2d13864eda2f8c203e7d44' WHERE migration_name = '20260218120000_update_package_types';
UPDATE _prisma_migrations SET checksum = '52a2b5516cfadd97e3abdc3cd70db00313daebe887a8588bb9b94b24aa744b4b' WHERE migration_name = '20260218173909_update_package_types';
