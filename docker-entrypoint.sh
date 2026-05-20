#!/bin/bash
set -e

# Wait for PostgreSQL
echo "Waiting for PostgreSQL database..."

# Extract db host and port from DATABASE_URL
DB_HOST=$(node -e "if (process.env.DATABASE_URL) { try { const u = new URL(process.env.DATABASE_URL); console.log(u.hostname); } catch(e) { console.log('db'); } } else { console.log('db'); }")
DB_PORT=$(node -e "if (process.env.DATABASE_URL) { try { const u = new URL(process.env.DATABASE_URL); console.log(u.port || '5432'); } catch(e) { console.log('5432'); } } else { console.log('5432'); }")

echo "Database host detected as: $DB_HOST on port: $DB_PORT"

until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "Database at $DB_HOST:$DB_PORT is unavailable - sleeping"
  sleep 1
done
echo "Database is up - running migrations."

# Run migrations
npx prisma migrate deploy

# Optionally seed
if [ "$SEED_DATABASE" = "true" ]; then
  echo "SEED_DATABASE is true, seeding database..."
  npm run db:seed
else
  echo "Skipping database seed."
fi

echo "Starting application..."
exec npm run start
