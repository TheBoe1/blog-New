# 博客管理后台 API 开发手册

## 概述

本文档定义了博客管理后台所需的后端 API 接口规范，供后端开发人员参考实现。

## 基础信息

- **基础URL**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: JWT Token (Bearer Authentication)

## 统一响应格式

```typescript
interface ApiResponse<T = any> {
  code: number        // 0 表示成功，非 0 表示错误
  message: string     // 响应消息
  data: T            // 响应数据
  timestamp: number  // 时间戳
}

interface PaginatedResponse<T> {
  list: T[]          // 数据列表
  total: number      // 总记录数
  page: number       // 当前页码
  pageSize: number   // 每页条数
}
```

## 认证接口

### 1. 用户登录

**POST** `/auth/login`

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": 1704067200000
}
```

### 2. 获取当前用户信息

**GET** `/auth/user`

**请求头**: `Authorization: Bearer {token}`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "1",
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": 1704067200000
}
```

### 3. 用户登出

**POST** `/auth/logout`

**响应**:
```json
{
  "code": 0,
  "message": "登出成功",
  "data": null,
  "timestamp": 1704067200000
}
```

---

## 文章接口

### 1. 获取文章列表

**GET** `/articles`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |
| keyword | string | 否 | 搜索关键词 |
| categoryId | string | 否 | 分类ID |
| status | string | 否 | 状态: published/draft |
| year | number | 否 | 年份筛选 |
| sortBy | string | 否 | 排序字段 |
| sortOrder | string | 否 | 排序方式: asc/desc |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "1",
        "title": "Vue 3 组合式 API 最佳实践",
        "slug": "vue3-composition-api-best-practices",
        "summary": "深入探讨 Vue 3 组合式 API 的使用技巧...",
        "content": "文章原始内容...",
        "htmlContent": "<p>文章HTML内容...</p>",
        "cover": "https://example.com/cover.jpg",
        "categoryId": "1",
        "categoryName": "前端开发",
        "tags": ["Vue", "TypeScript"],
        "author": "博主",
        "authorId": "1",
        "viewCount": 256,
        "likeCount": 32,
        "commentCount": 8,
        "isPublished": true,
        "isTop": true,
        "createdAt": "2024-01-15T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z",
        "publishedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  },
  "timestamp": 1704067200000
}
```

### 2. 获取文章详情

**GET** `/articles/:id`

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 文章ID |

**响应**: 同上文章对象

### 3. 创建文章

**POST** `/articles`

**请求体**:
```json
{
  "title": "新文章标题",
  "slug": "new-article-slug",
  "summary": "文章摘要",
  "content": "文章原始内容",
  "htmlContent": "<p>文章HTML内容</p>",
  "cover": "https://example.com/cover.jpg",
  "categoryId": "1",
  "tags": ["Vue", "TypeScript"],
  "isPublished": true,
  "isTop": false,
  "publishedAt": "2024-01-15T00:00:00.000Z"
}
```

**响应**: 返回创建的文章对象

### 4. 更新文章

**PUT** `/articles/:id`

**请求体**: 同创建文章

**响应**: 返回更新后的文章对象

### 5. 删除文章

**DELETE** `/articles/:id`

**响应**:
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null,
  "timestamp": 1704067200000
}
```

### 6. 上传文章图片

**POST** `/articles/upload`

**请求**: multipart/form-data
| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 |

**响应**:
```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/xxx.jpg",
    "filename": "xxx.jpg",
    "size": 102400
  },
  "timestamp": 1704067200000
}
```

---

## 分类接口

### 1. 获取分类列表

**GET** `/categories`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "1",
      "name": "前端开发",
      "slug": "frontend",
      "description": "前端开发相关技术文章",
      "parentId": "",
      "sortOrder": 1,
      "articleCount": 45,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": 1704067200000
}
```

### 2. 创建分类

**POST** `/categories`

**请求体**:
```json
{
  "name": "新分类",
  "slug": "new-category",
  "description": "分类描述",
  "parentId": "",
  "sortOrder": 1
}
```

### 3. 更新分类

**PUT** `/categories/:id`

### 4. 删除分类

**DELETE** `/categories/:id`

---

## 标签接口

### 1. 获取标签列表

**GET** `/tags`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "1",
      "name": "Vue",
      "slug": "vue",
      "color": "#42b883",
      "articleCount": 28,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": 1704067200000
}
```

