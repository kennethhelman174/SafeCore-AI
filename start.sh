#!/bin/sh

echo "Starting Workplace Safety Platform bootstrap..."

attempts=0
max_attempts=30

while [ $attempts -lt $max_attempts ]; do
  node scripts/check-db.js
  if [ $? -eq 0 ]; then
    echo "Database is ready!"
    break
  fi
  attempts=$((attempts + 1))
  echo "Database not ready yet (Attempt $attempts/$max_attempts). Retrying in 2 seconds..."
  sleep 2
done

if [ $attempts -eq $max_attempts ]; then
  echo "FATAL: Database could not be reached after $max_attempts attempts. Exiting."
  exit 1
fi

echo "Running prisma migrations deployment..."
npx prisma migrate deploy

if [ "$SEED_DATABASE" = "true" ]; then
  echo "SEED_DATABASE is set to true. Seeding database..."
  npm run db:seed
else
  echo "SEED_DATABASE is not set to true. Skipping seed."
fi

echo "Starting application server..."
exec npm run start
