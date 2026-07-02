# Linux服务器部署 Docker + Ollama 本地大模型执行方案

**文档状态**: 正式版 SOP
**适用环境**: Linux 服务器（CentOS / Ubuntu）
**目标受众**: DevOps 工程师、系统管理员、AI 基础设施实施人员

---

## 1. 环境准备与前提条件

### 1.1 硬件要求说明
结合当前服务器实际配置，资源可满足纯 CPU 推理场景。部署前请根据自身机器的 CPU、内存和磁盘容量评估模型大小与并发需求。
*   **CPU 运行要求**: 需支持 AVX2 或 AVX-512 指令集（当前服务器已支持）。对于 7B~9B 级别模型，建议至少分配 4 核及 16GB 物理内存。
*   **GPU 运行要求（如有扩展）**: 建议使用 NVIDIA Turing 架构（如 T4、RTX 20系）及以上显卡。运行 `9B` 级别模型（通常采用 4-bit/8-bit 量化），建议显存至少 8GB。

### 1.2 系统环境检查命令
在开始部署前，请依次执行以下命令确保系统状态符合预期：

```bash
# 1. 检查操作系统版本（本文已在 CentOS 7 环境验证，Ubuntu 可参考同类流程）
cat /etc/os-release

# 2. 检查系统内核版本（Docker 建议 3.10 以上）
uname -r

# 3. 检查可用资源（内存与磁盘）
free -h
df -h

# 4. 检查显卡状态（仅限有 GPU 硬件的场景，当前纯内存推理环境可跳过）
nvidia-smi
```
---

## 2. 安装 Docker 及 Docker Compose

### 2.1 自动化安装 Docker 引擎
在 CentOS 7 下，执行以下标准化脚本以安装最新版 Docker：

```bash
# 卸载旧版本（如有）
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装必需的依赖包

sudo yum install -y yum-utils device-mapper-persistent-data lvm2
# 解决 Python 3 环境下 yum-config-manager 报错的问题，直接通过 curl 下载 repo 文件：

sudo curl -o /etc/yum.repos.d/docker-ce.repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker CE 及其组件
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动并设置开机自启
sudo systemctl enable docker
sudo systemctl start docker

```
### 2.2 安装 Docker Compose
```bash
# 方案：通过 Docker 官方插件方式安装 Docker Compose V2（推荐，不依赖 Python）
# 因为系统 Python 已经被修改为 Python 3，为了绝对的安全和稳定，我们使用 yum 直接安装 docker-compose-plugin

# 1. 确保之前已经配置了 Docker 官方源或阿里云 Docker 源（见 2.1 节）
# 2. 直接通过 yum 安装 docker-compose-plugin
sudo yum install -y docker-compose-plugin

# 3. 验证安装是否成功（注意：使用这种方式，命令是 `docker compose` 而不是 `docker-compose`）
docker compose version
```
#
由于你的 CentOS 7 系统默认的 Python 环境已经被修改成了 Python 3，而 CentOS 7 很多系统底层工具（最典型的就是 yum ）严重依赖 Python 2.7。 虽然使用 pip 安装应用通常只会将库装在 Python 3 的 site-packages 下，不应该直接搞垮系统，但在被“魔改”过基础环境的系统上，执行全局的 pip upgrade 或安装系统级依赖库，仍然存在一定破坏现有业务或系统脚本依赖关系的风险。

为了做到 绝对的安全，零风险影响现有系统 ，我建议 放弃使用 Python pip 安装的方法 。

