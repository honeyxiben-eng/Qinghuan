# 智慧盐湖数据管理平台 · 优化说明书 v1.6

## 一、变更概览

### v1.6（本轮）
| 项目 | 变更 |
|------|------|
| GaugeIndicator 标签 | "K⁺3?" → "K⁺"，"Li⁺4?" → "Li⁺" |
| 化验表单标签 | "比重(4?" → "比重(4位)" |
| 日历下拉菜单 | 年/月选择器添加毛玻璃样式 |
| #14 空状态插图 | 新增 EmptyState 组件 + SVG 图标 |
| #16 全局进度条 | 顶部 2px 进度指示器 |
| #19 键盘导航 | Ctrl+1~5 快捷跳转，Ctrl+K 搜索 |

### v1.5
| 项目 | 变更 |
|------|------|
| 10 条 UI 增强 | 斑马纹/涟漪/数字跳动/侧边栏指示器等 |

### v1.4
| 项目 | 变更 |
|------|------|
| Select 下拉菜单 | 自定义毛玻璃下拉面板 |
| 毛玻璃效果 | 页面/卡片/面板增强 |

### v1.3
| 项目 | 变更 |
|------|------|
| DateField/导入按钮 | 高度统一 34px |

### v1.2
| 项目 | 变更 |
|------|------|
| 像素对齐 | 所有控件 34px |
| Button/TopHeader | hover JS → CSS |

### v1.1
| 项目 | 变更 |
|------|------|
| 表格行高 | 34px |
| 项目清理 | 删除临时文件 + shim |

### v1.0
| 项目 | 变更 |
|------|------|
| 表格行高 | 32px → 统一 |
| 流畅度 | 移除动画 |

---

## 二、项目文件结构（清理后）

```
TreeNB/
├── src/                          # 源代码
│   ├── app/                      # Next.js App Router 页面
│   │   ├── actions.ts            # Server Actions（CRUD 入口）
│   │   ├── globals.css           # 全局样式（HyperOS 3 设计系统）
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 中控台仪表盘
│   │   ├── login/page.tsx        # 登录页
│   │   ├── wells/page.tsx        # 基础信息（井档案）
│   │   ├── monitoring/page.tsx   # 监测数据
│   │   ├── lab/page.tsx          # 化验数据
│   │   ├── analysis/page.tsx     # 数据分析（趋势对比）
│   │   ├── chat/page.tsx         # 智能问答
│   │   └── api/                  # REST API 路由
│   ├── components/
│   │   ├── layout/               # 布局：Sidebar, TopHeader, Breadcrumb
│   │   ├── ui/                   # 通用：Button, Input, Select, Modal, Toast...
│   │   ├── dashboard/            # 中控台：KPI, 图表, 井位地图
│   │   └── ai/                   # 智能问答面板
│   ├── hooks/                    # 自定义 Hooks
│   ├── lib/                      # 工具库
│   │   ├── export.ts             # XLSX 导出
│   │   ├── store.ts              # Zustand 全局状态
│   │   ├── templates.ts          # Excel 导入模板
│   │   ├── useFavorites.ts       # 收藏功能 Hook
│   │   └── well-data.ts          # 井采线/片区静态数据
│   ├── server/                   # 服务端
│   │   ├── db/index.ts           # better-sqlite3 连接
│   │   ├── services/             # 业务逻辑层
│   │   └── api/                  # API 工具函数
│   ├── shared/                   # 前后端共享
│   │   ├── precision.ts          # 精度常量 + 格式化函数
│   │   ├── types.ts              # TypeScript 类型定义
│   │   ├── validation.ts         # Zod 校验 schema
│   │   ├── constants.ts          # 业务常量
│   │   ├── utils.ts              # 工具函数
│   │   ├── api-client.ts         # 客户端 API 封装
│   │   └── index.ts              # 统一导出
│   └── middleware.ts             # Next.js 中间件（鉴权）
├── prisma/                       # 数据库
│   ├── schema.prisma             # Prisma Schema（SQLite）
│   ├── seed.ts                   # 种子数据
│   └── saltlake.db               # SQLite 数据库文件
├── public/                       # 静态资源
├── scripts/                      # 运维脚本
├── package.json                  # 依赖配置
├── next.config.ts                # Next.js 配置
├── tsconfig.json                 # TypeScript 配置
├── postcss.config.mjs            # PostCSS 配置
├── prisma.config.ts              # Prisma 配置
├── docker-compose.yml            # Docker 部署
├── vercel.json                   # Vercel 部署
├── .gitignore                    # Git 忽略规则
├── .env.example                  # 环境变量模板
├── FEATURE_SPEC.md               # 功能规格
├── DEVELOPMENT_SPEC.md           # 开发规格
├── DEPLOYMENT_SUMMARY.md         # 部署说明
└── dist/                         # 打包输出（便携版）
```