### 2. 创建标签

**POST** `/tags`

**请求体**:
```json
{
  "name": "新标签",
  "slug": "new-tag",
  "color": "#667eea"
}
```

### 3. 更新标签

**PUT** `/tags/:id`

### 4. 删除标签

**DELETE** `/tags/:id`

---

## 访问量统计接口

### 访问量数据定义与统计标准

#### 数据定义

| 指标名称 | 说明 | 统计规则 |
|----------|------|----------|
| PV (Page View) | 页面浏览量 | 每次页面加载计为1次PV，同一用户多次刷新累加 |
| UV (Unique Visitor) | 独立访客数 | 24小时内同一IP/设备仅计为1个UV |
| 文章阅读量 | 单篇文章被阅读次数 | 文章详情页加载时+1，同一用户24小时内重复访问不累加 |
| 独立IP数 | 独立IP访问数量 | 按IP地址去重统计 |
| 跳出率 | 单页访问比例 | 仅访问一个页面就离开的会话占比 |
| 平均停留时间 | 用户平均停留时长 | 会话总时长 / 会话数 |

#### 统计标准

1. **时间维度**: 按小时、日、周、月、年进行聚合统计
2. **地域维度**: 按国家、省份、城市进行地域统计
3. **来源维度**: 按搜索引擎、直接访问、外链引用等来源统计
4. **设备维度**: 按PC、移动端、平板等设备类型统计

### 数据收集与存储机制

#### 数据收集方式

```typescript
interface VisitLog {
  id: string
  visitorId: string
  sessionId: string
  ip: string
  userAgent: string
  referer: string
  url: string
  path: string
  title: string
  deviceType: 'pc' | 'mobile' | 'tablet'
  browser: string
  os: string
  country: string
  province: string
  city: string
  stayDuration: number
  timestamp: number
  articleId?: string
}
```

#### 收集流程

1. 前端页面加载时发送访问日志请求
2. 后端接收请求，解析IP地理位置
3. 异步写入访问日志表
4. 定时任务聚合统计数据
5. 清理过期明细数据（保留最近90天）

### 1. 记录访问日志

**POST** `/stats/visit`

**请求体**:
```json
{
  "url": "https://example.com/article/123",
  "path": "/article/123",
  "title": "Vue 3 组合式 API 最佳实践",
  "referer": "https://www.google.com",
  "articleId": "123",
  "timestamp": 1704067200000
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sessionId": "sess_xxx",
    "visitorId": "vis_xxx"
  },
  "timestamp": 1704067200000
}
```

### 2. 更新停留时长

**PUT** `/stats/visit/duration`

**请求体**:
```json
{
  "sessionId": "sess_xxx",
  "duration": 120
}
```

### 3. 获取实时访问统计

**GET** `/stats/realtime`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "onlineUsers": 128,
    "todayPV": 2560,
    "todayUV": 856,
    "todayIP": 720,
    "avgStayDuration": 180,
    "bounceRate": 35.5,
    "peakHour": {
      "hour": 14,
      "pv": 320
    },
    "topPages": [
      { "path": "/article/123", "title": "文章标题", "pv": 156 }
    ],
    "topReferrers": [
      { "source": "Google", "count": 520 },
      { "source": "Direct", "count": 380 }
    ],
    "deviceStats": {
      "pc": 45,
      "mobile": 48,
      "tablet": 7
    }
  },
  "timestamp": 1704067200000
}
```

### 4. 获取历史访问趋势

**GET** `/stats/trend`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 是 | 结束日期 (YYYY-MM-DD) |
| granularity | string | 否 | 粒度: hour/day/week/month，默认 day |
| type | string | 否 | 类型: pv/uv/ip/all，默认 all |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "summary": {
      "totalPV": 25600,
      "totalUV": 8560,
      "totalIP": 7200,
      "avgDailyPV": 853,
      "avgDailyUV": 285
    },
    "trend": [
      {
        "date": "2024-01-01",
        "pv": 820,
        "uv": 280,
        "ip": 240,
        "avgDuration": 175,
        "bounceRate": 32.5
      }
    ],
    "comparison": {
      "pvGrowth": 15.2,
      "uvGrowth": 12.8,
      "ipGrowth": 10.5
    }
  },
  "timestamp": 1704067200000
}
```

