## Portfolio 内容适配方案

### 你的定位

AI/数据方向转型，核心模块是工作经历 + 项目经验 + 技能栈，已有简历可直接使用。

---

### 模块处理决策

| 模块 | 决策 | 理由 |
|------|------|------|
| HeroSection | **改** | 标题/徽章/简介全部替换为你的定位 |
| ExperienceSection | **改** | 核心模块，替换为你的工作经历时间线 |
| ProjectsSection | **改** | 核心模块，替换为你的项目经验 |
| SkillsSection | **改** | 核心模块，替换为你的技术栈 |
| ContactSection | **改** | 换成你的邮箱和社交链接 |
| SharingSection | **删或大改** | 原作者的社交证明设计不适用于你 |
| EducationSection | **按需保留** | 如果学历有竞争力就保留 |
| CertificationsSection | **按需保留** | 如果有相关认证就保留 |
| SidebarNav | **自动适配** | 跟着模块增删走 |
| HeaderActions | **不改** | 语言切换和主题切换保留 |
| Footer | **改** | 换成你的名字 |

---

### 各模块适配细节

#### 1. HeroSection — 首屏英雄区

**改什么：**
- `i18n.tsx` 中 `hero.*` 的全部翻译内容
- 组件中的硬编码：`@santifer` → 你的昵称/handle
- 删掉 `career-ops` 徽章（含 53.2K star 数据）
- 删掉 WIRED / BUSINESS INSIDER 媒体报道
- 头像换成你自己的照片（`src/assets/` 下放新图片）

**你需要准备的内容：**
- 一句话标题（例："用数据与 AI 驱动业务决策"）
- 2-3 个轮播副标题（例："ETL 全链路架构" / "AI 辅助开发实践" / "数据系统从 0 到 1"）
- 1-2 个身份徽章（例："数据工程师" / "AI 实践者"）
- 3-4 段个人简介（每段 1-2 句话，讲述你的故事线）
- CTA 按钮文字（保留默认的也行）

**涉及文件：** `i18n.tsx` + `HeroSection.tsx`

---

#### 2. ExperienceSection — 工作经历

**改什么：**
- 6 个技能标签替换为你的核心能力（如 "ETL 架构设计"、"数据建模"、"AI Agent 开发" 等）
- 工作经历卡片：替换公司名、地点、时间段、职位、描述
- 卡片数量改为你的实际经历数（不一定要 5 个）
- 删除原作者特有的 bullet points 和 exit badge

**你需要准备的内容：**
- 4-6 个核心能力标签（标题 + 一句话描述）
- 每段经历的：公司名、地点、时间段、职位title、1-2 句描述
- 如果有特别想突出的经历，可以加 bullet points 和技术标签

**涉及文件：** `i18n.tsx`（exp.tag.* 和 exp.job.* 系列）+ `ExperienceSection.tsx`（硬编码部分）

---

#### 3. ProjectsSection — 项目展示

**改什么：**
- GitHub 链接换成你的
- 删掉 AgentInfraCard（这是原作者的多 agent 系统架构图）
- 替换项目卡片：标题、描述、技术标签、star/fork 数据（如果有的话）、链接
- 修改 StatusBadge 的颜色匹配逻辑（去掉西班牙语字符串）

**你需要准备的内容：**
- 3-5 个项目，每个包含：项目名、一段描述、技术栈标签列表、项目链接
- 如果有 GitHub 项目可以加上 star 数
- 项目类型标签（开源 / 生产环境 / 个人项目 等）

**涉及文件：** `ProjectsSection.tsx`（大量硬编码）

---

#### 4. SkillsSection — 技能栈

**改什么：**
- 语言部分：替换为你的语言能力（如中文母语、英语工作熟练等）
- 软技能标签：替换为你的 5-7 个软技能
- 技术栈分组：完全重写，按你的技术栈分类

**你需要准备的内容：**
- 语言能力 + 熟练度
- 5-7 个软技能
- 技术栈分组（建议 4-5 组），例如：
  - 数据处理：Python, SQL, Spark, dbt, Airflow...
  - ETL/数据平台：Informatica, Kettle, DataX...
  - AI/ML：LangChain, OpenAI API, RAG...
  - 基础设施：Docker, Linux, Git...

**涉及文件：** `i18n.tsx`（skills.* 系列）+ `MiscSections.tsx`（技术栈硬编码部分）

---

#### 5. ContactSection — 联系方式

**改什么：**
- 邮箱地址
- LinkedIn 链接（如果有）
- 描述文字

**涉及文件：** `i18n.tsx`（contact.* 系列）+ `App.tsx`（硬编码的 href 链接）

---

#### 6. SharingSection — 删除或大改

**建议：** 直接删除这个区块。原作者设计这个模块是为了展示 Twitter/Reddit/LinkedIn 上的高互动帖子和演讲经历，这是为已有社交影响力的人设计的。你作为 AI/数据方向转型者，更适合让项目经验自己说话。

如果你后续有技术博客、开源贡献、社区分享，可以重新设计一个更简洁的"分享"模块。

**涉及文件：** 删除 `SharingSection.tsx`，从 `App.tsx` 移除引用，从 `SidebarNav.tsx` 移除导航项。

---

#### 7. EducationSection & CertificationsSection — 按需

如果保留，替换为：
- 教育经历：学校、年份、专业/学位、备注
- 认证：名称、颁发机构、年份、链接

**涉及文件：** `i18n.tsx`（edu.* / cert.*）+ `MiscSections.tsx`（CERTS 数组等硬编码）

---

#### 8. Footer

改版权文字和隐私链接。

**涉及文件：** `App.tsx`

---

### 替换顺序建议

按改动成本和视觉影响排序：

1. **i18n.tsx** — 改一个文件就能让页面 60% 的文字变掉，性价比最高
2. **HeroSection.tsx** — 删掉 career-ops 徽章和媒体报道，换头像
3. **ExperienceSection.tsx** — 改工作经历卡片
4. **ProjectsSection.tsx** — 改项目卡片，删 AgentInfraCard
5. **MiscSections.tsx** — 改技能栈/教育/认证
6. **App.tsx** — 删 SharingSection、改 Footer 和 ContactSection 链接
7. **SidebarNav.tsx** — 如果删了 SharingSection，同步移除导航项

---

### 关于 ThemeToggle.tsx

这个组件和 HeaderActions.tsx 功能重复（都管理主题切换），且 App.tsx 中实际使用的是 HeaderActions。建议直接删除 ThemeToggle.tsx 避免冲突。

---

### 快速启动清单

在开始改代码之前，先把这些内容准备好（可以用文本/表格）：

```
□ Hero 标题（1 句话）+ 轮播副标题（2-3 个）
□ 身份徽章（1-2 个）
□ 个人简介（3-4 段短句，讲故事线）
□ 头像照片（正方形，推荐 400x400+）
□ 核心能力标签（4-6 个，标题+描述）
□ 工作经历（公司/地点/时间/职位/描述，2-5 段）
□ 项目列表（名称/描述/技术标签/链接，3-5 个）
□ 技术栈分组（4-5 组）
□ 语言能力 + 软技能
□ 邮箱 + LinkedIn + GitHub
□ 教育经历（如果要保留）
□ 认证列表（如果要保留）
```
