# 智慧盐湖数据管理平台 — 部署与改造总结

## 项目概况

| 项 | 值 |
|---|-----|
| 框架 | Next.js 16.2 + React 19 + TypeScript |
| UI | Tailwind CSS 4 + Lucide Icons + ECharts |
| 域名 | https://moodos.cn |
| 部署 | Vercel Hobby (hnd1, 东京) |
| 数据库 | Turso 免费层 (9GB, aws-ap-northeast-1, 东京) |

---

## 一、UI 改版

### 中控台 (`src/app/page.tsx`)

- **统计卡片全面升级**：渐变色顶部装饰条 + 独立 icon 背景区 + hover 微上移效果，5 张卡片分别用 indigo/emerald/rose/sky/amber 配色
- **K⁺ / Li⁺ 对比从简单表格改为横向进度条**：每条井采线同时展示 K⁺ 和 Li⁺ 的直观比例
- **容错机制**：`Promise.all` 改为 `Promise.allSettled`，单接口失败不拖垮整个页面

### 数据浏览页（基础信息 / 监测 / 化验）

- **表格 ↔ 卡片视图切换**：三个页面均新增切换按钮（`ViewToggle` 组件）
- **卡片视图**：每条记录渲染为独立卡片——顶部显示井号+日期，主体为各指标网格，K⁺ ≤6.5 自动高亮黄色警告
- **表格视图**：表头 sticky 固定，行间距优化，hover 高亮

### 全局 CSS (`src/app/globals.css`)

- 新增 5 组渐变色 token（`--indigo-grad` / `--emerald-grad` / `--amber-grad` / `--sky-grad` / `--rose-grad`）
- 新增组件样式：`.stat-card-glossy` / `.data-card-grid` / `.data-card-item` / `.view-toggle` / `.filter-chip` / `.pagination-compact`
- 新增 `cardIn` 动画 + `.card-stagger` 逐卡延迟入场
- 修复分页箭头：Unicode `«‹›»` → HTML 实体 `&laquo;&lsaquo;&rsaquo;&raquo;`

---

## 二、数据库迁移历程

### 起点：本地 SQLite + better-sqlite3

```
src/server/db/index.ts  →  better-sqlite3 直连 prisma/saltlake.db
```

Vercel serverless 环境不支持原生 Node 模块，部署后登录直接 500。

### 尝试 1：Neon Serverless PostgreSQL

- 驱动：`@neondatabase/serverless`
- 全部 6 个 service 文件从 SQLite SQL 改成 PostgreSQL 语法（`strftime` → `TO_CHAR`，`?` → `$1/$2`，`AUTOINCREMENT` → `SERIAL`）
- **结果**：免费层计算单元闲置后休眠，冷启动唤醒 15-30 秒，超过 Vercel 30 秒限制 → **超时 504**

### 尝试 2：Supabase PostgreSQL (Tokyo)

- 驱动：`pg`
- **结果**：项目恢复后 DNS 始终未传播到 Vercel `iad1` 区域 → **ENOTFOUND**

### 最终方案：Turso (SQLite 兼容)

- 驱动：`@libsql/client` HTTP
- 全部 SQL 从 PostgreSQL 语法还原回 SQLite 语法
- 本地 `prisma/saltlake.db` 数据迁移至 Turso（334 口井 / 330 条监测 / 601 条化验）
- **结果**：**9GB 免费，零冷启动，同区域延迟 <10ms**

### 驱动替换对比

```
之前：
  better-sqlite3 → 原生 C++ addon → Vercel 不兼容

之后：
  @libsql/client → HTTP fetch → Vercel serverless 完全兼容
  连接方式：libsql://saltlake-jasonxiben.aws-ap-northeast-1.turso.io
```

---

## 三、关键代码改动

### `src/server/db/index.ts`（数据库层）