---

## 三、代码架构说明

### 数据流

```
用户操作 → UI 组件 → Server Actions (actions.ts) → Services → DB (better-sqlite3)
                ↓
          Zustand Store ←── 状态同步
```

### 核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 数据库 | `server/db/index.ts` | SQLite 连接、SQL 执行、事务 |
| 业务层 | `server/services/*.ts` | CRUD 逻辑、分页、筛选 |
| 校验层 | `shared/validation.ts` | Zod schema 校验 |
| 格式化 | `shared/precision.ts` | 数值精度、日期格式化 |
| 状态 | `lib/store.ts` | Zustand 全局状态 |
| 导出 | `lib/export.ts` | XLSX 导出 |

### 样式系统

基于 **HyperOS 3 设计语言**，使用 CSS 变量实现主题：

- `--bg-void`: 背景色
- `--surface-1/2/3`: 表面层级
- `--t1/2/3/4`: 文字颜色层级
- `--accent`: 主题色（蓝色）
- `--glass-border`: 玻璃边框
- `--ease-spring`: 弹性动画曲线

---

## 四、已优化项

### 第七轮（v1.6）
- ✅ GaugeIndicator 标签修复（K⁺3? → K⁺，Li⁺4? → Li⁺）
- ✅ 化验表单标签修复（比重(4? → 比重(4位)）
- ✅ 日历下拉菜单毛玻璃样式
- ✅ 空状态 SVG 插图组件（EmptyState）
- ✅ 全局进度条（顶部 2px 指示器）
- ✅ 键盘导航（Ctrl+1~5 跳转，Ctrl+K 搜索）

### 第六轮（v1.5 - 10 条 UI 增强）
- ✅ 表格斑马纹、按钮涟漪、数字跳动
- ✅ 侧边栏指示器、输入框光晕、卡片悬浮
- ✅ 骨架屏增强、Toast 滑入、排序反馈、页面过渡

### 第五轮（v1.4）
- ✅ Select 下拉菜单自定义毛玻璃
- ✅ 页面/卡片/面板毛玻璃效果

### 第四轮（v1.3）
- ✅ DateField 高度 40→34px
- ✅ 导入按钮/表单 section 统一

### 第三轮（v1.2）
- ✅ 所有控件 34px、hover JS → CSS

### 第二轮（v1.1）
- ✅ 表格行高 34px、项目清理

### 第一轮（v1.0）
- ✅ 表格行高统一、流畅度优化

---

## 五、后续可优化方向

| 方向 | 说明 | 优先级 |
|------|------|--------|
| 虚拟滚动 | 大数据量表格使用 @tanstack/react-virtual | 中 |
| 错误边界 | 为每个页面添加 error.tsx（已有） | ✅ 已完成 |
| 国际化 | 如需支持多语言 | 低 |
| 测试 | 添加单元测试 | 中 |
| PWA | 支持离线访问 | 低 |

---

## 六、部署方式

### 1. Vercel（推荐）
```bash
vercel --prod
```

### 2. Docker
```bash
docker-compose up -d
```

### 3. 便携版（给同事演示）
```
解压 dist/ → 双击 启动平台.bat
```

---

*文档版本: v1.6 | 更新日期: 2026-06-12*
