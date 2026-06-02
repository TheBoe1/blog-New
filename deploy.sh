#!/bin/bash
# 阿里云 OSS 部署脚本 (Linux/Mac)
# 使用前请设置环境变量或创建 .env.oss 文件

echo "=== 阿里云 OSS 部署脚本 ==="
echo

# 检查是否设置了环境变量
if [ -z "$OSS_ACCESS_KEY_ID" ]; then
    echo "警告: 未检测到 OSS_ACCESS_KEY_ID 环境变量"
    echo
    echo "请选择配置方式:"
    echo "1. 临时设置环境变量 (当前会话有效)"
    echo "2. 创建 .env.oss 文件 (推荐)"
    echo
    read -p "请输入选择 (1 或 2): " choice

    if [ "$choice" = "1" ]; then
        read -p "请输入 Access Key ID: " OSS_ACCESS_KEY_ID
        read -p "请输入 Access Key Secret: " OSS_ACCESS_KEY_SECRET
        export OSS_ACCESS_KEY_ID
        export OSS_ACCESS_KEY_SECRET
    elif [ "$choice" = "2" ]; then
        if [ ! -f ".env.oss" ]; then
            echo "错误: 未找到 .env.oss 文件"
            echo "请复制 .env.oss.example 为 .env.oss 并填入你的秘钥"
            exit 1
        fi
        # 从 .env.oss 文件加载环境变量
        export $(cat .env.oss | grep -v '^#' | xargs)
    else
        echo "无效的选择"
        exit 1
    fi
fi

# 运行部署
echo
echo "开始部署到 OSS..."
python3 deploy_oss.py

if [ $? -eq 0 ]; then
    echo
    echo "=== 部署完成 ==="
else
    echo
    echo "=== 部署失败 ==="
    exit 1
fi
