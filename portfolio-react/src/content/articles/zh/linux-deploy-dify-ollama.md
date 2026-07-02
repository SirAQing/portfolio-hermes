# Linux服务器部署 Docker + Dify 接入本地大模型方案

**文档状态**: 正式版 SOP  
**适用环境**: Linux 服务器（CentOS / Ubuntu）  
**前置条件**: 已完成 Docker、Docker Compose 插件安装，且宿主机上的 Ollama 已正常运行。

---

## 1. 目标与结论

本文档用于在 Linux 服务器上通过 Docker Compose 部署 Dify，并接入本机 Ollama 本地模型。

本次方案已在 CentOS 7 环境验证，Ubuntu 环境可参考同类流程。已验证的关键结论如下：

- 当前环境下，Dify 的 PostgreSQL 镜像不应继续使用 `postgres:15-alpine`
- 当前环境下，改用 `postgres:15` 可以正常初始化并稳定运行
- Dify 接入 Ollama 时，最稳妥的方式是直接使用宿主机可访问地址，例如 `http://<SERVER_IP>:11434`
- 不建议继续使用 `extra_hosts`、`links`、自定义 override 网络、防火墙兜底关闭等试错方案

---

## 2. 环境说明

本方案使用独立部署目录和可被浏览器访问的服务器地址。实际操作时，请将文中的 `<DEPLOY_BASE_DIR>`、`<DIFY_PROJECT_DIR>`、`<DIFY_DOCKER_DIR>`、`<DB_DATA_DIR>`、`<SERVER_IP>` 替换为你的真实环境值。

---

## 3. 获取 Dify 源码并准备配置

```bash
# 1. 创建部署目录
mkdir -p <DEPLOY_BASE_DIR>
cd <DEPLOY_BASE_DIR>

# 2. 安装 git
yum install -y git

# 3. 拉取源码
git clone https://gitee.com/dify_ai/dify.git <DIFY_PROJECT_DIR>

# 4. 进入 docker 部署目录
cd <DIFY_DOCKER_DIR>

# 5. 复制环境变量文件
cp .env.example .env
```

---

## 4. 最小修改部署 Dify

### 4.1 恢复干净的 Compose 文件

如果之前已经做过多轮试错，请先回到最小修改状态：

```bash
cd <DIFY_DOCKER_DIR>

# 停止当前服务
docker compose down

# 备份当前 compose 文件
cp docker-compose.yaml docker-compose.yaml.fixbak.$(date +%F-%H%M%S)

# 将旧的 override 或辅助脚本改名留档，不直接删除
[ -f docker-compose.override.yaml ] && mv docker-compose.override.yaml docker-compose.override.yaml.disabled.$(date +%F-%H%M%S)
[ -f pull_and_tag.sh ] && mv pull_and_tag.sh pull_and_tag.sh.disabled.$(date +%F-%H%M%S)

# 恢复官方原始 compose
git checkout -- docker-compose.yaml
```

### 4.2 只替换当前启用服务实际需要的镜像

不要再对整份 `docker-compose.yaml` 做大范围全局替换，只替换当前启用服务涉及到的镜像：

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

### 4.3 确认错误的静态解析污染已经消失

```bash
cd <DIFY_DOCKER_DIR>
docker compose config | egrep -n 'extra_hosts|db_postgres=|redis=|weaviate=' || true
```

如果没有输出，说明错误的 `extra_hosts` 污染已经清掉。

---

## 5. 修复 PostgreSQL 初始化失败

### 5.1 根因结论

本次实际排障已经确认：

- 不是普通目录权限问题
- 不是 `SELinux` 导致
- 不是必须靠关闭防火墙或改 Docker 网络模式才能解决
- 真正问题是 `postgres:15-alpine` 在当前宿主机环境下初始化失败
- 改为 `postgres:15` 后，数据库可以正常 `initdb` 并进入 `healthy`

### 5.2 不要直接删库目录，改为重命名留档

如果之前数据库初始化失败，不要直接执行危险的 `rm -rf`，改用重命名备份：

```bash
mv <DB_DATA_DIR> <DB_DATA_DIR>.failed.$(date +%F-%H%M%S)
mkdir -p <DB_DATA_DIR>
chown -R 999:999 <DB_DATA_DIR>
chmod 700 <DB_DATA_DIR>
```

### 5.3 先启动数据库和 Redis

```bash
cd <DIFY_DOCKER_DIR>
docker compose up -d db_postgres redis
docker compose ps
docker compose logs --tail 80 db_postgres
docker compose logs --tail 50 redis
```

### 5.4 正常结果判断

`db_postgres` 日志出现以下内容时，说明数据库已经恢复：

- `PostgreSQL init process complete; ready for start up.`
- `database system is ready to accept connections`

`docker compose ps` 中应看到：

- `db_postgres` 为 `healthy`
- `redis` 为 `healthy`

