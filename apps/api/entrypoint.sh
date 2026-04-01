#!/bin/sh
set -e

echo "Syncing database schema..."
npx prisma db push --schema=./prisma/schema.prisma

echo "Starting API..."
exec node dist/server.js
