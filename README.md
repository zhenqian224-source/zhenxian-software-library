# 震纤软件库

一个可以直接运行的独立软件策展网站。内置账号体系、真实评价、收藏、个人资料、外观个性化，以及一个零外部依赖的 SQLite 微型数据库。

界面采用暗色 / 浅色双主题，支持青柠、薄荷、珊瑚、天蓝、紫罗兰、琥珀六种强调色，以及宽适 / 紧凑两种内容密度。

## 快速开始

要求：**Node.js 24+**（使用 Node 自带的 `node:sqlite`，不需要安装任何 npm 依赖）。

```bash
npm start
```

启动后终端会打印两个地址：

```text
本机访问   http://localhost:3000
手机访问   http://192.168.x.x:3000
```

- 电脑浏览器打开 `http://localhost:3000`
- 手机与电脑连接同一个 Wi-Fi 后，打开终端打印的“手机访问”地址
- 默认监听 `0.0.0.0`，便于局域网调试。只想本机访问时：

  ```powershell
  $env:HOST='127.0.0.1'; npm start
  ```

- 修改端口：

  ```powershell
  $env:PORT='4000'; npm start
  ```

首次启动会自动创建 `data/zhenxian.db`，并写入 13 款软件、5 位演示用户和 34 条评价。

## 体验账号

| 用户名 | 密码 | 权限 |
| --- | --- | --- |
| `demo` | `demo1234` | 管理员 |

登录弹窗内也提供「一键体验」按钮。

## 已实现的功能

### 软件库

- 13 款人工策展软件，包含分类、平台、版本、授权、开发者、官网、编辑手记和高亮特性
- 搜索、分类筛选、平台筛选，以及编辑推荐 / 热度 / 评分 / 最新四种排序
- 响应式软件卡片、编辑精选区、策展原则、杂志式详情页
- 外链获取计数

### 登录系统

- 注册、登录、退出
- 用户名唯一约束与格式校验
- `scrypt` 加盐密码哈希
- HttpOnly、SameSite=Lax 会话 Cookie
- 会话存储在 SQLite 中，30 天过期
- 登录 / 注册 / 评论等接口带基础限流与同源校验

### 评论系统

- 登录用户可发布 1–5 星评价和文字评论
- 每个用户对同一款软件只保留一条评价，再次提交会更新原评价
- 评价排序：最有帮助 / 最新发布
- 点赞 / 取消点赞
- 用户可以删除自己的评价；管理员可以删除任意评价
- 评分实时汇总到软件总分与评价数

### 个性化

- 深色 / 浅色 / 跟随系统
- 六种强调色
- 宽适 / 紧凑内容密度
- 动效开关
- 未登录时保存在浏览器 localStorage，登录后同步到账号
- 个人资料：昵称、简介、头像颜色
- 我的收藏与收藏合辑

### 内置微型数据库

使用 Node.js 自带的 SQLite：

- 数据文件：`data/zhenxian.db`
- WAL 模式、外键约束
- 表：`users`、`sessions`、`software`、`comments`、`comment_likes`、`favorites`、`preferences`
- 零外部依赖，不需要 Docker、MySQL 或 Redis

## 目录结构

```text
.
├─ server.js               # HTTP 服务、鉴权、评论、收藏与 API
├─ src/
│  ├─ auth.js              # scrypt 密码哈希与校验
│  ├─ db.js                # SQLite 建表、初始化与基础查询
│  └─ seed.js              # 软件、用户和评价种子数据
├─ public/
│  ├─ index.html           # 主页面
│  ├─ 404.html             # 自定义 404
│  ├─ styles.css           # 设计系统与响应式样式
│  ├─ app.js               # 前端交互、渲染与 API 调用
│  ├─ boot.js              # 首屏主题恢复
│  └─ favicon.svg
├─ scripts/
│  └─ health-check.js      # 健康检查
└─ data/                   # 首次运行自动创建数据库
```

## API 摘要

所有 API 返回 JSON。需要登录的接口使用 `zx_session` Cookie。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/home` | 首页数据、分类、统计、当前用户 |
| GET | `/api/software` | 软件列表，支持 `q`、`category`、`platform`、`sort` |
| GET | `/api/software/:slug` | 软件详情、评论、相关推荐 |
| POST | `/api/auth/register` | 注册并登录 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/me` | 当前用户、偏好与收藏 ID |
| PATCH | `/api/me` | 修改昵称、简介、头像颜色 |
| PATCH | `/api/me/preferences` | 保存个性化设置 |
| GET | `/api/me/favorites` | 收藏的软件列表 |
| POST | `/api/software/:id/favorite` | 切换收藏 |
| POST | `/api/software/:id/comments` | 发布或更新评价（一人一评） |
| POST | `/api/comments/:id/like` | 点赞 / 取消点赞 |
| DELETE | `/api/comments/:id` | 删除自己的评价 |
| POST | `/api/software/:id/acquire` | 记录一次官网获取点击 |

健康检查：

```bash
npm run health
```

## 重置演示数据

先停止正在运行的服务，删除数据库文件，再重新启动：

```powershell
# 在项目目录，且服务已停止
Remove-Item data\zhenxian.db, data\zhenxian.db-wal, data\zhenxian.db-shm -ErrorAction SilentlyContinue
npm start
```

重新启动时会自动建表并写入种子数据。此操作会清除所有注册用户、收藏与评论。

## 手机访问排查

1. 手机和电脑必须连接同一个 Wi-Fi，不能一个用 Wi-Fi、一个用流量。
2. 手机上输入的是终端输出的局域网 IP，例如 `http://192.168.1.141:3000`，不能输入 `localhost`。
3. 如果页面打不开，允许 Node.js 通过 Windows 防火墙：
   Windows 安全中心 → 防火墙和网络保护 → 允许应用通过防火墙 → 找到 Node.js JavaScript Runtime，勾选“专用”。
4. 如果仍无法访问，检查路由器是否启用了 AP 隔离 / 客户端隔离，关闭后重试。
5. 电脑的局域网 IP 由路由器分配，重新联网后可能变化，以启动终端输出为准。

## 安全说明

这是一个本地优先的完整演示项目，不是面向公网的生产级系统：

- 密码使用 `scrypt` 加盐哈希，原文不落库
- 会话 Cookie 为 HttpOnly、SameSite=Lax，数据库内只保存随机会话 ID
- SQL 全部使用参数化查询
- 评论与用户内容在渲染时进行 HTML 转义
- 修改类请求校验同源 Origin，并按 IP 做基础限流
- 设置了 CSP、X-Frame-Options、nosniff 等安全响应头
- 演示账号密码公开，正式部署前应删除种子账号并配置 HTTPS 反向代理
- 监听 `0.0.0.0` 时，同一局域网内的设备都可以访问此站点

## 内容说明

本站为非商业的独立软件策展演示项目。软件名称、商标及相关权利归各自所有者所有。站内评价来自演示数据或注册用户，不代表软件官方立场。
