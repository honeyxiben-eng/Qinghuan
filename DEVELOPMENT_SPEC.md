# 盐湖智管 · 开发说明书 v3.0

> 采卤井全生命周期数字化管理平台 | 前后端分离 | 移动端就绪 | 日间模式

---

## 1. 项目概述

### 1.1 产品定位
面向盐湖资源保障部的工业级 SaaS 平台，管理采卤井从基础台账、动态监测、化验分析到异常预警的全流程。PC 端为主控台，后续扩展微信小程序与安卓 App。

### 1.2 用户角色

| 角色 | 用户 | 权限范围 |
|------|------|---------|
| `admin` 综合管理 | 李福成、李想、郭福平 | 全局数据、分析、导出 |
| `brine` 采卤端 | 黄赐祥、徐长胜、王军、魁海善、田计东、刘艳东 | 监测数据录入 |
| `lab` 化验端 | 任宝梅、卢亚敏、李芳 | 化验数据录入 |
| `maintenance` 维修端 | 李国宝、张志明、柳福元、祁成 | 维修工单处理 |

### 1.3 井采线清单 (22条)

| 简称 | 名称 | 片区 |
|------|------|------|
| HX | 湖心线 | N 北部 |
| HX1 | 湖心一线 | N |
| HX2 | 湖心二线 | N |
| XB | 新北线 | C 中部 |
| XBSY | 新北试验线 | C |
| XB1 | 新北一线 | C |
| N7YC | 钠七延长线 | C |
| 18 | 十八线 | C |
| 20 | 二十线 | C |
| N1 | 钠一线 | E 东部 |
| N7NB | 钠七南坝 | E |
| 11 | 十一线 | W 西部 |
| 12 | 十二线 | W |
| 13 | 十三线 | W |
| 14 | 十四线 | W |
| X | 西线 | W |
| X1 | 西一线 | W |
| N | 南线 | S 南部 |
| LB | 老北线 | S |
| XBYC | 新北延长线 | S |
| N7X | 钠七西线 | S |
| N1YC | 钠一延长线 | S |

---

## 2. 技术架构

### 2.1 技术栈

| 领域 | 选型 | 理由 |
|------|------|------|
| 全栈框架 | **Next.js 16 App Router** | RSC 首屏零 JS，Route Handler 做 API |
| 数据库 | **PostgreSQL 16** | 工业级，NUMERIC 精度约束 |
| ORM | **Drizzle ORM** | 类型安全、轻量、边缘兼容、比 Prisma 快 |
| 样式 | **Tailwind CSS v4** | 原子化，@theme 自定义设计 Token |
| 图表 | **Apache ECharts 5.5** | Canvas 渲染，海量数据无压力 |
| 校验 | **Zod** | 前后端共享 Schema |
| 认证 | **jose** (JWT) | Edge 兼容，无 Node.js 依赖 |
| 状态管理 | **Zustand** | 仅全局主题/用户，轻量 |
| 字体 | **Inter** + **Tabular Figures** | 数字等宽，阅读舒适 |
| 图标 | **Lucide React** | 统一线条风格，Tree-shaking |

### 2.2 架构图

```
┌─────────────────────────────────────────────────┐
│                    CDN / Edge                     │
├─────────────────────────────────────────────────┤
│  Next.js 16 Server                                │
│  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  RSC Pages    │  │  Route Handlers (API v1)  │ │
│  │  (Server)     │  │  /api/v1/wells            │ │
│  │               │  │  /api/v1/monitorings       │ │
│  │               │  │  /api/v1/lab               │ │
│  │               │  │  /api/v1/analysis          │ │
│  └──────────────┘  └───────────┬───────────────┘ │
│                                │                   │
│  ┌─────────────────────────────┴────────────────┐ │
│  │         Service Layer (server/services/)      │ │
│  │         Business logic + Validation           │ │
│  └─────────────────────────────┬────────────────┘ │
│                                │                   │
│  ┌─────────────────────────────┴────────────────┐ │
│  │         Drizzle ORM (server/db/)              │ │
│  │         Schema + Queries + Migrations         │ │
│  └─────────────────────────────┬────────────────┘ │
├────────────────────────────────┼──────────────────┤
│  PostgreSQL 16                  │                   │
│  NUMERIC(p,s) precision        │                   │
└─────────────────────────────────────────────────┘

Mobile Clients (future)
├── 微信小程序 (uni-app)
└── 安卓 App (React Native)
    └── All consume /api/v1/*
```