### 5. 获取地域分布统计

**GET** `/stats/geo`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| level | string | 否 | 级别: country/province/city，默认 province |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "name": "北京市",
      "value": 2560,
      "percentage": 25.6
    },
    {
      "name": "上海市",
      "value": 1890,
      "percentage": 18.9
    }
  ],
  "timestamp": 1704067200000
}
```

### 6. 获取来源分析

**GET** `/stats/source`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "direct": {
      "count": 5200,
      "percentage": 52.0
    },
    "searchEngine": {
      "count": 2800,
      "percentage": 28.0,
      "details": [
        { "name": "Google", "count": 1500 },
        { "name": "百度", "count": 1000 },
        { "name": "Bing", "count": 300 }
      ]
    },
    "external": {
      "count": 1200,
      "percentage": 12.0,
      "details": [
        { "domain": "github.com", "count": 500 },
        { "domain": "juejin.cn", "count": 400 }
      ]
    },
    "social": {
      "count": 800,
      "percentage": 8.0
    }
  },
  "timestamp": 1704067200000
}
```

### 7. 获取文章访问排行

**GET** `/stats/articles/ranking`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期，默认最近7天 |
| endDate | string | 否 | 结束日期 |
| limit | number | 否 | 返回数量，默认 10 |
| sortBy | string | 否 | 排序字段: pv/uv/avgDuration，默认 pv |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "articleId": "123",
      "title": "Vue 3 组合式 API 最佳实践",
      "pv": 2560,
      "uv": 890,
      "avgDuration": 320,
      "bounceRate": 25.5
    }
  ],
  "timestamp": 1704067200000
}
```

### 异常访问量识别与处理

#### 异常类型定义

| 异常类型 | 识别规则 | 处理方式 |
|----------|----------|----------|
| 爬虫访问 | User-Agent包含爬虫标识，请求频率异常 | 标记并过滤，不计入统计 |
| 恶意刷量 | 同一IP短时间内大量请求 | 触发限流，记录黑名单 |
| 异常流量 | 流量突增超过阈值 | 发送告警，人工审核 |
| 无效访问 | 停留时间<3秒且无交互 | 标记为无效，降低权重 |

#### 异常检测接口

**GET** `/stats/anomaly`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "hasAnomaly": true,
    "anomalies": [
      {
        "type": "traffic_spike",
        "level": "warning",
        "message": "当前流量较平均值增长200%",
        "timestamp": 1704067200000,
        "details": {
          "currentPV": 5000,
          "avgPV": 1667,
          "growthRate": 200
        }
      },
      {
        "type": "suspicious_ip",
        "level": "critical",
        "message": "检测到可疑IP: 192.168.1.100",
        "timestamp": 1704067200000,
        "details": {
          "ip": "192.168.1.100",
          "requestCount": 1000,
          "timeWindow": "5min"
        }
      }
    ]
  },
  "timestamp": 1704067200000
}
```

#### 黑名单管理接口

**POST** `/stats/blacklist`

**请求体**:
```json
{
  "ip": "192.168.1.100",
  "reason": "恶意刷量",
  "expireAt": "2024-02-01T00:00:00.000Z"
}
```

**GET** `/stats/blacklist`

**DELETE** `/stats/blacklist/:id`

---

## 统计接口

### 1. 获取仪表盘统计数据

