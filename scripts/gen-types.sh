#!/usr/bin/env bash
# Regenerates src/lib/supabase/database.types.ts from the migrations.
# With local Supabase running:   scripts/gen-types.sh --local
# Without Docker (plain Postgres 15+, uses PGHOST/PGPORT/PGUSER): scripts/gen-types.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/lib/supabase/database.types.ts
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
# config.toml references this secret; the CLI refuses to load without a well-formed value.
export SEND_CODE_HOOK_SECRET="${SEND_CODE_HOOK_SECRET:-v1,whsec_$(printf 'placeholder-secret-for-type-generation' | base64)}"
if [ "${1:-}" = "--local" ]; then
  pnpm exec supabase gen types typescript --local --schema public > "$TMP"
else
  DB="sokofresh_types_$$"
  createdb "$DB"
  trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true; rm -f "$TMP"' EXIT
  psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/_auth_stub.sql >/dev/null
  for f in supabase/migrations/*.sql; do psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null; done
  HOSTPART="${PGHOST:-localhost}"
  if [[ "$HOSTPART" == /* ]]; then URL="postgresql://${PGUSER:-postgres}@localhost:${PGPORT:-5432}/$DB?host=$HOSTPART"
  else URL="postgresql://${PGUSER:-postgres}${PGPASSWORD:+:$PGPASSWORD}@$HOSTPART:${PGPORT:-5432}/$DB"; fi
  pnpm exec supabase gen types typescript --remote "$URL" --schema public 2>/dev/null > "$TMP"
fi
if ! grep -q "export type Database" "$TMP"; then
  echo "Type generation failed:" >&2; cat "$TMP" >&2; exit 1
fi
mv "$TMP" "$OUT"
pnpm exec prettier --write "$OUT" >/dev/null
echo "wrote $OUT"