### 2.3 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (top nav)
│   ├── page.tsx                  # Dashboard
│   ├── login/page.tsx            # Login
│   ├── wells/page.tsx            # 基础信息
│   ├── monitoring/page.tsx       # 监测数据
│   ├── lab/page.tsx              # 化验数据
│   ├── analysis/page.tsx         # 数据分析
│   └── api/v1/                   # REST API
│       ├── wells/route.ts
│       ├── monitorings/route.ts
│       ├── lab/route.ts
│       ├── analysis/route.ts
│       └── auth/route.ts
├── server/                       # 后端逻辑（前后端分离）
│   ├── db/
│   │   ├── schema.ts             # Drizzle Schema
│   │   ├── index.ts              # DB connection
│   │   └── migrate.ts            # Migration runner
│   ├── services/
│   │   ├── well-service.ts
│   │   ├── monitoring-service.ts
│   │   ├── lab-service.ts
│   │   └── analysis-service.ts
│   └── validation/
│       └── schemas.ts            # Zod schemas (shared)
├── components/                   # UI 组件
│   ├── layout/
│   │   └── TopNav.tsx
│   ├── ui/                       # 通用 UI
│   └── dashboard/                # 仪表盘专用
├── lib/                          # 工具
│   ├── precision.ts              # 精度常量（全平台唯一源）
│   ├── well-data.ts              # 井采线静态数据
│   └── utils.ts
└── types/                        # TypeScript 类型
    └── index.ts
```

---

## 3. 数据库设计

### 3.1 PostgreSQL Schema

```sql
-- Enums
CREATE TYPE well_status AS ENUM ('normal','abnormal','stopped','abandoned');
CREATE TYPE well_tech AS ENUM ('裸孔','全管','双管');

-- 井采线
CREATE TABLE well_lines (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL,
  short_name VARCHAR(10) NOT NULL UNIQUE,
  region     CHAR(1) NOT NULL CHECK (region IN ('N','C','E','S','W')),
  region_seq INTEGER NOT NULL
);

