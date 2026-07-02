# Linux Server Deployment: Docker + Ollama Local LLM Guide

**Status**: Production SOP
**Target Environment**: Linux Server (CentOS / Ubuntu)
**Audience**: DevOps Engineers, System Administrators, AI Infrastructure Engineers

---

## 1. Environment Preparation & Prerequisites

### 1.1 Hardware Requirements
Evaluate model size and concurrency needs against your machine's CPU, memory, and disk capacity.
*   **CPU Requirements**: Must support AVX2 or AVX-512 instruction sets. For 7B–9B class models, allocate at least 4 cores and 16 GB physical memory.
*   **GPU Requirements (optional)**: NVIDIA Turing architecture or newer (T4, RTX 20 series+). For 9B class models (typically 4-bit/8-bit quantized), 8 GB+ VRAM recommended.

### 1.2 System Environment Checks
Run the following commands before deployment:

```bash
cat /etc/os-release
uname -r
free -h
df -h
nvidia-smi
```
---

## 2. Install Docker & Docker Compose

### 2.1 Automated Docker Engine Installation
On CentOS 7, run the following standardized script:

```bash
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo curl -o /etc/yum.repos.d/docker-ce.repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker
```

### 2.2 Install Docker Compose
```bash
sudo yum install -y docker-compose-plugin
docker compose version
```

On CentOS 7 where the default Python environment has been modified to Python 3, using the yum-based Docker Compose plugin (RPM binary package) avoids any risk of disrupting the system Python environment.

### 2.3 Configure Registry Mirrors (China)
To resolve slow Docker Hub pulls, configure `daemon.json`:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://dockerpull.com",
    "https://docker.m.daocloud.io"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 2.4 Verify Installation
```bash
docker info
docker compose version
```
---

## 3. Deploy Ollama via Docker

Mount model data to a dedicated data directory to prevent data loss on container removal and simplify migration.

### 3.1 Option A: CPU-Only Deployment (Recommended for Current Setup)
```bash
sudo mkdir -p <OLLAMA_DATA_DIR>
docker run -d \
  -v <OLLAMA_DATA_DIR>:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart always \
  ollama/ollama
```

### 3.2 Option B: GPU Deployment (Reserve)
If adding NVIDIA GPUs later, install `nvidia-container-toolkit` first:

```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.repo | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
sudo yum clean expire-cache
sudo yum install -y nvidia-container-toolkit
sudo systemctl restart docker

docker run -d \
  --gpus=all \
  -v <OLLAMA_DATA_DIR>:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart always \
  ollama/ollama
```
---

### 3.3 Verify Ollama is Running

1. Check container status:
```bash
docker ps
```

2. Check startup logs (if troubleshooting):
```bash
docker logs ollama
```

3. Test Ollama responsiveness:
```bash
curl http://127.0.0.1:11434
```
Expected: `Ollama is running`

---

## 4. Pull & Run Local LLM

Using `qwen3.5:4b` as an example. For CPU-only inference, models under 4B parameters are recommended.

### 4.1 CLI Interactive Test (Inside Container)
```bash
docker exec -it ollama ollama run qwen3.5:4b
# Auto-downloads if model not present. Enter `/bye` to exit.
```

### 4.2 RESTful API Access (For Application Integration)

**Pull Model (API):**
```bash
curl -X POST http://localhost:11434/api/pull \
     -H "Content-Type: application/json" \
     -d '{"name": "qwen3.5:4b"}'
```

**Chat Generation (API):**
```bash
curl -X POST http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d '{
           "model": "qwen3.5:4b",
           "prompt": "Hello, please introduce yourself.",
           "stream": false
         }'
```

---

## 5. External Access & Security (Optional but Important)

Ollama listens on `127.0.0.1` by default. With `-p 11434:11434`, Docker exposes the service to the host's `0.0.0.0`. For production external access, place an **Nginx** reverse proxy in front with access control and TLS termination.

---

## 6. Troubleshooting

### 6.1 Image Pull Failures
Use specific registry mirrors (Section 2.3). Do not batch-replace the entire compose file.

### 6.2 Redis Overcommit Warning
```bash
sysctl vm.overcommit_memory=1
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
```

### 6.3 Ollama Not Responding
- Verify container: `docker ps | grep ollama`
- Check logs: `docker logs --tail 50 ollama`
- Test API: `curl http://127.0.0.1:11434/api/tags`
