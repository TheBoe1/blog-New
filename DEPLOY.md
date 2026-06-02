# 阿里云 OSS 部署指南

## 安全说明

✅ **已完成的安全改进：**
- 秘钥不再硬编码在代码中
- 使用环境变量存储敏感信息
- 所有秘钥文件已在 `.gitignore` 中排除

## 快速开始

### 方式 1: 使用环境变量 (推荐)

**Windows:**
```cmd
set OSS_ACCESS_KEY_ID=your_key_id
set OSS_ACCESS_KEY_SECRET=your_key_secret
python deploy_oss.py
```

**Linux/Mac:**
```bash
export OSS_ACCESS_KEY_ID=your_key_id
export OSS_ACCESS_KEY_SECRET=your_key_secret
python3 deploy_oss.py
```

### 方式 2: 使用 .env.oss 文件

1. 复制示例文件：
   ```bash
   cp .env.oss.example .env.oss
   ```

2. 编辑 `.env.oss` 文件，填入你的真实秘钥：
   ```
   OSS_ACCESS_KEY_ID=your_key_id
   OSS_ACCESS_KEY_SECRET=your_key_secret
   ```

3. 运行部署脚本：
   - **Windows:** 双击 `deploy.bat` 或运行 `deploy.bat`
   - **Linux/Mac:** `chmod +x deploy.sh && ./deploy.sh`

## 配置选项

### 必需环境变量

| 变量名 | 说明 |
|--------|------|
| `OSS_ACCESS_KEY_ID` | 阿里云 Access Key ID |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 Access Key Secret |

### 可选环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `OSS_ENDPOINT` | `oss-cn-beijing.aliyuncs.com` | OSS 端点 |
| `OSS_BUCKET_NAME` | `theboe` | Bucket 名称 |

## 部署流程

部署脚本会自动执行以下操作：

1. ✅ 清理 OSS 上的旧文件
2. ✅ 上传本地 `dist` 目录中的所有文件
3. ✅ 设置强缓存 (`Cache-Control: max-age=31536000, immutable`)

## 安全建议

1. **定期轮换秘钥** - 建议每 3-6 个月更换一次阿里云 Access Key
2. **不要分享 .env.oss 文件** - 该文件包含你的秘钥，已在 `.gitignore` 中排除
3. **使用 RAM 子账号** - 为部署创建专门的 RAM 子账号，只授予 OSS 访问权限

## 故障排除

### 错误: 未设置环境变量

```
错误: 请设置以下环境变量:
  - OSS_ACCESS_KEY_ID: 阿里云 Access Key ID
  - OSS_ACCESS_KEY_SECRET: 阿里云 Access Key Secret
```

**解决方案:** 按照上述方式设置环境变量或创建 `.env.oss` 文件。

### 错误: 找不到 dist 目录

```
错误: 找不到本地目录 ./dist，请先执行 npm run build
```

**解决方案:** 先运行 `npm run build` 构建项目。

## 文件说明

| 文件 | 说明 | 是否提交到仓库 |
|------|------|----------------|
| `deploy_oss.py` | 部署脚本主文件 | ❌ 否 (在 .gitignore 中) |
| `deploy.bat` | Windows 部署脚本 | ✅ 是 |
| `deploy.sh` | Linux/Mac 部署脚本 | ✅ 是 |
| `.env.oss.example` | 环境变量示例 | ✅ 是 |
| `.env.oss` | 你的真实秘钥 | ❌ 否 (在 .gitignore 中) |