-- 采卤井
CREATE TABLE wells (
  well_id             VARCHAR(10) PRIMARY KEY,
  line_id             INTEGER NOT NULL REFERENCES well_lines(id),
  completion_date     DATE,
  technology          well_tech,
  tech_note           TEXT,
  well_size           VARCHAR(10),
  initial_water_level NUMERIC(8,2),          -- 负值，2位小数
  design_depth        NUMERIC(8,2),          -- 2位小数
  coord_x             NUMERIC(12,2),         -- 坐标，2位小数 ⚠️
  coord_y             NUMERIC(12,2),         -- 坐标，2位小数 ⚠️
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 动态监测
CREATE TABLE dynamic_monitoring (
  id            SERIAL PRIMARY KEY,
  well_id       VARCHAR(10) NOT NULL REFERENCES wells(well_id) ON DELETE CASCADE,
  collect_date  DATE NOT NULL,
  static_water  NUMERIC(8,2),              -- 负值，2位
  dynamic_water NUMERIC(8,2),              -- 负值，2位
  well_depth    NUMERIC(8,2),              -- 2位
  flow_rate     NUMERIC(8,2),              -- 2位
  pump_depth    NUMERIC(8,2),              -- 负值，2位
  pump_flow     NUMERIC(8,2),              -- 2位
  motor_power   NUMERIC(8,2),              -- 2位
  manufacturer  VARCHAR(100),
  status        well_status DEFAULT 'normal',
  fault_note    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 化验数据
CREATE TABLE lab_data (
  id         SERIAL PRIMARY KEY,
  well_id    VARCHAR(10) NOT NULL REFERENCES wells(well_id) ON DELETE CASCADE,
  test_date  DATE NOT NULL,
  tester     VARCHAR(50),
  viscosity  NUMERIC(8,2),                -- 2位
  density    NUMERIC(6,4),                -- ⚠️ 比重4位
  ph         NUMERIC(4,2),                -- 2位
  salinity   NUMERIC(8,3),                -- ⚠️ 矿化度3位
  k_plus     NUMERIC(8,3),                -- ⚠️ 离子3位
  mg2_plus   NUMERIC(8,3),
  cl_minus   NUMERIC(8,3),
  so42_minus NUMERIC(8,3),
  ca2_plus   NUMERIC(8,3),
  na_plus    NUMERIC(8,3),
  li_plus    NUMERIC(10,4),               -- ⚠️ Li⁺ 4位（值小）
  b2o3       NUMERIC(8,3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 精度规范（全平台唯一标准）

| 字段分类 | 精度 | 单位 | 说明 |
|----------|------|------|------|
| 水位类（初见/静/动/泵深） | 2位小数 | m | 负值表示地下深度，录入正数自动转负 |
| 井深/设计井深 | 2位小数 | m | |
| 流量/泵量 | 2位小数 | m³/h | |
| 电机功率 | 2位小数 | kW | |
| 坐标 X/Y | **2位小数** | — | CGCS2000 |
| 比重 | **4位小数** | — | |
| 矿化度 | **3位小数** | g/L | |
| K⁺/Mg²⁺/Cl⁻/SO₄²⁻/Ca²⁺/Na⁺ | **3位小数** | g/L | |
| Li⁺ | **4位小数** | g/L | 值范围 0.02–0.5 |
| B₂O₃ | **3位小数** | g/L | |
| 粘度 | 2位小数 | mPa·s | |
| pH | 2位小数 | — | |

**约束层次**：PostgreSQL NUMERIC(p,s) → Zod Schema → precision.ts 格式化函数

---

## 4. REST API 设计

### 4.1 通用规范

- Base: `/api/v1`
- 认证: `Authorization: Bearer <JWT>` 或 Cookie `saltlake_token`
- 分页: `?page=1&pageSize=20`, 响应 `meta: { page, pageSize, total, totalPages }`
- 统一响应:

```json
// 成功
{ "success": true, "data": {...}, "meta": {...} }
// 错误
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### 4.2 端点清单

```
POST   /api/v1/auth/login          # 登录
POST   /api/v1/auth/logout         # 登出

GET    /api/v1/wells               # 列表（分页/筛选/搜索）
GET    /api/v1/wells/:wellId       # 详情
POST   /api/v1/wells               # 创建
PUT    /api/v1/wells/:wellId       # 更新
DELETE /api/v1/wells/:wellId       # 删除
POST   /api/v1/wells/batch-delete  # 批量删除
POST   /api/v1/wells/import        # Excel 导入
GET    /api/v1/wells/export        # Excel 导出

GET    /api/v1/monitorings         # 列表
POST   /api/v1/monitorings         # 创建
PUT    /api/v1/monitorings/:id     # 更新
DELETE /api/v1/monitorings/:id     # 删除
POST   /api/v1/monitorings/batch-delete
POST   /api/v1/monitorings/import
GET    /api/v1/monitorings/export

GET    /api/v1/lab                 # 列表
POST   /api/v1/lab                 # 创建
PUT    /api/v1/lab/:id             # 更新
DELETE /api/v1/lab/:id             # 删除
POST   /api/v1/lab/batch-delete
POST   /api/v1/lab/import
GET    /api/v1/lab/export

GET    /api/v1/analysis/dashboard  # 仪表盘聚合
GET    /api/v1/analysis/lines      # 井采线统计
GET    /api/v1/analysis/compare    # 井采线对比
GET    /api/v1/analysis/report     # 月度报告
GET    /api/v1/analysis/alerts     # K⁺/Li⁺ 异常检测

GET    /api/v1/well-lines          # 井采线列表（静态数据）
```

---

## 5. 页面设计

### 5.1 布局：顶部导航

**不使用左右分栏。** 采用顶部水平导航栏：

```
┌──────────────────────────────────────────────────┐
│ ◈ 盐湖智管   中控台  基础信息  监测数据  化验数据  数据分析    [李福成 ▾] │
├──────────────────────────────────────────────────┤
│                                                  │
│              （页面内容区域 全宽）                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

- 导航栏高度: 52px
- Logo + 产品名在最左
- 5 个导航项（当前页高亮 + 底部指示条）
- 最右：用户头像 + 名称 + 下拉（退出/切换角色）
- 页面内容：最大宽度 1440px，居中，padding 32px
- 背景：纯白 `#ffffff`（日间模式专属）

### 5.2 设计系统

**色彩：**
- 主色（Primary）：Apple Blue `#0071e3`
- 主色浅：`#e8f4fd`
- 成功绿：`#34c759`
- 警告橙：`#ff9500`
- 危险红：`#ff3b30`
- 文字主：`rgba(0,0,0,0.88)`
- 文字次：`rgba(0,0,0,0.6)`
- 文字辅：`rgba(0,0,0,0.36)`
- 背景：`#f5f5f7`
- 卡片：`#ffffff`
- 分割线：`rgba(0,0,0,0.08)`

**字体：**
- 系统字体栈：`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif`
- 等宽数字：`font-variant-numeric: tabular-nums`
- 标题：26px / 22px / 18px / 15px，semibold
- 正文：13px
- 辅助：11px

**圆角：**
- 按钮/输入框：8px
- 卡片：12px
- 大容器/弹窗：16px

**阴影：**
- 卡片：`0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)`
- 弹窗：`0 20px 60px rgba(0,0,0,0.12)`

**间距：**
- 页面 padding：32px
- 卡片 padding：20px
- 元素间距：12px / 16px / 24px

### 5.3 页面详细设计

#### 5.3.1 中控台 `/`

**顶部区域 — 指标卡（5列）：**
- 采卤井总数 → 大号数字 + 单位
- 正常运行数 → 绿色数字 + 在线率百分比条
- 异常状态 → 红色（停止数 + 废弃数）
- 化验记录数 → 蓝色数字
- K⁺ ≤ 6.5 井数 → 橙色数字

**中部左侧（2/3宽）— ECharts 柱状图：**
- 22 条井采线井数分布图（横向柱状图）
- 每条线：总井数（浅色）+ 正常运行数（深色）

**中部右侧（1/3宽）— 快捷操作：**
- 4 个卡片链接：基础信息、监测数据、化验数据、数据分析

**底部 — K⁺/Li⁺ 双柱状图 + 动水位表：**
- 左半：K⁺ 和 Li⁺ 均值对比柱状图（ECharts）
- 右半：22 条井采线动水位网格列表（3 列）

#### 5.3.2 基础信息 `/wells`

**顶部：** 标题 "基础信息" + 井数统计 + [浏览/录入] 切换按钮

**浏览模式：**
- 筛选栏：片区下拉 + 井采线下拉 + 搜索框 + [导出 Excel] + [批量删除]
- 表格：井号/井采线/片区/成井时间/工艺/备注/井口尺寸/初见水位/设计井深/坐标X/坐标Y
- 支持行内编辑（点击编辑 → 单元格变输入框 → 保存/取消）
- 支持复选框批量选择
- 底部分页器
- 空状态插画

**录入模式：**
- 表单：井号（自动补全）/ 井采线 / 成井时间 / 工艺 / 备注 / 尺寸 / 初见水位 / 设计井深 / 坐标X / 坐标Y
- 初见水位：输入正数自动转负，保留2位小数
- [提交]按钮 + [Excel批量导入]

#### 5.3.3 监测数据 `/monitoring`

与基础信息页同结构，字段：
- 井号 / 采集日期 / 静水位 / 动水位 / 井深 / 流量 / 泵深 / 泵量 / 电机功率 / 厂家 / 运行状态
- 运行状态：Badge 组件（正常=绿/异常=红/停止=橙/废弃=灰）
- 录入时状态选「异常」显示异常说明输入框
- 水位字段 onBlur 正数自动转负

#### 5.3.4 化验数据 `/lab`

与监测页同结构，字段：
- 井号 / 化验日期 / 粘度 / 比重(4位) / pH / 矿化度(3位) / K⁺(3位) / Mg²⁺ / Cl⁻ / SO₄²⁻ / Ca²⁺ / B₂O₃ / Li⁺(4位) / Na⁺
- 精度提示标在 label 上
- 比重输入时前端校验最多4位小数

#### 5.3.5 数据分析 `/analysis`

**4 个功能卡片入口：**
1. 井采线对比 → 选择两条线，并排展示 K⁺/Li⁺ 曲线对比 + 均值对比
2. 月度报告 → 选择月份，生成各线 K⁺/Li⁺ 均值表 + K⁺<6.5 / Li⁺<0.15 低值井列表 + 导出
3. K⁺ 异常检测 → 设置阈值(%)，全井扫描最近两次 K⁺ 变化，按降幅排序
4. Li⁺ 异常检测 → 同上

**图表：** 使用 ECharts（Canvas 渲染），支持 tooltip 和区域缩放

#### 5.3.6 登录 `/login`

- 居中卡片（400px 宽）
- 顶部：Logo + "盐湖智管" + 英文副标题
- 步骤 1：选择业务端口（4 个选项垂直排列）
- 步骤 2：选择人员（头像 + 姓名 + 工号列表）
- [进入平台] 按钮
- 底部：版权信息

---

## 6. 业务规则

### 6.1 数据校验
1. 井号格式：字母 + 5位数字 (C05001)
2. 水位字段：正数自动 `x -1`，保留 2 位小数
3. 比重：正则 `/^\d+(\.\d{1,4})?$/`
4. 离子浓度：最多 3 位小数
5. Li⁺：最多 4 位小数
6. 坐标 X/Y：2 位小数

### 6.2 精度一致性
- 数据库层：NUMERIC(p,s) 物理约束
- API 层：Zod 校验拦截
- 展示层：`precision.ts` 统一 `toFixed()` 入口
- 导出 Excel：同样调用 `precision.ts`
- 小程序/App 共享 `precision.ts`（monorepo）

---

## 7. 性能策略

1. **RSC (React Server Components)**：仪表盘数据在服务端获取，客户端零 JS 水合
2. **Streaming**：大页面 Suspense 分块传输
3. **ECharts 懒加载**：仅 analysis 页 dynamic import
4. **XLSX 懒加载**：仅导入/导出时 dynamic import
5. **PG 连接池**：`pg.Pool({ max: 20 })`
6. **数据库索引**：well_id + 日期复合索引
7. **Partial Index**：最近 6 个月监测数据快速查询
8. **API 缓存头**：`stale-while-revalidate` 60s
9. **字体优化**：`next/font` 子集化中文字体
10. **图片优化**：`next/image` 自动 WebP

---

## 8. 安全策略

1. JWT 认证（Access Token 2h + Refresh Token 7d）
2. API 层 Zod 强制校验
3. SQL 参数化查询（Drizzle ORM 自动）
4. CORS 白名单
5. 速率限制：登录 5次/分钟
6. 外键约束始终启用
7. 审计日志（audit_logs 表）

---

## 9. 移动端扩展预案

- REST API 已完整（`/api/v1/*`）
- `precision.ts`、Zod Schema、TypeScript 类型可跨项目共享
- 小程序/App 直接调用 API，数据格式完全一致
- 增量同步：`GET /api/v1/sync?since=2026-06-01T00:00:00Z`

---

## 10. 坐标精度修正

- 坐标 X: `NUMERIC(12,2)` → 显示 2 位小数
- 坐标 Y: `NUMERIC(12,2)` → 显示 2 位小数
- 之前版本为 3 位，本版修正为 2 位
