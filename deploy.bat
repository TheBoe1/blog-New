@echo off
REM 阿里云 OSS 部署脚本 (Windows)
REM 使用前请设置环境变量或创建 .env.oss 文件

echo === 阿里云 OSS 部署脚本 ===
echo.

REM 检查是否设置了环境变量
if "%OSS_ACCESS_KEY_ID%"=="" (
    echo 警告: 未检测到 OSS_ACCESS_KEY_ID 环境变量
    echo.
    echo 请选择配置方式:
    echo 1. 临时设置环境变量 (当前会话有效)
    echo 2. 创建 .env.oss 文件 (推荐)
    echo.
    set /p choice="请输入选择 (1 或 2): "

    if "%choice%"=="1" (
        set /p OSS_ACCESS_KEY_ID="请输入 Access Key ID: "
        set /p OSS_ACCESS_KEY_SECRET="请输入 Access Key Secret: "
    ) else if "%choice%"=="2" (
        if not exist ".env.oss" (
            echo 错误: 未找到 .env.oss 文件
            echo 请复制 .env.oss.example 为 .env.oss 并填入你的秘钥
            pause
            exit /b 1
        )
        REM 从 .env.oss 文件加载环境变量
        for /f "tokens=1,* delims==" %%a in (.env.oss) do (
            set "%%a=%%b"
        )
    ) else (
        echo 无效的选择
        pause
        exit /b 1
    )
)

REM 运行部署
echo.
echo 开始部署到 OSS...
python deploy_oss.py

if %errorlevel% equ 0 (
    echo.
    echo === 部署完成 ===
) else (
    echo.
    echo === 部署失败 ===
)

pause
