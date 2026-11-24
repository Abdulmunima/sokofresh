#!/usr/bin/env bash
# Runs every migration plus supabase/tests/*.test.sql against a throwaway database on plain Postgres 15+.
# Usage: PGHOST=... PGPORT=... PGUSER=... scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="sokofresh_test_$$"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true' EXIT
"${PSQL[@]}" -d "$DB" -f supabase/tests/_auth_stub.sql >/dev/null
"${PSQL[@]}" -d "$DB" -c "grant usage on schema public to anon, authenticated; alter default privileges in schema public grant all on tables to anon, authenticated, service_role; alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;" >/dev/null
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -d "$DB" -f "$f" >/dev/null; done
[ -f supabase/seed.sql ] && "${PSQL[@]}" -d "$DB" -f supabase/seed.sql >/dev/null && echo "seed: ok"
fail=0
for t in supabase/tests/*.test.sql; do
  if "${PSQL[@]}" -o /dev/null -d "$DB" -f "$t" 2>&1 | sed "s/^psql:[^ ]* //"; [ "${PIPESTATUS[0]}" -eq 0 ]; then echo "PASS $t"; else echo "FAIL $t"; fail=1; fi
done
exit $fail
