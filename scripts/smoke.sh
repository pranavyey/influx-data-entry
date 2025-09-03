#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-http://localhost:8000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
GRAFANA_URL=${GRAFANA_URL:-http://localhost:3001}
INFLUX_URL=${INFLUX_URL:-http://localhost:8086}
INFLUX_ORG=${INFLUXDB_ORG:-my-org}
INFLUX_BUCKET=${INFLUXDB_BUCKET:-my-bucket}
INFLUX_TOKEN=${INFLUXDB_TOKEN:-my-token}

pass() { printf "Success %s\n" "$1"; }
fail() { printf "Fail %s\n" "$1"; exit 1; }

echo "==Smoke: API =="
curl -fsS "$API_URL/health" >/dev/null || fail "API /health failed"
pass "API /health OK"

echo "== Smoke: Frontend =="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/")
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
  pass "Frontend serving / ($HTTP_CODE)"
else
  fail "Frontend not reachable at / (HTTP $HTTP_CODE)"
fi

echo "== Smoke: InfluxDB 2 =="
INF_HEALTH=$(curl -fsS "$INFLUX_URL/health")
echo "$INF_HEALTH" | grep -q '"status":"pass"' || fail "Influx /health not pass"
pass "Influx /health pass"

WRITE_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -XPOST \
  "$INFLUX_URL/api/v2/write?org=$INFLUX_ORG&bucket=$INFLUX_BUCKET&precision=ns" \
  -H "Authorization: Token $INFLUX_TOKEN" \
  --data-binary "smoke_test,source=docker value=1i")
[ "$WRITE_STATUS" = "204" ] || fail "Influx write returned $WRITE_STATUS"
pass "Influx write OK"

QUERY='from(bucket: "'$INFLUX_BUCKET'")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "smoke_test")
  |> limit(n:1)'

QUERY_RESP=$(curl -fsS -XPOST "$INFLUX_URL/api/v2/query?org=$INFLUX_ORG" \
  -H "Authorization: Token $INFLUX_TOKEN" \
  -H "Content-Type: application/vnd.flux" \
  --data-binary "$QUERY")

echo "$QUERY_RESP" | grep -q 'smoke_test' || fail "Influx query returned no rows"
pass "Influx query OK"

echo "== Smoke: Grafana =="
curl -fsS "$GRAFANA_URL/api/health" >/dev/null || fail "Grafana /api/health failed"
pass "Grafana /api/health OK"

echo "All smoke checks passed."