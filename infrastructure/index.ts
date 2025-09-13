import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as cloudflare from "@pulumi/cloudflare";
import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";

// SSH settings for remote access into the VM (used to fetch kubeconfig)
const sshUser = "davi";
const sshKeyPath = path.join(os.homedir(), ".ssh", "google_compute_engine");

// Get the current project configuration
const config = new pulumi.Config();
const project = gcp.config.project!;
const region = gcp.config.region || "us-central1";
const zone = `${region}-a`;

// Create a VPC network
const network = new gcp.compute.Network("k3s-network", {
  autoCreateSubnetworks: false,
});

// Create a subnet
const subnet = new gcp.compute.Subnetwork("k3s-subnet", {
  ipCidrRange: "10.0.0.0/24",
  network: network.id,
  region: region,
});

// Create firewall rules (allow 80/443/6443/22)
const firewallWeb = new gcp.compute.Firewall("k3s-web", {
  network: network.id,
  allows: [
    {
      protocol: "tcp",
      ports: ["80", "443"],
    },
  ],
  sourceRanges: ["0.0.0.0/0"],
  targetTags: ["k3s-node"],
});

const firewallK3s = new gcp.compute.Firewall("k3s-api", {
  network: network.id,
  allows: [
    {
      protocol: "tcp",
      ports: ["6443"],
    },
  ],
  sourceRanges: ["0.0.0.0/0"],
  targetTags: ["k3s-node"],
});

const firewallSsh = new gcp.compute.Firewall("k3s-ssh", {
  network: network.id,
  allows: [
    {
      protocol: "tcp",
      ports: ["22"],
    },
  ],
  sourceRanges: ["0.0.0.0/0"],
  targetTags: ["k3s-node"],
});

const firewallNodePorts = new gcp.compute.Firewall("k3s-nodeports", {
  network: network.id,
  allows: [
    {
      protocol: "tcp",
      ports: ["30000-32767"],
    },
  ],
  sourceRanges: ["0.0.0.0/0"],
  targetTags: ["k3s-node"],
});

// Create a static external IP for the load balancer
const staticIp = new gcp.compute.Address("api-static-ip", {
  name: "api-davisuga-com-ip",
  region: region,
});

// Create startup script for k3s installation (only k3s; all k8s addons via Pulumi)
const startupScript = `#!/bin/bash
set -e
echo "Starting VM initialization..."

# Update system
apt-get update
apt-get install -y curl jq

# Minimal tools
apt-get install -y apt-transport-https ca-certificates gnupg lsb-release

# Get the external IP for TLS configuration
EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")
echo "External IP: $EXTERNAL_IP"

# Install k3s with external IP in TLS SAN and disable built-in components
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable=traefik --disable=servicelb --write-kubeconfig-mode=644 --tls-san=$EXTERNAL_IP" sh -

# Wait for k3s to be ready
echo "Waiting for k3s to be ready..."
while ! kubectl get nodes &>/dev/null; do
  echo "Still waiting for k3s..."
  sleep 5
done

# Nothing else here; Pulumi will take over for Kubernetes addons and app.

echo "VM ready with k3s. Pulumi will configure cluster resources."`

// Create the VM instance
const pubKey = fs.readFileSync(path.join(os.homedir(), ".ssh", "google_compute_engine.pub"), "utf8").trim();
const instance = new gcp.compute.Instance("k3s-instance", {
  name: "k3s-node",
  machineType: "e2-medium", // 4GB RAM, 2 vCPUs
  zone: zone,
  tags: ["k3s-node", "http-server", "https-server"],
  bootDisk: {
    initializeParams: {
      image: "ubuntu-os-cloud/ubuntu-2204-lts",
      size: 70, // 70GB disk
      type: "pd-ssd",
    },
  },
  networkInterfaces: [
    {
      network: network.id,
      subnetwork: subnet.id,
      accessConfigs: [{
        natIp: staticIp.address, // Use static IP
      }],
    },
  ],
  serviceAccount: {
    email: "default",
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
    ],
  },
  metadata: {
    "ssh-keys": `${sshUser}:${pubKey} ${sshUser}`,
    "enable-oslogin": "FALSE",
  },
  metadataStartupScript: startupScript,
  allowStoppingForUpdate: true,
});