```typescript
// 之前：better-sqlite3 同步 API
import Database from "better-sqlite3"
const db = new Database(DB_PATH)
export function all<T>(sql, params) { return db.prepare(sql).all(...params) }

// 之后：@libsql/client 异步 HTTP
import { createClient } from "@libsql/client"
const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
export async function all<T>(sql, params) {
  const result = await client.execute({ sql, args: params })
  return result.rows.map(row => {
    const obj = {}
    for (let i = 0; i < result.columns.length; i++) obj[result.columns[i]] = row[i]
    return obj
  })
}
```

### `src/server/services/auth.ts`（用户认证）

- `CREATE TABLE` 中 `SERIAL PRIMARY KEY` → `INTEGER PRIMARY KEY AUTOINCREMENT`
- 所有函数从同步改为 `async/await`
- 占位符：`$1/$2` → `?`
- `DEFAULT NOW()` → `DEFAULT (datetime('now'))`

### `src/server/services/analysis.ts`（数据分析）

- `TO_CHAR(col, 'YYYY-MM')` → `strftime('%Y-%m', col)`
- `CURRENT_DATE - INTERVAL '18 months'` → `datetime('now','-18 months')`
- 所有函数改为 `async/await`

### `src/app/page.tsx`（中控台容错）

```typescript
// 之前：一个失败全部报错
const [a,b,c,d] = await Promise.all([...])
catch { setErr(true) }

// 之后：各自独立，失败不影响其余
const results = await Promise.allSettled([...])
const [a,b,c,d] = results.map(r => r.status === "fulfilled" ? r.value : null)
```

### `vercel.json`

```json
{ "regions": ["hnd1"] }
```

Vercel 函数与 Turso 数据库均位于东京，延迟 <10ms。

---

## 四、部署架构

```
┌────────────────────────────────────────────┐
│              用户浏览器                      │
└────────────────┬───────────────────────────┘
                 │ HTTPS
                 ▼
┌────────────────────────────────────────────┐
│          Vercel (hnd1, 东京)                │
│    ┌──────────────────────────────────┐    │
│    │  Next.js 16  App Router           │    │
│    │  /api/auth/*  (Serverless Func)   │    │
│    │  Server Actions (@/app/actions)   │    │
│    └──────────────┬───────────────────┘    │
└───────────────────┼────────────────────────┘
                    │ HTTP (同区域, <10ms)
                    ▼
┌────────────────────────────────────────────┐
│     Turso (aws-ap-northeast-1, 东京)        │
│    ┌──────────────────────────────────┐    │
│    │  saltlake 数据库 (9GB 免费)       │    │
│    │  ├── WellLineInfo     (22行)      │    │
│    │  ├── WellInfo          (334行)     │    │
│    │  ├── DynamicMonitoring (330行)     │    │
│    │  ├── LabData            (601行)     │    │
│    │  └── users              (3行)       │    │
│    └──────────────────────────────────┘    │
└────────────────────────────────────────────┘
```

---

## 五、数据迁移明细

| 表名 | 中文名 | 迁移行数 |
|------|--------|---------|
| WellLineInfo | 井采线 | 22 |
| WellInfo | 井基础信息 | 334 |
| DynamicMonitoring | 动态监测数据 | 330 |
| LabData | 化验数据 | 601 |
| MaintenanceRecord | 维护记录 | 0 |
| users | 用户 | 3 (admin/lab01/brine01) |

---

## 六、当前账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| lab01 | lab123 | 化验员 |
| brine01 | brine123 | 采卤员 |

---

## 七、已知问题与后续优化

| 问题 | 原因 | 方案 |
|------|------|------|
| 分析页"生成报告"/"异常检测"较慢 | N+1 查询（每口井单独查），HTTP 往返次数多 | 改为单条 SQL 批量查询 |
| 中控台偶发超时 | `lm()` 函数逐月遍历最多 18 次查询 | 改为 `SELECT DISTINCT substr(col,1,7)` 一次性取最新月份 |

---

## 八、技术栈

```
前端：  Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
图表：  ECharts 5 + echarts-for-react
图标：  Lucide React
状态：  Zustand
认证：  bcryptjs + jose (JWT)
数据库： Turso (libsql) + Prisma (类型生成)
部署：  Vercel (hnd1, 东京)
```
