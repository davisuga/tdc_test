#!/usr/bin/env bash
set -euo pipefail

# Simple redeploy script for the health API
# - Reconciles Pulumi infra/k8s
# - Waits for the Deployment rollout
# - Verifies the /health endpoint over HTTPS

STACK=${1:-dev}
DOMAIN=${DOMAIN:-api.davisuga.com}

echo "==> Running pulumi up for stack: $STACK"
pulumi up --yes --stack "$STACK"

# Export kubeconfig to a temp file based on current code (assumes stack has static IP and SSH access)
STATIC_IP=$(pulumi stack output staticExternalIp --stack "$STACK")
SSH_USER=${SSH_USER:-davi}
SSH_KEY=${SSH_KEY:-$HOME/.ssh/google_compute_engine}

TMP_KUBECONFIG=$(mktemp)
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$STATIC_IP" 'sudo cat /etc/rancher/k3s/k3s.yaml' | sed -e "s/127.0.0.1/$STATIC_IP/g" > "$TMP_KUBECONFIG"
export KUBECONFIG="$TMP_KUBECONFIG"

echo "==> Waiting for Deployment rollout"
kubectl rollout status deploy/health-api --timeout=120s || true

echo "==> Checking public URL"
set +e
for i in {1..20}; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "https://$DOMAIN/health")
  if [ "$code" = "200" ]; then
    echo "OK: https://$DOMAIN/health is returning 200"
    exit 0
  fi
  echo "Try $i/20: got $code, retrying in 5s..."
  sleep 5
done
set -e

echo "ERROR: Service did not become healthy in time"
exit 1

