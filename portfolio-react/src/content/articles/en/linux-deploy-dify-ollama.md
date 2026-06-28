# Linux Server Deployment: Docker + Dify with Local LLM Integration Guide

**Status**: Production SOP
**Target Environment**: Linux Server (CentOS / Ubuntu)
**Prerequisites**: Docker and Docker Compose plugin installed; Ollama running on the host.

---

## 1. Objective & Conclusions

This guide covers deploying Dify via Docker Compose and connecting it to a local Ollama model.

Validated on CentOS 7; Ubuntu follows a similar flow. Key conclusions:

- The `postgres:15-alpine` image should not be used in this environment
- Switching to `postgres:15` resolves initialization failures and runs stably
- The most reliable way to connect Dify to Ollama is using the host IP: `http://<SERVER_IP>:11434`
- Avoid `extra_hosts`, `links`, custom override networks, or disabling firewalls as workarounds

---

## 2. Environment Overview

Replace `<DEPLOY_BASE_DIR>`, `<DIFY_PROJECT_DIR>`, `<DIFY_DOCKER_DIR>`, `<DB_DATA_DIR>`, and `<SERVER_IP>` with your actual values throughout this guide.

---

## 3. Clone Dify & Prepare Configuration

```bash
# 1. Create deployment directory
mkdir -p <DEPLOY_BASE_DIR>
cd <DEPLOY_BASE_DIR>

# 2. Install git
yum install -y git

# 3. Clone source
git clone https://gitee.com/dify_ai/dify.git <DIFY_PROJECT_DIR>

# 4. Enter docker deployment directory
cd <DIFY_DOCKER_DIR>

# 5. Copy environment file
cp .env.example .env
```

---

## 4. Minimal-Change Deployment

### 4.1 Restore Clean Compose File

If you have done trial-and-error modifications, reset to a clean state:

```bash
cd <DIFY_DOCKER_DIR>

# Stop current services
docker compose down

# Backup current compose file
cp docker-compose.yaml docker-compose.yaml.fixbak.$(date +%F-%H%M%S)

# Archive old override or helper scripts (rename, do not delete)
[ -f docker-compose.override.yaml ] && mv docker-compose.override.yaml docker-compose.override.yaml.disabled.$(date +%F-%H%M%S)
[ -f pull_and_tag.sh ] && mv pull_and_tag.sh pull_and_tag.sh.disabled.$(date +%F-%H%M%S)

# Restore official original compose
git checkout -- docker-compose.yaml
```

### 4.2 Replace Only Required Images

Do not batch-replace the entire `docker-compose.yaml`. Replace only the images needed by active services:

```bash
cd <DIFY_DOCKER_DIR>

sed -i 's|image: postgres:15-alpine|image: docker.m.daocloud.io/postgres:15|g' docker-compose.yaml
sed -i 's|image: redis:6-alpine|image: docker.m.daocloud.io/redis:6-alpine|g' docker-compose.yaml
sed -i 's|image: busybox:latest|image: docker.m.daocloud.io/busybox:latest|g' docker-compose.yaml
sed -i 's|image: nginx:latest|image: docker.m.daocloud.io/nginx:latest|g' docker-compose.yaml
sed -i 's|image: ubuntu/squid:latest|image: docker.m.daocloud.io/ubuntu/squid:latest|g' docker-compose.yaml
sed -i 's|image: langgenius/dify-api:1.14.2|image: docker.m.daocloud.io/langgenius/dify-api:1.14.2|g' docker-compose.yaml
sed -i 's|image: langgenius/dify-web:1.14.2|image: docker.m.daocloud.io/langgenius/dify-web:1.14.2|g' docker-compose.yaml
sed -i 's|image: langgenius/dify-sandbox:0.2.15|image: docker.m.daocloud.io/langgenius/dify-sandbox:0.2.15|g' docker-compose.yaml
sed -i 's|image: langgenius/dify-plugin-daemon:0.6.1-local|image: docker.m.daocloud.io/langgenius/dify-plugin-daemon:0.6.1-local|g' docker-compose.yaml
sed -i 's|image: semitechnologies/weaviate:1.27.0|image: docker.m.daocloud.io/semitechnologies/weaviate:1.27.0|g' docker-compose.yaml
```

### 4.3 Verify Clean State

```bash
cd <DIFY_DOCKER_DIR>
docker compose config | egrep -n 'extra_hosts|db_postgres=|redis=|weaviate=' || true
```

No output means the erroneous `extra_hosts` pollution has been cleared.

---

## 5. Fix PostgreSQL Initialization Failure

### 5.1 Root Cause

Confirmed through hands-on troubleshooting:
- Not a directory permission issue
- Not caused by SELinux
- Not resolved by disabling firewalls or changing Docker network mode
- **The real issue**: `postgres:15-alpine` fails to initialize in this host environment
- **Fix**: Switch to `postgres:15` — database successfully runs `initdb` and reaches `healthy`

### 5.2 Rename Instead of Delete