---

## 6. 启动整套 Dify

在数据库和 Redis 正常后，再启动全量服务：

```bash
cd <DIFY_DOCKER_DIR>
docker compose up -d
docker compose ps
```

建议立即检查关键服务日志：

```bash
docker compose logs --tail 100 api
docker compose logs --tail 100 worker
docker compose logs --tail 100 web
docker compose logs --tail 100 nginx
```

正常情况下：

- `web` 日志会出现 `Ready`
- `nginx` 日志会正常启动 worker processes
- `api` 与 `worker` 不再报数据库连接失败、Redis 连接失败、`db_postgres` 解析失败

---

## 7. 访问 Dify 并初始化管理员

如果 `nginx` 已对外监听 80 端口，可直接在浏览器访问服务器地址：

```text
http://<SERVER_IP>
```

首次打开后，若看到“设置管理员账户”页面，说明以下链路已经打通：

- 前端 `web`
- 网关 `nginx`
- 后端 `api`
- 数据库 `db_postgres`
- 缓存 `redis`

此时按页面提示填写管理员邮箱、用户名、密码即可完成初始化。

---

## 8. 在 Dify 中接入本地 Ollama

### 8.1 先确认 Ollama 服务本身正常

在服务器上执行：

```bash
docker ps | grep ollama
curl http://127.0.0.1:11434/api/tags
```

如果返回模型列表，说明 Ollama 正常。

如需重新运行 Ollama，建议使用：

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

### 8.2 Dify 中最稳的填写参数

进入 Dify 后台：

- 右上角头像
- `设置`
- `模型供应商`
- 选择 `Ollama`
- 点击 `添加模型`

推荐按以下方式填写：

- `模型名称`：以 `ollama list` 实际输出为准
- `模型类型`：`LLM`
- `凭据名称`：可填 `本地 Ollama`
- `基础 URL`：`http://<SERVER_IP>:11434`
- `API 密钥（可选）`：留空
- `模型类型（用途）`：`对话`
- `模型上下文长度`：`8192`

模型名称示例：

- 如果 `ollama list` 显示是 `qwen3.5:4b`，这里就填 `qwen3.5:4b`
- 如果 `ollama list` 显示是 `qwen:0.8b`，这里就填 `qwen:0.8b`

### 8.3 为什么基础 URL 推荐宿主机真实 IP

本次环境下，最稳的接法不是 `127.0.0.1`，也不建议优先用 `host.docker.internal`。

直接填写宿主机真实 IP 的好处：

- 不依赖额外的 Docker DNS 兼容行为
- 便于后续排查网络问题
- 与当前实际已验证的部署环境一致

如果服务器地址不同，请改成你的真实可访问地址。

### 8.4 保存后验证

如果填写正确，Dify 会通过 Ollama 验证模型。

如果验证失败，优先检查：

```bash
curl http://<SERVER_IP>:11434/api/tags
docker logs --tail 50 ollama
```

---

## 9. 创建第一个聊天应用测试

1. 进入 Dify 工作台
2. 创建空白应用
3. 选择聊天助手
4. 在模型处选择刚刚添加的 Ollama 模型
5. 输入简单提示词，例如“你是一个有帮助的 AI 助手”
6. 发送测试问题，验证是否正常回复

---

## 10. 常见问题

### 10.1 镜像拉取失败

如果执行 `docker compose up -d` 时仍然卡在拉取镜像，可继续只对当前启用服务进行精确替换，不要再做整份文件的大范围批量替换。

### 10.2 Dify 页面能打开但一直转圈

优先检查：

```bash
docker compose ps
docker compose logs --tail 100 api
docker compose logs --tail 100 worker
```

常见原因是：

- 数据库还在初始化
- `api` / `worker` 还在跑 migrations
- 后端依赖尚未完全 ready

### 10.3 Dify 里连不上 Ollama

优先检查：

- Dify 中的 `基础 URL` 是否误写成 `127.0.0.1`
- `模型名称` 是否和 `ollama list` 实际输出完全一致
- 宿主机 `11434` 端口是否可达

建议直接用宿主机真实 IP，例如：

```text
http://<SERVER_IP>:11434
```

### 10.4 Redis 告警

Redis 启动时若出现 `vm.overcommit_memory` 告警，可在宿主机执行：

```bash
sysctl vm.overcommit_memory=1
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
```

---

## 11. 本方案中明确不再采用的做法

以下做法已在本次环境中验证为不推荐继续使用：

- 使用 `postgres:15-alpine`
- 往 `docker-compose.override.yaml` 中继续注入 `extra_hosts`
- 用 `links` 或自定义静态解析强行修容器 DNS
- 通过关闭防火墙来替代根因修复
- 对 `docker-compose.yaml` 做大范围无差别镜像替换
- 直接对数据库目录执行危险的 `rm -rf`

这些试错记录已单独整理到备份文档中。