**GET** `/stats/dashboard`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "articleCount": 128,
    "viewCount": 25680,
    "likeCount": 1024,
    "categoryCount": 5,
    "tagCount": 15,
    "recentArticles": [
      {
        "id": "1",
        "title": "最新文章标题",
        "viewCount": 256,
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "categoryStats": [
      {
        "categoryId": "1",
        "categoryName": "前端开发",
        "count": 45
      }
    ],
    "viewTrend": {
      "period": "week",
      "data": [
        { "label": "周一", "value": 120 },
        { "label": "周二", "value": 180 }
      ]
    }
  },
  "timestamp": 1704067200000
}
```

---

## 系统设置接口

### 1. 获取系统设置

**GET** `/settings`

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "siteName": "个人博客",
    "siteDescription": "一个专注于技术分享的个人博客",
    "siteKeywords": "Vue, TypeScript, 前端开发",
    "siteLogo": "https://example.com/logo.png",
    "siteFavicon": "https://example.com/favicon.ico",
    "footerText": "© 2024 个人博客",
    "icp": "",
    "socialLinks": {
      "github": "https://github.com",
      "email": "admin@example.com"
    }
  },
  "timestamp": 1704067200000
}
```

### 2. 更新系统设置

**PUT** `/settings`

---

## 数据库表设计参考