Do NOT run destructive `rm -rf` on the database directory. Rename as a backup instead:

```bash
mv <DB_DATA_DIR> <DB_DATA_DIR>.failed.$(date +%F-%H%M%S)
mkdir -p <DB_DATA_DIR>
chown -R 999:999 <DB_DATA_DIR>
chmod 700 <DB_DATA_DIR>
```

### 5.3 Start Database & Redis First

```bash
cd <DIFY_DOCKER_DIR>
docker compose up -d db_postgres redis
docker compose ps
docker compose logs --tail 80 db_postgres
docker compose logs --tail 50 redis
```

### 5.4 Healthy State Indicators

`db_postgres` logs should show:
- `PostgreSQL init process complete; ready for start up.`
- `database system is ready to accept connections`

`docker compose ps` should show:
- `db_postgres`: `healthy`
- `redis`: `healthy`

---

## 6. Launch Full Dify Stack

```bash
cd <DIFY_DOCKER_DIR>
docker compose up -d
docker compose ps
```

Check key service logs immediately:

```bash
docker compose logs --tail 100 api
docker compose logs --tail 100 worker
docker compose logs --tail 100 web
docker compose logs --tail 100 nginx
```

Healthy state:
- `web` logs show `Ready`
- `nginx` starts worker processes normally
- `api` & `worker` no longer report database/Redis connection failures

---

## 7. Access Dify & Initialize Admin

If nginx is listening on port 80, open in browser:

```
http://<SERVER_IP>
```

If you see the "Set up admin account" page, the following chain is connected:
- Frontend `web` → Gateway `nginx` → Backend `api` → Database `db_postgres` → Cache `redis`

Follow the prompts to set admin email, username, and password.

---

## 8. Connect Dify to Local Ollama

### 8.1 Verify Ollama is Running

```bash
docker ps | grep ollama
curl http://127.0.0.1:11434/api/tags
```

If returning a model list, Ollama is healthy. To restart Ollama:

```bash
docker rm -f ollama
docker run -d \
  -v <OLLAMA_DATA_DIR>:/root/.ollama \
  -p 11434:11434 \
  -e OLLAMA_HOST=0.0.0.0 \
  --name ollama \
  --restart always \
  ollama/ollama
```

### 8.2 Dify Configuration

In Dify admin panel:
- Avatar menu (top-right) → Settings → Model Providers → Ollama → Add Model

Recommended settings:
- **Model Name**: match `ollama list` output exactly
- **Model Type**: `LLM`
- **Credential Name**: e.g. `Local Ollama`
- **Base URL**: `http://<SERVER_IP>:11434`
- **API Key (optional)**: leave empty
- **Usage Type**: `Chat`
- **Context Length**: `8192`

Model name examples:
- If `ollama list` shows `qwen3.5:4b`, enter `qwen3.5:4b`
- If `ollama list` shows `qwen:0.8b`, enter `qwen:0.8b`

### 8.3 Why Use Host Real IP

The most reliable approach in this environment:
- Does not depend on Docker DNS compatibility behavior
- Simplifies network troubleshooting
- Consistent with the actual validated deployment environment

### 8.4 Verify Connection

If configured correctly, Dify validates the model through Ollama.

If validation fails, check:
```bash
curl http://<SERVER_IP>:11434/api/tags
docker logs --tail 50 ollama
```

---

## 9. Create First Chat Application

1. Go to Dify Studio
2. Create a blank app
3. Select Chatbot
4. Choose the Ollama model you just added
5. Enter a simple prompt: "You are a helpful AI assistant"
6. Send a test message to verify the response

---

## 10. Troubleshooting

### 10.1 Image Pull Failures
If `docker compose up -d` hangs on image pulls, use precise image replacements for active services only. Do not batch-replace.

### 10.2 Dify Page Loads but Keeps Spinning

Check:
```bash
docker compose ps
docker compose logs --tail 100 api
docker compose logs --tail 100 worker
```

Common causes:
- Database still initializing
- `api` / `worker` still running migrations
- Backend dependencies not yet fully ready

### 10.3 Dify Cannot Reach Ollama

Check:
- Base URL is NOT mistakenly set to `127.0.0.1`
- Model name matches `ollama list` output exactly
- Host port `11434` is reachable

Recommended format:
```
http://<SERVER_IP>:11434
```

### 10.4 Redis Warnings

If Redis shows `vm.overcommit_memory` warnings:
```bash
sysctl vm.overcommit_memory=1
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
```

---

## 11. Practices Explicitly Avoided

The following were validated as **not recommended** in this environment:
- Using `postgres:15-alpine`
- Injecting `extra_hosts` into `docker-compose.override.yaml`
- Using `links` or custom static DNS overrides
- Disabling firewalls as a substitute for root cause fixes
- Batch-replacing images across the entire `docker-compose.yaml`
- Running destructive `rm -rf` on the database directory

These trial-and-error records have been archived separately in backup documentation.