既然你的服务器已经成功通过阿里云源使用 yum 安装了 Docker，我们完全可以利用这个现成的安全通道，安装 Docker 官方提供的 Docker Compose 插件 (Docker Compose V2) 。它作为 Docker 的一个原生组件，是通过 RPM 包安装的（二进制程序），完全不依赖 Python，也不会污染系统任何 Python 环境。
#
### 2.3 配置国内镜像加速源
为了解决拉取官方镜像缓慢或近期国内 Docker Hub 大面积被墙的问题，需配置 `daemon.json`。如果以下镜像源失效，可以直接参考 [常见问题排查](#6-常见问题与故障排查) 中的指定代理源拉取方法。

```bash
# 创建配置目录
sudo mkdir -p /etc/docker

# 写入镜像加速配置（替换为当前可用率较高的镜像源）
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://dockerpull.com",
    "https://docker.m.daocloud.io"
  ]
}
EOF

# 重载配置并重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 2.4 验证安装
```bash
# 检查 Docker 运行状态
docker info

# 检查 Compose 插件版本（注意：使用插件安装后，命令中间是空格，不是连字符）
docker compose version
```
---

## 3. 使用 Docker 部署 Ollama 服务

鉴于系统根目录 `/` 和 `/data` 的空间分配，**建议将模型数据挂载至独立的数据目录**，避免容器销毁导致模型文件丢失，并便于后续迁移与容量管理。

### 3.1 方案 A：纯 CPU 版本部署（当前适用）
执行以下命令直接拉取并运行 Ollama 容器：

```bash

# 创建数据挂载目录
sudo mkdir -p <OLLAMA_DATA_DIR>

# 运行 Ollama 容器（后台运行、自启、端口映射、挂载数据卷）
docker run -d \
  -v <OLLAMA_DATA_DIR>:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart always \
  ollama/ollama
```
### 3.2 方案 B：GPU 版本部署（备用）
若后续接入 NVIDIA 显卡，需先安装 `nvidia-container-toolkit`，然后执行带 GPU 映射的容器启动：

```bash
# 安装 NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.repo | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
sudo yum clean expire-cache
sudo yum install -y nvidia-container-toolkit
sudo systemctl restart docker

# 运行 GPU 版本的 Ollama 容器
docker run -d \
  --gpus=all \
  -v <OLLAMA_DATA_DIR>:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart always \
  ollama/ollama
```
---
1. 查看容器运行状态
你可以用这条命令确认它是否真的在正常运行，且没有因为报错而退出：

docker ps
如果能看到 ollama/ollama 镜像对应的容器状态是 Up ...，说明一切正常。

2. 查看启动日志（如果需要排查问题）
如果想看 Ollama 启动时输出了什么信息，可以查看日志：

docker logs ollama
3. 测试 Ollama 是否响应
你映射了 11434 端口，可以在服务器本地用 curl 测试一下服务是否通：

curl http://127.0.0.1:11434
如果返回 Ollama is running，说明服务已经完全就绪。

---
## 4. 拉取与运行本地大模型

以 `qwen3.5:4b` 为例，进行模型拉取与交互测试。
*(注：对于纯 CPU 推理环境，推荐使用 4B 以下参数的模型以获得流畅的回复速度。)*

### 4.1 进入容器内部进行 CLI 测试
```bash
# 1. 在容器内直接执行拉取并运行命令（这里以 qwen3.5:4b 为例）
docker exec -it ollama ollama run qwen3.5:4b

# （说明：该命令会自动检测本地是否有模型，若无则从 Ollama 官方库下载。下载完成后会进入 `>>>` 交互式提示符，输入内容即可对话。输入 `/bye` 退出）
```

### 4.2 通过 RESTful API 方式（适用于业务集成）
除了命令行，您还可以通过宿主机的 API 进行调用测试：

**拉取模型 (API 方式):**
```bash
curl -X POST http://localhost:11434/api/pull \
     -H "Content-Type: application/json" \
     -d '{"name": "qwen3.5:4b"}'
```

**对话生成 (API 方式):**
```bash
curl -X POST http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d '{
           "model": "qwen3.5:4b",
           "prompt": "你好，请介绍一下你自己。",
           "stream": false
         }'
```

---

## 5. 外网访问与安全配置（可选但重要）

Ollama 默认仅监听 `127.0.0.1`。但在上述 Docker 部署中，我们使用了 `-p 11434:11434`，这在 Docker 的机制中已经默认将服务暴露给了宿主机的 `0.0.0.0`。
若需进一步规范公网访问及安全性，建议通过 **Nginx 