### users 用户表
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  email VARCHAR(100),
  avatar VARCHAR(500),
  role ENUM('admin', 'editor', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### articles 文章表
```sql
CREATE TABLE articles (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  summary TEXT,
  content LONGTEXT,
  html_content LONGTEXT,
  cover VARCHAR(500),
  category_id VARCHAR(36),
  author_id VARCHAR(36),
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_top BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);
```

### categories 分类表
```sql
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  description TEXT,
  parent_id VARCHAR(36),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

### tags 标签表
```sql
CREATE TABLE tags (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### article_tags 文章标签关联表
```sql
CREATE TABLE article_tags (
  article_id VARCHAR(36),
  tag_id VARCHAR(36),
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### settings 系统设置表
```sql
CREATE TABLE settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### visit_logs 访问日志表
```sql
CREATE TABLE visit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL COMMENT '访客ID',
  session_id VARCHAR(64) NOT NULL COMMENT '会话ID',
  ip VARCHAR(45) NOT NULL COMMENT 'IP地址',
  user_agent VARCHAR(500) COMMENT '用户代理',
  referer VARCHAR(500) COMMENT '来源页面',
  url VARCHAR(500) NOT NULL COMMENT '访问URL',
  path VARCHAR(200) NOT NULL COMMENT '访问路径',
  title VARCHAR(200) COMMENT '页面标题',
  device_type ENUM('pc', 'mobile', 'tablet') DEFAULT 'pc' COMMENT '设备类型',
  browser VARCHAR(50) COMMENT '浏览器',
  os VARCHAR(50) COMMENT '操作系统',
  country VARCHAR(50) COMMENT '国家',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  stay_duration INT DEFAULT 0 COMMENT '停留时长(秒)',
  article_id VARCHAR(36) COMMENT '文章ID',
  is_valid BOOLEAN DEFAULT TRUE COMMENT '是否有效访问',
  is_bot BOOLEAN DEFAULT FALSE COMMENT '是否爬虫',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visitor (visitor_id),
  INDEX idx_session (session_id),
  INDEX idx_ip (ip),
  INDEX idx_created_at (created_at),
  INDEX idx_article (article_id),
  INDEX idx_path (path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访问日志表';
```

### visit_stats_daily 每日访问统计表
```sql
CREATE TABLE visit_stats_daily (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL COMMENT '统计日期',
  pv INT DEFAULT 0 COMMENT '页面浏览量',
  uv INT DEFAULT 0 COMMENT '独立访客数',
  ip_count INT DEFAULT 0 COMMENT '独立IP数',
  avg_duration INT DEFAULT 0 COMMENT '平均停留时长(秒)',
  bounce_rate DECIMAL(5,2) DEFAULT 0 COMMENT '跳出率(%)',
  new_visitors INT DEFAULT 0 COMMENT '新访客数',
  returning_visitors INT DEFAULT 0 COMMENT '回访访客数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日访问统计表';
```

### visit_stats_hourly 每小时访问统计表
```sql
CREATE TABLE visit_stats_hourly (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL COMMENT '统计日期',
  stat_hour TINYINT NOT NULL COMMENT '统计小时(0-23)',
  pv INT DEFAULT 0 COMMENT '页面浏览量',
  uv INT DEFAULT 0 COMMENT '独立访客数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_date_hour (stat_date, stat_hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每小时访问统计表';
```

### visit_stats_geo 地域统计表
```sql
CREATE TABLE visit_stats_geo (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL COMMENT '统计日期',
  level ENUM('country', 'province', 'city') NOT NULL COMMENT '级别',
  name VARCHAR(50) NOT NULL COMMENT '名称',
  count INT DEFAULT 0 COMMENT '访问次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_date_level_name (stat_date, level, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地域统计表';
```

### visit_stats_source 来源统计表
```sql
CREATE TABLE visit_stats_source (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL COMMENT '统计日期',
  source_type ENUM('direct', 'search', 'external', 'social') NOT NULL COMMENT '来源类型',
  source_name VARCHAR(100) COMMENT '来源名称',
  count INT DEFAULT 0 COMMENT '访问次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_date_type_name (stat_date, source_type, source_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='来源统计表';
```

### visit_blacklist 访问黑名单表
```sql
CREATE TABLE visit_blacklist (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL COMMENT 'IP地址',
  reason VARCHAR(200) COMMENT '加入原因',
  expire_at TIMESTAMP NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访问黑名单表';
```

---

## 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 未授权 |
| 1003 | 禁止访问 |
| 1004 | 资源不存在 |
| 2001 | 用户名或密码错误 |
| 2002 | 用户已存在 |
| 2003 | Token 已过期 |
| 3001 | 文章不存在 |
| 3002 | 分类不存在 |
| 3003 | 标签不存在 |
| 4001 | 访问频率超限 |
| 4002 | IP已被加入黑名单 |
| 5000 | 服务器内部错误 |

---

## 性能优化建议

### 访问量统计优化

1. **异步写入**: 访问日志使用消息队列异步写入，避免阻塞主请求
2. **批量插入**: 日志数据批量插入数据库，减少IO操作
3. **定时聚合**: 使用定时任务（如每小时）聚合统计数据，避免实时计算
4. **数据分区**: 访问日志表按月分区，便于管理和查询
5. **冷热分离**: 
   - 热数据（最近7天）：存储在Redis
   - 温数据（最近90天）：存储在MySQL
   - 冷数据（90天以上）：归档到对象存储

### 缓存策略

| 数据类型 | 缓存时长 | 缓存位置 |
|----------|----------|----------|
| 实时在线人数 | 1分钟 | Redis |
| 今日PV/UV | 5分钟 | Redis |
| 历史趋势数据 | 1小时 | Redis |
| 地域分布数据 | 1小时 | Redis |
| 文章排行榜 | 30分钟 | Redis |

### 索引建议

```sql
-- 访问日志表关键索引
CREATE INDEX idx_visit_logs_created_at ON visit_logs(created_at);
CREATE INDEX idx_visit_logs_article_created ON visit_logs(article_id, created_at);
CREATE INDEX idx_visit_logs_ip_created ON visit_logs(ip, created_at);

-- 统计表复合索引
CREATE INDEX idx_stats_daily_date ON visit_stats_daily(stat_date);
CREATE INDEX idx_stats_hourly_date_hour ON visit_stats_hourly(stat_date, stat_hour);
```

### 监控告警

建议配置以下监控指标：

| 指标 | 阈值 | 告警级别 |
|------|------|----------|
| 实时QPS | > 1000/s | Warning |
| 实时QPS | > 5000/s | Critical |
| 流量突增 | > 200% | Warning |
| 异常IP请求 | > 100/min | Critical |
| 数据库延迟 | > 100ms | Warning |
| 缓存命中率 | < 80% | Warning |

---

## 开发建议

1. **分页查询**: 所有列表接口应支持分页，避免一次性返回过多数据
2. **缓存策略**: 建议对分类、标签等不常变动的数据进行缓存
3. **搜索优化**: 文章搜索建议使用 Elasticsearch 等搜索引擎
4. **图片存储**: 建议使用 OSS 等对象存储服务
5. **日志记录**: 记录关键操作日志，便于问题排查
6. **数据验证**: 后端必须对所有输入数据进行验证
7. **XSS防护**: 存储富文本内容时需进行 XSS 过滤
8. **访问统计**: 使用独立的统计服务，避免影响主业务性能
9. **数据隐私**: 访问日志需脱敏处理，遵守数据保护法规

---

## 联系方式

如有疑问，请联系前端开发团队。
