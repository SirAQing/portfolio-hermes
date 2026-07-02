# 个人 AI OS 管理后台升级设计

## 1. 总体定位

将当前管理后台从「配置面板」升级为「个人 AI OS 的驾驶舱」。新增「用户管理」与「笔记管理」两个核心模块，使 AI 助理具备运营、创作、记忆能力。

## 2. 新增模块

### 2.1 用户管理（User Management）

- 管理所有注册用户（owner / interviewer / user）
- 支持完整 CRUD：新增、编辑、禁用、删除、重置密码
- 展示用户画像：对话次数、高频问题、来源渠道、最后活跃
- 未来支持 AI 自动打标签（如「高意向面试官」「潜在合作方」）

### 2.2 笔记管理（Notes Management）

- 笔记既是对外发布的博客文章，也是知识库来源
- Markdown + AI 辅助编辑器
- 支持草稿/已发布/归档状态
- 支持标签管理
- 保存后异步生成 AI 摘要、批注、推荐标签
- 发布时可选自动同步到专用知识库

## 3. 数据模型

### 3.1 users 表扩展字段

- `nickname`
- `avatar_url`
- `phone`
- `source`（register / invite_code）
- `status`（active / disabled / pending）
- `invite_code_id`
- `last_login_at`
- `admin_notes`
- `metadata`（JSON）

### 3.2 notes 表

- `id`, `title`, `slug`, `content`
- `status`
- `summary`, `ai_notes`
- `tags`（JSON 数组）
- `is_kb_synced`, `kb_id`
- `published_at`, `created_at`, `updated_at`
- `view_count`, `likes`

### 3.3 tags 表

- `id`, `name`, `slug`, `color`, `usage_count`

### 3.4 note_tags 关联表

多对多关联 notes 与 tags。

## 4. 后端 API

### 4.1 用户管理（owner 权限）

- `GET /api/admin/users`
- `GET /api/admin/users/{id}`
- `POST /api/admin/users`
- `PUT /api/admin/users/{id}`
- `DELETE /api/admin/users/{id}`
- `POST /api/admin/users/{id}/reset-password`
- `GET /api/admin/users/{id}/stats`

### 4.2 笔记管理

- `GET /api/admin/notes`
- `GET /api/admin/notes/{id}`
- `POST /api/admin/notes`
- `PUT /api/admin/notes/{id}`
- `DELETE /api/admin/notes/{id}`
- `POST /api/admin/notes/{id}/publish`
- `POST /api/admin/notes/{id}/ai-annotate`
- `POST /api/admin/notes/{id}/sync-to-kb`

### 4.3 标签管理

- `GET /api/admin/tags`
- `POST /api/admin/tags`
- `PUT /api/admin/tags/{id}`
- `DELETE /api/admin/tags/{id}`

## 5. 前端设计

### 5.1 AdminPage 新增 Tab

- 用户管理
- 笔记管理

### 5.2 用户管理页

- 左侧：用户列表 + 搜索/筛选
- 右侧：用户详情抽屉 / 编辑表单

### 5.3 笔记管理页

- 左侧：笔记列表 + 搜索/状态筛选
- 中间：Markdown 编辑器 + 预览
- 右侧：AI 辅助面板 + 标签管理 + 发布设置

### 5.4 标签管理弹窗

支持创建、编辑颜色、合并、删除标签。

## 6. AI-Native 增强

1. **AI 自动批注**：保存后异步生成摘要、批注、推荐标签、关键要点。
2. **笔记 ↔ 知识库同步**：发布时自动 chunk 并进入「笔记」专用 KB。
3. **对话转笔记**：将高质量对话一键转为笔记草稿。
4. **用户画像**：统计高频问题、话题标签、使用时段，生成 AI 标签。
5. **自然语言运营指令**：通过自然语言让 AI 自动整理访客问题并生成笔记。

## 7. 实现阶段

- **第一阶段**：用户管理 CRUD + 笔记管理 CRUD + 标签管理
- **第二阶段**：AI 摘要/批注/标签生成
- **第三阶段**：笔记 ↔ 知识库自动同步
- **第四阶段**：用户画像 + 对话转笔记 + 自然语言运营指令