// Create DNS A record (using hardcoded zone ID for davisuga.com)
const dnsRecord = new cloudflare.Record("api-dns", {
  zoneId: "287a45d4144cd942f259daa805681a0f", // davisuga.com zone ID
  name: "api",
  content: staticIp.address,
  type: "A",
  ttl: 300,
  proxied: false, // Disable Cloudflare proxy for direct access
});

// Use local kubeconfig file if it exists, otherwise fetch from VM
const localKubeconfigPath = path.join(__dirname, "k3s-kubeconfig.yaml");
let kubeconfigContent: pulumi.Output<string>;

if (fs.existsSync(localKubeconfigPath)) {
  // Use cached kubeconfig
  console.log("Using cached kubeconfig from", localKubeconfigPath);
  kubeconfigContent = pulumi.output(fs.readFileSync(localKubeconfigPath, "utf8"));
} else {
  // Retrieve kubeconfig from the VM over SSH
  const waitK3s = new command.remote.Command("wait-k3s-ready", {
    connection: {
      host: staticIp.address,
      port: 22,
      user: sshUser,
      privateKey: fs.readFileSync(sshKeyPath, "utf8"),
    },
    create: "bash -lc 'for i in $(seq 1 60); do if sudo kubectl get nodes >/dev/null 2>&1; then exit 0; fi; sleep 5; done; echo k3s not ready; exit 1'",
  }, { dependsOn: [instance] });

  const kubeconfigCmd = new command.remote.Command("get-k3s-kubeconfig", {
    connection: {
      host: staticIp.address,
      port: 22,
      user: sshUser,
      privateKey: fs.readFileSync(sshKeyPath, "utf8"),
    },
    create: "sudo cat /etc/rancher/k3s/k3s.yaml",
  }, { dependsOn: [waitK3s] });

  kubeconfigContent = pulumi.all([kubeconfigCmd.stdout, staticIp.address]).apply(([cfg, ip]) => {
    const modifiedConfig = cfg.replace(/127.0.0.1/g, ip);
    // Save it locally for future runs
    fs.writeFileSync(localKubeconfigPath, modifiedConfig);
    console.log("Kubeconfig saved to", localKubeconfigPath);
    return modifiedConfig;
  });
}

const k8sProvider = new k8s.Provider("k3s", { 
  kubeconfig: kubeconfigContent,
  suppressDeprecationWarnings: true,
});

// 1) cert-manager via Helm (with CRDs)
const certManagerNs = new k8s.core.v1.Namespace("cert-manager-ns", {
  metadata: { name: "cert-manager" },
}, { provider: k8sProvider });

const certManager = new k8s.helm.v3.Chart("cert-manager", {
  chart: "cert-manager",
  version: "v1.16.2",
  fetchOpts: { repo: "https://charts.jetstack.io" },
  namespace: certManagerNs.metadata.name,
  values: { installCRDs: true },
}, { provider: k8sProvider });

// 2) ingress-nginx via Helm, binding to host ports 80/443
const ingressNginx = new k8s.helm.v3.Chart("ingress-nginx", {
  chart: "ingress-nginx",
  version: "4.10.1",
  fetchOpts: { repo: "https://kubernetes.github.io/ingress-nginx" },
  values: {
    controller: {
      kind: "DaemonSet",
      hostNetwork: true,
      dnsPolicy: "ClusterFirstWithHostNet",
      service: { enabled: false },
      hostPort: { enabled: true, ports: { http: 80, https: 443 } },
    },
  },
}, { provider: k8sProvider });

// 3) ClusterIssuer for Let's Encrypt (HTTP-01 via nginx)
const clusterIssuer = new k8s.apiextensions.CustomResource("letsencrypt-prod", {
  apiVersion: "cert-manager.io/v1",
  kind: "ClusterIssuer",
  metadata: { name: "letsencrypt-prod" },
  spec: {
    acme: {
      server: "https://acme-v02.api.letsencrypt.org/directory",
      email: "theclustercustomerservice@gmail.com",
      privateKeySecretRef: { name: "letsencrypt-prod" },
      solvers: [{ http01: { ingress: { class: "nginx" } } }],
    },
  },
}, { provider: k8sProvider, dependsOn: [certManager] });

