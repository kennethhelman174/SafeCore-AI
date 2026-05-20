#!/bin/bash
set -e

# Wait for PostgreSQL
echo "Waiting for PostgreSQL database..."
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
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
