#!/usr/bin/env bash
# Cloudflare Stream webhook 등록 — .env.local 에서 변수 로드
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.local}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID 필요}"
TOKEN="${CLOUDFLARE_STREAM_API_TOKEN:?CLOUDFLARE_STREAM_API_TOKEN 필요}"
NOTIFICATION_URL="${STREAM_WEBHOOK_URL:-https://xiio.vercel.app/api/webhooks/cloudflare-stream}"

echo "Registering Stream webhook..."
echo "  Account: $ACCOUNT_ID"
echo "  URL:     $NOTIFICATION_URL"
echo ""

RESP=$(curl -sS -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/webhook" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"notificationUrl\":\"${NOTIFICATION_URL}\"}")

echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"

SECRET=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('secret',''))" 2>/dev/null || true)

if [[ -n "$SECRET" ]]; then
  echo ""
  echo "=== 다음 단계 ==="
  echo "1. Vercel (및 .env.local)에 추가:"
  echo "   CLOUDFLARE_STREAM_WEBHOOK_SECRET=${SECRET}"
  echo "2. Vercel 재배포"
  echo "3. 테스트 영상 업로드 후 어드민에서 streamStatus 확인"
fi
