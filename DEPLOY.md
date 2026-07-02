# Hermes 部署指南

架构：前端托管在 Cloudflare Pages，后端通过 Docker Compose 部署在你的服务器上，子域名 `api.liumingqing.com`。

---

## 前置条件

- 一个域名：`liumingqing.com`
- 一台云服务器（推荐 2核4GB，Ubuntu 22.04）
- 服务器上已安装 Docker + Docker Compose
- 代码已推送到 GitHub

---

## 1. 域名解析

在域名 DNS 管理处添加两条记录：

| 类型 | 主机记录 | 值 |
|---|---|---|
| A | `api` | 你的服务器公网 IP |
| CNAME | `@` | `liumingqing.pages.dev`（Cloudflare Pages 分配） |

> 如果你把根域名也交给 Cloudflare Pages，通常直接在 Pages 控制台里添加自定义域名即可自动配置。

---

## 2. 后端部署

SSH 登录服务器，进入项目目录：

```bash
cd /opt/hermes
```

创建环境文件并编辑：

```bash
cp .env.example .env
nano .env
```

重点填写：

- `DEEPSEEK_API_KEY`
- `EMBEDDING_API_KEY`
- `JWT_SECRET_KEY`
- `OWNER_INITIAL_PASSWORD`

创建持久化目录：

```bash
mkdir -p data chroma_data caddy_data caddy_config
```

构建并启动：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f hermes
```

---

## 3. 前端部署（Cloudflare Pages）

1. 打开 Cloudflare Dashboard → Pages → Create a project
2. 选择 GitHub 仓库
3. 配置：

| 配置项 | 值 |
|---|---|
| Root directory | `portfolio-react` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |
| Environment variables | `NODE_VERSION=20`，`VITE_API_BASE=https://api.liumingqing.com` |

4. 添加自定义域名 `liumingqing.com`
5. 保存，等待首次构建完成

之后每次 `git push` 到 `main` 分支，Cloudflare Pages 会自动构建并部署。

---

## 4. 验证

```bash
# 后端健康检查
curl https://api.liumingqing.com/api/health

# 前端访问
open https://liumingqing.com
```

---

## 5. 备份

需要定期备份的目录：

- `./data/hermes.db`
- `./chroma_data/`
- `./caddy_data/`

建议写一条 `rsync` 或 `restic` 定时任务同步到对象存储。

---

## 6. 更新

代码更新后：

```bash
git pull
docker compose up -d --build
```

前端会在 push 后自动更新。
