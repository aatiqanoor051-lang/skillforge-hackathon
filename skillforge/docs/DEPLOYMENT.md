# Deployment Guide

## 1. Docker Compose (single host / staging)

```bash
cp .env.example .env
# Set at minimum: JWT_SECRET, MONGO_INITDB_ROOT_PASSWORD
# AI_API_KEY is optional; leave blank for deterministic-only mode.

docker-compose up --build -d
docker-compose exec backend npm run seed   # optional demo data
docker-compose ps                          # check health status
docker-compose logs -f backend             # tail logs
```

Services: `mongo` (27017), `python-service` (5001, internal), `backend`
(5000), `frontend` (5173 → nginx:80 inside the container).

To stop: `docker-compose down` (add `-v` to also drop the Mongo volume).

## 2. Kubernetes

Manifests live in `/kubernetes`. They assume:
- Images already pushed to a registry as `skillforge/backend:latest`,
  `skillforge/python-service:latest`, `skillforge/frontend:latest` (adjust
  image references to your registry, e.g. ECR).
- An ingress controller (nginx) and cert-manager are installed for TLS.

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml

# Create secrets properly — do NOT apply secrets.yaml as-is with real values.
# Either edit it locally (untracked) or use:
kubectl create secret generic skillforge-secrets \
  --namespace skillforge \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=skillforge_admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD='<strong-password>' \
  --from-literal=MONGO_URI='mongodb://skillforge_admin:<strong-password>@mongo:27017/skillforge?authSource=admin' \
  --from-literal=JWT_SECRET='<long-random-string>' \
  --from-literal=AI_API_KEY=''

kubectl apply -f kubernetes/mongo-deployment.yaml
kubectl apply -f kubernetes/python-service-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/ingress.yaml

kubectl -n skillforge get pods -w
```

Notes:
- `mongo-deployment.yaml` uses a single-replica Deployment + PVC for
  simplicity. For production, prefer a managed Mongo-compatible service
  (Atlas, DocumentDB — see Terraform) or a proper StatefulSet with replication.
- `backend-deployment.yaml` includes a `HorizontalPodAutoscaler` (2-6 replicas,
  70% CPU target).
- Run the seed script once via `kubectl -n skillforge exec deploy/backend -- npm run seed`.

## 3. Terraform (AWS reference architecture)

`/terraform` provisions: VPC (public/private subnets across 2 AZs), security
groups, a DocumentDB (Mongo-compatible) cluster, an ECS cluster, ECR
repositories for all three images, and an Application Load Balancer. It is a
**reference**, not a one-command production deploy — review instance sizes,
CIDR ranges, and IAM policies first. It does not include the ECS Task
Definitions/Services themselves (those depend on your CI/CD image-tagging
strategy) — see the comments in `main.tf` for the ALB target groups it does
create for backend/frontend.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # edit non-sensitive values

export TF_VAR_db_master_password='<strong-password>'
export TF_VAR_jwt_secret='<long-random-string>'
export TF_VAR_ai_api_key=''   # optional

terraform init
terraform plan
terraform apply
```

Configure a remote state backend (see the commented block in `backend.tf`)
before using this in a team setting — local state is fine for solo
experimentation only.

After `apply`, push images to the created ECR repositories and wire up ECS
services/task definitions (or a tool like `aws ecs deploy` / Copilot) that
reference `aws_lb_target_group.backend` / `.frontend` from `main.tf`.

## Environment variables reference

See `.env.example` at the repository root for the full list with
descriptions. The only strictly required variable for the backend to start
is `JWT_SECRET` — the server refuses to boot without it
(`backend/server.js`). Everything AI-related is optional and gracefully
degrades to deterministic behavior.

## Health checks

- Backend: `GET /health` → `{ status: "ok", dbConnected: boolean }`
- Python service: `GET /health` → `{ status: "ok" }`
- Frontend (nginx): `GET /` → 200 (static SPA)

All three Dockerfiles define container-level `HEALTHCHECK` instructions, and
the Kubernetes manifests define matching readiness/liveness probes.