// 4) Bun health app as ConfigMap + Deployment + Service + Ingress
const appNs = new k8s.core.v1.Namespace("app-ns", { metadata: { name: "default" } }, { provider: k8sProvider });

const appSourcePath = path.resolve(__dirname, "../app/index.ts");
const healthJs = fs.readFileSync(appSourcePath, "utf8");
const configHash = crypto.createHash("sha256").update(healthJs).digest("hex");

const appConfig = new k8s.core.v1.ConfigMap("health-api-config", {
  metadata: { name: "health-api-config" },
  data: { "index.js": healthJs },
}, { provider: k8sProvider });

const labels = { app: "health-api" };
const deploy = new k8s.apps.v1.Deployment("health-api", {
  metadata: { name: "health-api" },
  spec: {
    replicas: 1,
    selector: { matchLabels: labels },
    template: {
      metadata: { labels, annotations: { "app-config-sha": configHash } },
      spec: {
        containers: [{
          name: "health",
          image: "oven/bun:1.2.21-slim",
          command: ["bun", "/app/index.js"],
          ports: [{ containerPort: 8080 }],
          volumeMounts: [{ name: "code", mountPath: "/app" }],
        }],
        volumes: [{ name: "code", configMap: { name: appConfig.metadata.name } }],
      },
    },
  },
}, { provider: k8sProvider, dependsOn: [ingressNginx] });

const svc = new k8s.core.v1.Service("health-api-svc", {
  metadata: { name: "health-api-svc" },
  spec: {
    type: "ClusterIP",
    selector: labels,
    ports: [{ port: 80, targetPort: 8080 }],
  },
}, { provider: k8sProvider });

const ing = new k8s.networking.v1.Ingress("health-api-ingress", {
  metadata: {
    name: "health-api-ingress",
    annotations: {
      "cert-manager.io/cluster-issuer": "letsencrypt-prod",
      "nginx.ingress.kubernetes.io/ssl-redirect": "true",
    },
  },
  spec: {
    ingressClassName: "nginx",
    tls: [{ hosts: ["api.davisuga.com"], secretName: "api-davisuga-com-tls" }],
    rules: [{
      host: "api.davisuga.com",
      http: {
        paths: [{
          path: "/",
          pathType: "Prefix",
          backend: { service: { name: svc.metadata.name, port: { number: 80 } } },
        }],
      },
    }],
  },
}, { provider: k8sProvider, dependsOn: [clusterIssuer, svc] });
// The startup script installs and configures:
// - k3s with NGINX Ingress Controller
// - cert-manager with Let's Encrypt ClusterIssuer  
// - All necessary Kubernetes resources for the health API
//
// To manage these resources with Pulumi instead of startup script:
// 1. Remove the kubectl commands from the startup script
// 2. Configure proper Kubernetes provider with real kubeconfig from VM
// 3. Add Service, Endpoints, and Ingress resources here
//
// For now, the startup script handles all Kubernetes configuration
// to ensure everything works end-to-end

// Export important values
export const instanceName = instance.name;
export const instanceZone = instance.zone;
export const staticExternalIp = staticIp.address;
export const dnsName = dnsRecord.name.apply(name => `${name}.davisuga.com`);
export const healthApiUrl = "https://api.davisuga.com/health";

// Instructions for accessing the deployed infrastructure:
export const instructions = pulumi.interpolate`
Deployment completed! Your infrastructure includes:

1. GCP VM (${instance.name}) running k3s Kubernetes cluster
2. NGINX Ingress Controller with SSL termination 
3. cert-manager for automatic Let's Encrypt certificates
4. Health API application running on Docker
5. Static IP (${staticIp.address}) with DNS record api.davisuga.com

To access:
- Health API: https://api.davisuga.com/health
- SSH to VM: gcloud compute ssh ${instance.name} --zone=${instance.zone}

Pulumi configures Kubernetes add-ons and app automatically.
Certificate issuance can take a few minutes after the first deployment.
`;
