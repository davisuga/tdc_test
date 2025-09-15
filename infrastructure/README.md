# Infrastructure (Pulumi) — README

This folder contains Pulumi infrastructure-as-code that provisions a single GCP VM running a k3s Kubernetes cluster, configures networking, DNS, cert-manager, ingress-nginx, and deploys a small Health API application backed by a ConfigMap.

Files of interest
- `index.ts` — main Pulumi program (creates network, VM, static IP, DNS, waits for k3s, saves kubeconfig, installs cert-manager and ingress-nginx via Helm, deploys a health API Deployment/Service/Ingress).
- `.env` — environment variables used by the Pulumi program (contains `CLOUDFLARE_ZONE_ID`).

High-level architecture
- GCP Compute VM (Ubuntu 22.04) with startup script that installs `k3s`.
- VPC network + subnet created specifically for the VM.
- Firewall rules to allow HTTP, HTTPS, SSH, k3s API (6443), and Kubernetes NodePort range.
- A static regional external IP assigned and a Cloudflare DNS A record (`api.davisuga.com`) pointing to it.
- A Pulumi `command.remote.Command` sequence that waits for k3s and then fetches `/etc/rancher/k3s/k3s.yaml`, modifies it to use the external IP and writes `k3s-kubeconfig.yaml` locally.
- A Kubernetes provider using the generated kubeconfig to: install `cert-manager` and `ingress-nginx` (Helm charts), create a `ClusterIssuer` for Let's Encrypt, and then deploy a small health API (bundled JavaScript in a ConfigMap) with an Ingress configured for TLS.

Prerequisites
- Pulumi (tested with recent version; follow https://www.pulumi.com/docs/get-started/).
- Node.js / Bun (project uses TypeScript; install dependencies with `npm`/`bun` depending on your workflow).
- GCP CLI (`gcloud`) configured and authenticated to the project you want to use.
- A Cloudflare account and `CLOUDFLARE_ZONE_ID` for the zone you want to update.
- An SSH key pair at `~/.ssh/google_compute_engine` and `~/.ssh/google_compute_engine.pub` (the code reads these by default).
- Local machine prerequisites: `kubectl` (used during troubleshooting), and ability to SSH to the VM via `gcloud compute ssh`.

Configuration
1. Export your Cloudflare zone id (or create an `.env` as used in this repo):

```bash
# from repository root
cd infrastructure
export CLOUDFLARE_ZONE_ID="<your-zone-id>"
```

Or edit the existing `.env` in this folder. The Pulumi program reads `process.env.CLOUDFLARE_ZONE_ID`.

2. Ensure `gcloud` is configured to the correct project and region. The program uses `gcp.config.project` and `gcp.config.region` (defaults to `us-central1` if not set). You can set them with:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set compute/region us-central1
```

3. Ensure your SSH key exists at `~/.ssh/google_compute_engine` and `~/.ssh/google_compute_engine.pub`. If not, create it:

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/google_compute_engine -C "$(whoami)@local"
```

Deployment steps (high level)
1. Install dependencies and login to Pulumi:

```bash
cd infrastructure
npm install         # or `bun install` depending on your toolchain
pulumi login        # log into Pulumi service or use local backend
```

2. Preview and deploy

```bash
pulumi stack init dev || echo "stack exists"
pulumi config set gcp:project YOUR_PROJECT_ID
pulumi config set gcp:region us-central1
export CLOUDFLARE_ZONE_ID="287a45d4144cd942f259daa805681a0f" # or your zone id
pulumi preview
pulumi up --yes
```

What the program outputs
- `instanceName` — the Compute Engine instance name.
- `instanceZone` — the Compute Engine zone.
- `staticExternalIp` — the allocated external IP address.
- `dnsName` — the Cloudflare DNS name created (resolves to the IP).
- `healthApiUrl` — the hard-coded health endpoint `https://api.davisuga.com/health`.

Important implementation details and assumptions
- The startup script installs `k3s` and writes the cluster kubeconfig to `/etc/rancher/k3s/k3s.yaml` on the VM. The Pulumi program fetches that file over SSH and rewrites `127.0.0.1` references to the VM external IP so it can be used remotely.
- The `ssh-keys` metadata is set using the public key file `~/.ssh/google_compute_engine.pub` and assumes the local user `davi` (change `sshUser` constant in `index.ts` if needed).
- Ingress assumes host `api.davisuga.com` and creates a TLS secret name `api-davisuga-com-tls` via cert-manager/Let's Encrypt.
- The health API code is read directly from `../app/index.ts` and stored in a ConfigMap; the deployment image is `oven/bun:1.2.21-slim` running `bun /app/index.js`.

Troubleshooting
- If Pulumi fails to SSH to the VM:
  - Ensure the VM has the SSH key in metadata and that the private key path matches `~/.ssh/google_compute_engine`.
  - Use `gcloud compute ssh k3s-node --zone=<zone>` to attempt manual connection.

- If kubeconfig fetch fails or `kubectl` commands do not work via Pulumi:
  - SSH to the VM and inspect `/etc/rancher/k3s/k3s.yaml` and confirm the server address. You may need to re-run the `get-k3s-kubeconfig` command logic manually and replace `127.0.0.1` with the external IP.

- Certificate issuance delays:
  - Let's Encrypt can take several minutes to issue certs. Inspect cert-manager logs: `kubectl -n cert-manager logs deploy/cert-manager -l app=cert-manager` and cert resources: `kubectl get certificaterequests,orders,challenge -A`.

- Ingress issues:
  - Check the `ingress-nginx` controller logs and events: `kubectl -n ingress-nginx get pods` and `kubectl -n ingress-nginx logs <pod>`.

Security notes
- The firewall rules currently allow wide-open SSH and other ports from `0.0.0.0/0`. Lock these to your IP ranges for production use.
- The startup script and metadata disable OS Login; if you prefer OS Login, update the metadata accordingly.

Next steps and optional improvements
- Add an automated systemd unit or cloud-init adjustments to write the kubeconfig with the desired server address during provisioning to avoid the SSH fetch step.
- Harden firewall rules and use a bastion host for SSH.
- Use a managed Kubernetes cluster (GKE Autopilot or GKE Standard) for production workloads.
- Add a Pulumi configuration schema and typed inputs for easier stack configuration.

Local file references
- Kubeconfig saved locally (when Pulumi runs and fetches it): `k3s-kubeconfig.yaml` in the `infrastructure` folder.

Contact / Author
- Created from the repository `infrastructure/index.ts` by the automation that generated this README.

----
How to get help if something fails
- Share Pulumi logs and the stack output: `pulumi stack output --json` and `pulumi logs`.
- Share failing error messages and the contents of `infrastructure/index.ts` and the VM startup script output (from serial port or SSH).
