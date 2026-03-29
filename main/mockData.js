const slugify = (input) => {
    const str = String(input ?? '').trim().toLowerCase();
    return str
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-')
        .slice(0, 60);
};

const BIG_CATEGORIES = [
    { key: 'frontend', name: '前端技术' },
    { key: 'backend', name: '后端架构' },
    { key: 'algorithm', name: '算法研究' },
    { key: 'practice', name: '工程实践' },
    { key: 'deploy', name: '系统部署' }
];

const BIG_CATEGORY_BY_NAME = BIG_CATEGORIES.reduce((acc, cur) => {
    acc[cur.name] = cur.key;
    return acc;
}, {});

const normalizeBigCategory = (bigCategory) => {
    if (!bigCategory) return { key: 'practice', name: '工程实践' };
    const direct = BIG_CATEGORIES.find(x => x.key === bigCategory);
    if (direct) return direct;
    const key = BIG_CATEGORY_BY_NAME[bigCategory];
    if (key) return { key, name: bigCategory };
    return { key: 'practice', name: '工程实践' };
};

const CATEGORY_TO_TAXONOMY = {
    Cache: { bigKey: 'backend', bigName: '后端架构', techKey: 'redis', techName: 'Redis', themeKey: 'distributed-lock', themeName: '分布式锁' },
    Middleware: { bigKey: 'backend', bigName: '后端架构', techKey: 'java', techName: 'Java', themeKey: 'mq', themeName: '消息队列' },
    Database: { bigKey: 'backend', bigName: '后端架构', techKey: 'mysql', techName: 'MySQL', themeKey: 'index', themeName: '索引与结构' },
    Java: { bigKey: 'backend', bigName: '后端架构', techKey: 'java', techName: 'Java', themeKey: 'concurrency', themeName: '并发编程' },
    Vue: { bigKey: 'frontend', bigName: '前端技术', techKey: 'vue', techName: 'Vue', themeKey: 'vue3', themeName: 'Vue3' },
    React: { bigKey: 'frontend', bigName: '前端技术', techKey: 'react', techName: 'React', themeKey: 'hooks', themeName: 'Hooks' },
    Angular: { bigKey: 'frontend', bigName: '前端技术', techKey: 'angular', techName: 'Angular', themeKey: 'di', themeName: '依赖注入' },
    Python: { bigKey: 'backend', bigName: '后端架构', techKey: 'python', techName: 'Python', themeKey: 'web', themeName: 'Web框架' },
    Golang: { bigKey: 'backend', bigName: '后端架构', techKey: 'golang', techName: 'Golang', themeKey: 'web', themeName: 'Web框架' },
    Algorithm: { bigKey: 'algorithm', bigName: '算法研究', techKey: 'algo', techName: '算法', themeKey: 'base', themeName: '基础' },
    DevOps: { bigKey: 'practice', bigName: '工程实践', techKey: 'devops', techName: 'DevOps', themeKey: 'infra', themeName: '基础设施' }
};

CATEGORY_TO_TAXONOMY.Git = { bigKey: 'practice', bigName: '工程实践', techKey: 'git', techName: 'Git', themeKey: 'repo-clone', themeName: '仓库与克隆' };
CATEGORY_TO_TAXONOMY.GitInstall = { bigKey: 'practice', bigName: '工程实践', techKey: 'git', techName: 'Git', themeKey: 'install', themeName: '安装' };
CATEGORY_TO_TAXONOMY.GitLocal = { bigKey: 'practice', bigName: '工程实践', techKey: 'git', techName: 'Git', themeKey: 'local-repo', themeName: '本地仓库' };
CATEGORY_TO_TAXONOMY.GitRemote = { bigKey: 'practice', bigName: '工程实践', techKey: 'git', techName: 'Git', themeKey: 'remote-repo', themeName: '远程仓库' };

CATEGORY_TO_TAXONOMY.DeployFrontend = { bigKey: 'deploy', bigName: '系统部署', techKey: 'frontend', techName: '前端部署', themeKey: 'vite', themeName: 'Vite 构建' };
CATEGORY_TO_TAXONOMY.DeployBackend = { bigKey: 'deploy', bigName: '系统部署', techKey: 'backend', techName: '后端联动', themeKey: 'nginx', themeName: 'Nginx 配置' };

CATEGORY_TO_TAXONOMY.ServerPrepare = { bigKey: 'deploy', bigName: '系统部署', techKey: 'server', techName: '服务器准备', themeKey: 'choose', themeName: '云服务器选择' };
CATEGORY_TO_TAXONOMY.ServerConnect = { bigKey: 'deploy', bigName: '系统部署', techKey: 'server', techName: '服务器准备', themeKey: 'connect', themeName: 'SSH 远程连接' };
CATEGORY_TO_TAXONOMY.ServerInit = { bigKey: 'deploy', bigName: '系统部署', techKey: 'server', techName: '服务器准备', themeKey: 'init', themeName: '服务器初始化' };
CATEGORY_TO_TAXONOMY.NginxInstall = { bigKey: 'deploy', bigName: '系统部署', techKey: 'nginx', techName: 'Nginx', themeKey: 'install', themeName: 'Nginx 安装' };
CATEGORY_TO_TAXONOMY.NginxConfig = { bigKey: 'deploy', bigName: '系统部署', techKey: 'nginx', techName: 'Nginx', themeKey: 'config', themeName: 'Nginx 配置' };
CATEGORY_TO_TAXONOMY.DomainDNS = { bigKey: 'deploy', bigName: '系统部署', techKey: 'domain', techName: '域名配置', themeKey: 'dns', themeName: '域名与 DNS' };
CATEGORY_TO_TAXONOMY.SSLHTTPS = { bigKey: 'deploy', bigName: '系统部署', techKey: 'domain', techName: '域名配置', themeKey: 'ssl', themeName: 'SSL 与 HTTPS' };
CATEGORY_TO_TAXONOMY.AutoDeploy = { bigKey: 'deploy', bigName: '系统部署', techKey: 'auto', techName: '自动化部署', themeKey: 'webhook', themeName: 'Webhook 自动部署' };

const buildLearningRoute = ({ bigKey, techKey, themeKey, slug }) => `/learning/${bigKey}/${techKey}/${themeKey}/${slug}`;
const buildArticleRoute = ({ bigKey, techKey, themeKey, slug }) => `/article/${bigKey}/${techKey}/${themeKey}/${slug}`;
const buildThemeRoute = ({ bigKey, techKey, themeKey }) => `/learning/${bigKey}/${techKey}/${themeKey}`;

const learningArticles = [
    {
        id: 1,
        topic: 'Redis 分布式锁 (SETNX) 实践与优化',
        content: `核心结论
分布式锁要解决两件事：互斥 + 释放可靠。Redis 常用方案是 SET key value NX PX ttl，避免 SETNX 与 EXPIRE 两条命令的非原子问题。

1. 最小可用写法（推荐）
SET lock:order:123 <token> NX PX 30000

要点：
- value 必须是唯一 token（UUID），用于安全释放
- 必须设置过期时间，避免死锁

2. 释放锁（必须校验 token）
释放不能直接 DEL，否则会误删他人的锁（超时后被别人拿到锁）。
正确方式：Lua 脚本校验 value 相等再删除。

3. 续期（可选）
业务执行时间不可控时需要续期（心跳/看门狗）。否则锁过期会导致并发进入临界区。

4. 常见坑
- 只用 SETNX 不设置 TTL：死锁
- 释放锁不校验 token：误删锁
- TTL 太短且无续期：并发问题

5. 落地建议
- 锁粒度：按资源 ID（如订单号/用户 ID）
- 监控：锁等待时间、超时次数、续期次数
- 失败策略：拿不到锁要么重试（退避），要么快速失败`,
        tags: ['Redis', '分布式锁'],
        category: 'Cache',
        date: '2026-03-10'
    },
    {
        id: 2,
        topic: 'RocketMQ 分布式事务消息原理剖析',
        content: `核心结论
事务消息用于保证 “本地事务 + 消息发送” 的最终一致：先把半消息写入 Broker，再执行本地事务，最后提交/回滚消息；如果生产者状态异常，Broker 会回查。

1. 关键角色
- Producer：发送事务消息并执行本地事务
- Broker：存储半消息/执行回查
- Consumer：只消费提交后的消息

2. 发送流程（简化）
1）发送 Half Message（对消费者不可见）
2）执行本地事务（落库/状态变更）
3）根据事务结果：COMMIT 让消息可见 / ROLLBACK 丢弃

3. 回查机制（解决生产者宕机/超时）
当 Broker 长时间收不到 COMMIT/ROLLBACK，会触发 Transaction Check：
- Broker 主动回调生产者的回查接口
- 生产者根据本地事务状态返回最终提交或回滚

4. 失败场景
- 本地事务成功但 COMMIT 丢了：靠回查补偿提交
- 本地事务失败但消息已发出：ROLLBACK 或回查回滚

5. 落地建议
- 本地事务必须可查询（事务表/状态表）
- 回查逻辑必须幂等
- 生产者/消费者都要做幂等（以业务主键去重）
- 监控：回查次数、悬挂半消息数量、提交延迟`,
        tags: ['Java', 'RocketMQ', '事务'],
        category: 'Middleware',
        date: '2026-03-08'
    },
    {
        id: 3,
        topic: 'MySQL 聚簇索引与 B+ 树底层结构',
        content: `核心结论
InnoDB 的主键索引是聚簇索引：叶子节点存整行数据。二级索引叶子节点存 “二级索引键 + 主键值”，回表通过主键再查一次聚簇索引。

1. B+Tree 为什么适合索引
- 叶子节点按序并有链表，范围查询快
- 非叶子节点只存键值和指针，扇出大，树高低

2. 聚簇索引（Primary Key）
- 叶子节点：整行记录
- 主键选择会影响数据物理组织与写入成本

3. 二级索引（Secondary Index）
- 叶子节点：二级键 + 主键
- 查询如果需要的列不在二级索引里就会回表

4. 覆盖索引
查询字段都在索引中，避免回表：
SELECT id, name FROM t WHERE idx_col = ?

5. 主键建议
- 尽量用自增/趋势递增，减少页分裂
- 避免随机 UUID 作为主键（写放大、碎片化）

6. 你真正要记住的
二级索引查询 = “先查二级索引拿主键” + “用主键回表”`,
        tags: ['MySQL', '索引'],
        category: 'Database',
        date: '2026-03-05'
    },
    {
        id: 4,
        topic: 'ConcurrentHashMap 并发安全机制',
        content: `核心结论
ConcurrentHashMap 通过更细粒度的同步手段实现高并发读写：读尽量无锁，写只锁局部桶/节点，配合 CAS 降低竞争。

1. 线程安全目标
- 并发读不阻塞
- 并发写冲突尽量局部化
- 迭代弱一致（允许并发修改）

2. put 的大概思路（抽象）
- 通过哈希定位桶位
- 桶为空：CAS 放入
- 桶非空：对桶头节点加锁，在链表/红黑树中插入或更新

3. 扩容（核心难点）
- 触发阈值后会扩容
- 扩容过程中允许读写，多个线程协作迁移桶（分段搬迁）

4. 为什么比 Hashtable 快
- Hashtable 全表锁，竞争大
- ConcurrentHashMap 锁粒度更小，CAS + 局部锁，吞吐更高

5. 使用建议
- key 设计要稳定且 hash 分布均匀
- 值如果是可变对象，仍需自己保证对象内部线程安全
- 迭代结果不保证实时一致是正常现象`,
        tags: ['Java', '并发'],
        category: 'Java',
        date: '2026-03-01'
    },
    {
        id: 5,
        topic: 'Linux 安装 Git（apt/yum）',
        content: `在 Linux 系统中，Git 通常可以通过包管理器快速安装。

Ubuntu / Debian 系列：

sudo apt update
sudo apt install git

CentOS / RHEL 系列：

sudo yum install git

安装完成后确认：

git --version`,
        tags: ['Git', 'Linux', '安装'],
        category: 'GitInstall',
        date: '2026-03-12'
    },
    {
        id: 6,
        topic: '创建/初始化本地仓库：git init',
        content: `目标：让目录变成一个可被 Git 管理的仓库。

命令：
git init

效果：
目录下生成 .git 文件夹，开始记录版本历史。`,
        tags: ['Git', '本地仓库', 'git init'],
        category: 'GitLocal',
        date: '2026-03-12'
    },
    {
        id: 7,
        topic: '添加文件到暂存区：git add',
        content: `目标：告诉 Git 哪些文件需要记录在下一次提交。

命令：
git add <文件名>
git add .

示例：
echo "# 我的项目" > README.md
git add README.md`,
        tags: ['Git', '暂存区', 'git add'],
        category: 'GitLocal',
        date: '2026-03-12'
    },
    {
        id: 8,
        topic: '提交到本地仓库：git commit',
        content: `目标：将暂存区的内容生成版本记录。

命令：
git commit -m "初始化项目结构，添加 README"

说明：
每次提交都是一次快照，可以回退和对比；提交信息要简明描述修改内容。`,
        tags: ['Git', '提交', 'git commit'],
        category: 'GitLocal',
        date: '2026-03-12'
    },
    {
        id: 9,
        topic: '查看提交历史：git log',
        content: `命令：
git log

作用：
查看本地仓库的每次提交历史。`,
        tags: ['Git', '历史', 'git log'],
        category: 'GitLocal',
        date: '2026-03-12'
    },
    {
        id: 10,
        topic: '关联远程仓库：git remote add',
        content: `目标：把本地仓库和远程仓库建立连接。

命令：
git remote add origin <仓库地址>
git remote -v`,
        tags: ['Git', '远程仓库', 'git remote'],
        category: 'GitRemote',
        date: '2026-03-12'
    },
    {
        id: 11,
        topic: '推送到远程仓库：git push',
        content: `目标：把本地修改同步到远程，让团队成员可见。

命令：
git push -u origin main

说明：
-u 会让本地分支与远程分支建立关联，下次可直接 git push。`,
        tags: ['Git', '推送', 'git push'],
        category: 'GitRemote',
        date: '2026-03-12'
    },
    {
        id: 12,
        topic: '前端部署（Vite 构建）',
        content: `核心步骤
1. 构建项目
npm run build

2. 部署目录
构建后的 dist 目录内容需要部署到根路径 / 下

3. 路由配置
当前路由基座为 /，确保服务器配置正确`,
        tags: ['部署', '前端', 'Vite'],
        category: 'DeployFrontend',
        date: '2026-03-15'
    },
    {
        id: 13,
        topic: '后端联动配置（Nginx）',
        content: `接口转发
通过 Nginx 将 /prod-api 转发到后端服务：

location /prod-api/ {
    proxy_pass http://localhost:8080/;
}

注意事项
- 确保后端服务已启动
- 配置 CORS 允许跨域访问
- 同域部署可避免跨域问题`,
        tags: ['部署', '后端', 'Nginx'],
        category: 'DeployBackend',
        date: '2026-03-15'
    },
    {
        id: 14,
        topic: '从零搭建自己的服务器',
        content: `# 从零搭建自己的服务器

本教程将带你完整走完从购买服务器到自动部署的全过程。

---

## 第一步：选择合适的云服务器

### 厂商选择
- **阿里云**：国内生态完善，文档齐全
- **腾讯云**：性价比高，活动力度大
- **华为云**：企业级服务，稳定可靠
- **国外**：AWS、Vultr、DigitalOcean（需要科学上网）

### 配置选择（新手推荐）
- CPU：1核 或 2核
- 内存：1GB 或 2GB
- 带宽：1Mbps - 3Mbps
- 系统盘：40GB SSD

### 操作系统选择
- 推荐：Ubuntu 20.04/22.04 LTS（长期支持版）
- 备选：CentOS 7/8（国内使用较多）

### 区域选择
- 国内用户：选离自己最近的区域（如华东、华南）
- 网站访客：选目标用户集中的区域

### 购买建议
- 新用户通常有首购优惠（年付更划算）
- 先买最低配试水，后期可升级配置
- 记得设置自动续费或续费提醒

---

## 第二步：通过 SSH 远程连接服务器

### 连接准备
拿到服务器后，你需要：
- 服务器公网 IP
- root 密码（或 SSH Key）
- 本地终端软件

### Windows 用户
**方案1：使用 PowerShell 或 CMD**
\`\`\`bash
ssh root@你的服务器IP
\`\`\`

**方案2：使用 PuTTY（图形化工具）**
- 下载 PuTTY
- 输入 IP 和端口（默认22）
- 点击连接，输入密码

**方案3：VS Code Remote SSH（推荐开发用）**
- 安装 Remote - SSH 扩展
- 配置 SSH 配置文件
- 直接在 VS Code 中操作服务器

### Mac / Linux 用户
直接使用终端：
\`\`\`bash
ssh root@你的服务器IP
\`\`\`

第一次连接会提示：
\`Are you sure you want to continue connecting (yes/no)?\`
输入 yes 回车，然后输入密码（输入时不显示）

连接成功后会看到类似：
\`root@your-server:~#\`

### 常用 SSH 技巧
1. 配置免密登录（使用 SSH Key）
2. 修改默认端口（提高安全性）
3. 使用 tmux/screen 保持会话

### 如果连接失败
- 检查安全组是否开放22端口
- 确认 IP 和密码正确
- 尝试重启服务器

---

## 第三步：服务器初始化配置

刚拿到服务器，先做这些安全配置！

### 1. 修改 root 密码
\`\`\`bash
passwd
\`\`\`
输入两次新密码（复杂一点）

### 2. 创建普通用户（不建议一直用 root）
\`\`\`bash
adduser deploy
usermod -aG sudo deploy
\`\`\`

### 3. 更新系统软件包
**Ubuntu/Debian:**
\`\`\`bash
apt update && apt upgrade -y
\`\`\`

**CentOS:**
\`\`\`bash
yum update -y
\`\`\`

### 4. 配置防火墙（ufw）
\`\`\`bash
apt install ufw -y
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
\`\`\`

### 5. 安装常用工具
\`\`\`bash
apt install -y vim git curl wget net-tools htop
\`\`\`

### 6. 设置时区
\`\`\`bash
timedatectl set-timezone Asia/Shanghai
\`\`\`

### 7. 配置 SSH 安全（可选）
编辑 \`/etc/ssh/sshd_config\`：
- 禁止 root 直接登录：\`PermitRootLogin no\`
- 修改默认端口：\`Port 2222\`

然后重启 sshd：
\`\`\`bash
systemctl restart sshd
\`\`\`

### 8. 安装 Fail2Ban（防暴力破解）
\`\`\`bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
\`\`\`

初始化完成后，用新用户重新登录测试！

---

## 第四步：安装 Nginx Web 服务器

Nginx 是最流行的 Web 服务器之一，用来托管网站。

### Ubuntu/Debian 安装
\`\`\`bash
apt update
apt install nginx -y
\`\`\`

### CentOS 安装
\`\`\`bash
yum install nginx -y
\`\`\`

### 验证安装
\`\`\`bash
nginx -v
\`\`\`
显示版本号即安装成功

### 启动 Nginx
\`\`\`bash
systemctl start nginx
systemctl enable nginx  # 设置开机自启
\`\`\`

### 检查状态
\`\`\`bash
systemctl status nginx
\`\`\`

此时在浏览器访问你的服务器 IP，应该能看到 Nginx 欢迎页！

### 常用命令
- 启动：\`systemctl start nginx\`
- 停止：\`systemctl stop nginx\`
- 重启：\`systemctl restart nginx\`
- 重新加载配置：\`systemctl reload nginx\`（平滑重启）
- 测试配置：\`nginx -t\`

### 配置文件位置
- 主配置：\`/etc/nginx/nginx.conf\`
- 站点配置：\`/etc/nginx/sites-available/\`
- 启用站点：\`/etc/nginx/sites-enabled/\`
- 默认网页：\`/var/www/html/\`

### 防火墙配置
确保 80 和 443 端口已开放：
\`\`\`bash
ufw allow 'Nginx Full'
\`\`\`

---

## 第五步：配置 Nginx 托管静态网站

现在我们来把网站部署到 Nginx 上。

### 1. 创建网站目录
\`\`\`bash
mkdir -p /var/www/myblog
chown -R $USER:$USER /var/www/myblog
\`\`\`

### 2. 上传网站文件
**方式1：使用 scp 本地上传**
\`\`\`bash
scp -r ./dist/* root@你的IP:/var/www/myblog/
\`\`\`

**方式2：服务器上 git clone**
\`\`\`bash
cd /var/www/myblog
git clone 你的仓库地址 .
\`\`\`

**方式3：使用 SFTP 工具（如 FileZilla）**

### 3. 配置 Nginx 站点
\`\`\`bash
cd /etc/nginx/sites-available/
vim myblog
\`\`\`

写入以下配置：
\`\`\`nginx
server {
    listen 80;
    listen [::]:80;

    server_name 你的域名或IP;

    root /var/www/myblog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
\`\`\`

### 4. 启用站点
\`\`\`bash
ln -s /etc/nginx/sites-available/myblog /etc/nginx/sites-enabled/
\`\`\`

### 5. 测试配置
\`\`\`bash
nginx -t
\`\`\`

### 6. 重启 Nginx
\`\`\`bash
systemctl reload nginx
\`\`\`

### 7. 访问网站
在浏览器打开 http://你的IP 或 http://你的域名

### 常见问题
- 403 Forbidden：检查文件权限
- 404 Not Found：检查 root 路径是否正确
- 500 Error：查看 Nginx 错误日志 \`/var/log/nginx/error.log\`

---

## 第六步：购买域名与配置 DNS 解析

有了域名，你的网站才像个样子！

### 1. 购买域名
**推荐平台：**
- 阿里云（万网）
- 腾讯云
- Namecheap（国外）

**选择域名：**
- .com / .cn / .net / .org
- 简短好记，尽量与品牌相关
- .com 最通用，但好的可能被注册了

### 2. 配置 DNS 解析
在域名服务商控制台找到 DNS 管理：

**添加记录：**
| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 你的服务器IP |
| A | www | 你的服务器IP |

**说明：**
- @ 表示直接访问域名（example.com）
- www 表示访问 www.example.com
- TTL 可以设为 600（10分钟）

### 3. 验证解析是否生效
本地终端执行：
\`\`\`bash
ping 你的域名
\`\`\`

或使用在线工具：
- ping.chinaz.com
- dnschecker.org

**注意：**
- DNS 解析生效需要时间，通常几分钟到几小时
- 如果国内访问慢，可能需要备案（.cn 域名必须备案）

### 4. 更新 Nginx 配置
修改 \`server_name\`：
\`\`\`nginx
server_name example.com www.example.com;
\`\`\`

重启 Nginx：
\`\`\`bash
systemctl reload nginx
\`\`\`

现在可以通过域名访问你的网站了！

---

## 第七步：配置 SSL 证书开启 HTTPS

HTTPS 让你的网站更安全，浏览器也会显示小锁！

### 使用 Let's Encrypt 免费证书
我们用 Certbot 工具一键申请和续期。

### 1. 安装 Certbot
**Ubuntu/Debian:**
\`\`\`bash
apt install certbot python3-certbot-nginx -y
\`\`\`

**CentOS:**
\`\`\`bash
yum install certbot python3-certbot-nginx -y
\`\`\`

### 2. 申请证书
\`\`\`bash
certbot --nginx -d 你的域名 -d www.你的域名
\`\`\`

按照提示：
- 输入邮箱（用于续期提醒）
- 同意服务条款
- 是否自动重定向 HTTP 到 HTTPS：选 2（Redirect）

### 3. 验证配置
访问 https://你的域名，应该能看到小锁图标！

查看 Nginx 配置，Certbot 已经自动帮你添加了 SSL 配置。

### 4. 自动续期
Let's Encrypt 证书有效期 90 天，Certbot 会自动续期。

测试续期：
\`\`\`bash
certbot renew --dry-run
\`\`\`

查看定时任务：
\`\`\`bash
systemctl list-timers | grep certbot
\`\`\`

### 5. 常用 Certbot 命令
- 查看证书：\`certbot certificates\`
- 续期证书：\`certbot renew\`
- 撤销证书：\`certbot revoke\`

证书配置完成！你的网站现在是 HTTPS 了。

---

## 第八步：配置 Webhook 实现自动部署

每次手动上传太麻烦？让 Git push 自动触发部署！

### 原理
本地 push → GitHub/GitLab → 服务器 Webhook → 执行部署脚本

### 1. 服务器端准备
创建部署目录：
\`\`\`bash
mkdir -p /srv/deploy
cd /srv/deploy
\`\`\`

克隆仓库：
\`\`\`bash
git clone 你的仓库地址 myblog
\`\`\`

创建部署脚本 \`deploy.sh\`：
\`\`\`bash
#!/bin/bash
cd /srv/deploy/myblog
git pull origin main
npm install
npm run build
cp -r dist/* /var/www/myblog/
echo "部署完成：$(date)" >> /var/log/deploy.log
\`\`\`

给脚本执行权限：
\`\`\`bash
chmod +x deploy.sh
\`\`\`

测试脚本：
\`\`\`bash
./deploy.sh
\`\`\`

### 2. 创建 Webhook 接收服务
用 Node.js 写个简单的服务：
\`\`\`bash
mkdir -p /srv/webhook
cd /srv/webhook
npm init -y
npm install express
\`\`\`

创建 \`index.js\`：
\`\`\`javascript
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('收到 Webhook 请求');
  exec('/srv/deploy/deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).send('部署失败');
    }
    console.log(stdout);
    res.send('部署成功');
  });
});

app.listen(3000, () => console.log('Webhook 服务运行在 3000 端口'));
\`\`\`

### 3. 配置 Nginx 转发 Webhook
在 Nginx 配置中添加：
\`\`\`nginx
location /webhook {
    proxy_pass http://localhost:3000;
    proxy_set_header Content-Type application/json;
}
\`\`\`

### 4. 使用 PM2 管理 Webhook 服务
\`\`\`bash
npm install -g pm2
pm2 start index.js --name webhook
pm2 save
pm2 startup
\`\`\`

### 5. GitHub 配置 Webhook
仓库 → Settings → Webhooks → Add webhook：
- Payload URL: https://你的域名/webhook
- Content type: application/json
- Secret: 设置一个密钥
- Which events: Just the push event
- Active: ✅

测试一下：本地 push 代码，看服务器是否自动部署！

---

## 总结

恭喜你！现在你已经拥有了一个完整的个人网站服务器：
✅ 云服务器已购买并配置
✅ 可以通过 SSH 远程连接
✅ Nginx Web 服务器运行中
✅ 网站可以通过域名访问
✅ HTTPS 加密已开启
✅ 支持 Git push 自动部署

接下来，你可以：
- 发布更多内容到你的网站
- 学习更多服务器运维知识
- 尝试部署后端服务和数据库`,
        tags: ['服务器部署', 'Nginx', 'SSL', 'Webhook', '完整教程'],
        category: 'ServerPrepare',
        date: '2026-03-18'
    },
    {
        id: 15,
        topic: 'Git 完整教程：从安装到协作',
        content: `# Git 完整教程：从安装到协作

本教程将带你完整学习 Git 版本控制系统，从安装到团队协作。

---

## 第一步：Git 安装与配置

### Windows 安装
1. 访问 https://git-scm.com/downloads
2. 下载 Windows 版本并安装
3. 安装时一路使用默认选项即可

### Mac 安装
**方案1：使用 Homebrew**
\`\`\`bash
brew install git
\`\`\`

**方案2：使用 Xcode Command Line Tools**
\`\`\`bash
xcode-select --install
\`\`\`

### Linux 安装
**Ubuntu / Debian 系列：**
\`\`\`bash
sudo apt update
sudo apt install git
\`\`\`

**CentOS / RHEL 系列：**
\`\`\`bash
sudo yum install git
\`\`\`

### 验证安装
\`\`\`bash
git --version
\`\`\`

### 初始配置
设置用户名和邮箱（重要！每次提交都会用到）：
\`\`\`bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
\`\`\`

查看配置：
\`\`\`bash
git config --global --list
\`\`\`

---

## 第二步：创建与初始化本地仓库

### 初始化新仓库
在一个空目录中：
\`\`\`bash
git init
\`\`\`

效果：目录下生成 .git 文件夹，开始记录版本历史。

### 克隆现有仓库
\`\`\`bash
git clone <仓库地址>
\`\`\`

例如：
\`\`\`bash
git clone https://github.com/username/my-project.git
\`\`\`

---

## 第三步：添加文件到暂存区

### 基本用法
添加单个文件：
\`\`\`bash
git add <文件名>
\`\`\`

添加所有文件：
\`\`\`bash
git add .
\`\`\`

添加特定类型文件：
\`\`\`bash
git add *.js
\`\`\`

### 查看状态
\`\`\`bash
git status
\`\`\`

### 示例工作流
\`\`\`bash
# 创建一个新文件
echo "# 我的项目" > README.md

# 添加到暂存区
git add README.md

# 查看状态
git status
\`\`\`

---

## 第四步：提交到本地仓库

### 基本提交
\`\`\`bash
git commit -m "提交说明"
\`\`\`

### 提交信息规范
好的提交信息应该简明描述修改内容：
- ✅ "添加用户登录功能"
- ✅ "修复首页加载缓慢问题"
- ❌ "更新了一些东西"

### 添加并提交（快捷方式）
\`\`\`bash
git add . && git commit -m "提交说明"
\`\`\`

### 修改最后一次提交
\`\`\`bash
git commit --amend
\`\`\`

---

## 第五步：查看提交历史与差异

### 查看提交历史
\`\`\`bash
git log
\`\`\`

### 简洁版历史
\`\`\`bash
git log --oneline
\`\`\`

### 查看特定文件的历史
\`\`\`bash
git log -- <文件名>
\`\`\`

### 查看工作区与暂存区的差异
\`\`\`bash
git diff
\`\`\`

### 查看暂存区与上次提交的差异
\`\`\`bash
git diff --staged
\`\`\`

---

## 第六步：关联远程仓库

### 添加远程仓库
\`\`\`bash
git remote add origin <仓库地址>
\`\`\`

### 查看远程仓库
\`\`\`bash
git remote -v
\`\`\`

### 修改远程仓库地址
\`\`\`bash
git remote set-url origin <新地址>
\`\`\`

---

## 第七步：推送与拉取代码

### 推送到远程
首次推送（建立关联）：
\`\`\`bash
git push -u origin main
\`\`\`

后续推送：
\`\`\`bash
git push
\`\`\`

### 从远程拉取
\`\`\`bash
git pull
\`\`\`

### 只拉取不合并
\`\`\`bash
git fetch
\`\`\`

---

## 第八步：分支管理与合并

### 查看分支
\`\`\`bash
git branch
\`\`\`

### 创建新分支
\`\`\`bash
git branch <分支名>
\`\`\`

### 切换分支
\`\`\`bash
git checkout <分支名>
\`\`\`

或使用新语法：
\`\`\`bash
git switch <分支名>
\`\`\`

### 创建并切换分支
\`\`\`bash
git checkout -b <分支名>
\`\`\`

### 合并分支
先切换到目标分支（通常是 main）：
\`\`\`bash
git checkout main
git merge <分支名>
\`\`\`

### 删除分支
\`\`\`bash
git branch -d <分支名>
\`\`\`

---

## 总结

恭喜你！现在你已经掌握了 Git 的核心用法：
✅ Git 安装与配置
✅ 创建和初始化仓库
✅ 添加和提交文件
✅ 查看历史和差异
✅ 关联远程仓库
✅ 推送和拉取代码
✅ 分支管理与合并

接下来，你可以：
- 学习 Git 进阶操作（变基、贮藏、标签等）
- 参与开源项目的协作
- 使用 Git Flow 等工作流规范团队开发`,
        tags: ['Git', '版本控制', 'GitHub', '完整教程'],
        category: 'Git',
        date: '2026-03-18'
    }
].map((a) => {
    const mapped = CATEGORY_TO_TAXONOMY[a.category] ?? { bigKey: 'practice', bigName: '工程实践', techKey: 'misc', techName: '综合', themeKey: 'general', themeName: '通用' };
    const slug = slugify(a.topic);
    return {
        ...a,
        bigKey: mapped.bigKey,
        bigName: mapped.bigName,
        techKey: mapped.techKey,
        techName: mapped.techName,
        themeKey: mapped.themeKey,
        themeName: mapped.themeName,
        slug,
        route: buildLearningRoute({ bigKey: mapped.bigKey, techKey: mapped.techKey, themeKey: mapped.themeKey, slug }),
        detailRoute: buildArticleRoute({ bigKey: mapped.bigKey, techKey: mapped.techKey, themeKey: mapped.themeKey, slug }),
        themeRoute: buildThemeRoute({ bigKey: mapped.bigKey, techKey: mapped.techKey, themeKey: mapped.themeKey })
    };
});

const buildLearningIndex = (articles) => {
    const tree = {};
    const nodeChildren = new Map();
    const nodeArticles = new Map();
    const themeArticles = new Map();
    const articleByRoute = new Map();
    const articleById = new Map();
    const searchIndex = [];

    const ensureChildren = (path) => {
        if (!nodeChildren.has(path)) nodeChildren.set(path, []);
        return nodeChildren.get(path);
    };

    const addChild = (parentPath, child) => {
        const children = ensureChildren(parentPath);
        if (!children.some(x => x.path === child.path)) children.push(child);
    };

    const rootPath = '/learning';
    ensureChildren(rootPath);
    nodeArticles.set(rootPath, []);

    BIG_CATEGORIES.forEach(b => {
        const bigPath = `/learning/${b.key}`;
        tree[b.key] = { key: b.key, name: b.name, path: bigPath, children: {} };
        addChild(rootPath, { type: 'big', key: b.key, name: b.name, path: bigPath });
        ensureChildren(bigPath);
        if (!nodeArticles.has(bigPath)) nodeArticles.set(bigPath, []);
    });

    articles.forEach((a) => {
        const big = normalizeBigCategory(a.bigKey);
        const bigKey = big.key;
        const bigName = a.bigName || big.name;
        const bigPath = `/learning/${bigKey}`;

        if (!tree[bigKey]) tree[bigKey] = { key: bigKey, name: bigName, path: bigPath, children: {} };
        addChild(rootPath, { type: 'big', key: bigKey, name: bigName, path: bigPath });
        ensureChildren(bigPath);
        if (!nodeArticles.has(bigPath)) nodeArticles.set(bigPath, []);

        const techKey = a.techKey || slugify(a.techName || 'misc') || 'misc';
        const techName = a.techName || techKey;
        const techPath = `/learning/${bigKey}/${techKey}`;

        if (!tree[bigKey].children[techKey]) tree[bigKey].children[techKey] = { key: techKey, name: techName, path: techPath, children: {} };
        addChild(bigPath, { type: 'tech', key: techKey, name: techName, path: techPath });
        ensureChildren(techPath);
        if (!nodeArticles.has(techPath)) nodeArticles.set(techPath, []);

        const themeKey = a.themeKey || slugify(a.themeName || 'general') || 'general';
        const themeName = a.themeName || themeKey;
        const themePath = `/learning/${bigKey}/${techKey}/${themeKey}`;

        if (!tree[bigKey].children[techKey].children[themeKey]) tree[bigKey].children[techKey].children[themeKey] = { key: themeKey, name: themeName, path: themePath, count: 0 };
        addChild(techPath, { type: 'theme', key: themeKey, name: themeName, path: themePath });
        ensureChildren(themePath);
        if (!nodeArticles.has(themePath)) nodeArticles.set(themePath, []);

        const list = themeArticles.get(themePath) ?? [];
        list.push(a);
        themeArticles.set(themePath, list);

        tree[bigKey].children[techKey].children[themeKey].count = list.length;

        nodeArticles.get(rootPath).push(a);
        nodeArticles.get(bigPath).push(a);
        nodeArticles.get(techPath).push(a);
        nodeArticles.get(themePath).push(a);

        articleByRoute.set(a.route, a);
        if (a.detailRoute) articleByRoute.set(a.detailRoute, a);
        articleById.set(a.id, a);

        const searchable = [
            a.topic,
            a.content,
            ...(Array.isArray(a.tags) ? a.tags : []),
            a.bigName,
            a.techName,
            a.themeName
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        searchIndex.push({
            id: a.id,
            route: a.detailRoute || a.route,
            themeRoute: a.themeRoute,
            title: a.topic,
            date: a.date,
            bigKey: a.bigKey,
            bigName: a.bigName,
            techKey: a.techKey,
            techName: a.techName,
            themeKey: a.themeKey,
            themeName: a.themeName,
            searchable
        });
    });

    themeArticles.forEach((list, path) => {
        list.sort((x, y) => String(y.date).localeCompare(String(x.date)));
        themeArticles.set(path, list);
    });

    nodeArticles.forEach((list, path) => {
        list.sort((x, y) => String(y.date).localeCompare(String(x.date)));
        nodeArticles.set(path, list);
    });

    return {
        tree,
        nodeChildren,
        nodeArticles,
        themeArticles,
        articleByRoute,
        articleById,
        searchIndex
    };
};

const learningIndex = buildLearningIndex(learningArticles);

export const getLearningLogs = () => learningArticles;
export const getLearningRootPath = () => '/learning';
export const getLearningChildren = (path = '/learning') => learningIndex.nodeChildren.get(path) ?? [];
export const getLearningArticleByRoute = (routePath) => learningIndex.articleByRoute.get(routePath) ?? null;
export const getLearningArticleById = (id) => learningIndex.articleById.get(Number(id)) ?? null;
export const getLearningArticlesByThemePath = (themePath, page = 1, pageSize = 10) => {
    const list = learningIndex.themeArticles.get(themePath) ?? [];
    const p = Math.max(1, Number(page) || 1);
    const size = Math.max(1, Number(pageSize) || 10);
    const start = (p - 1) * size;
    const end = start + size;
    return {
        items: list.slice(start, end),
        total: list.length,
        page: p,
        pageSize: size,
        totalPages: Math.ceil(list.length / size)
    };
};

export const getLearningArticlesByNodePath = (nodePath, page = 1, pageSize = 10) => {
    const list = learningIndex.nodeArticles.get(nodePath) ?? [];
    const p = Math.max(1, Number(page) || 1);
    const size = Math.max(1, Number(pageSize) || 10);
    const start = (p - 1) * size;
    const end = start + size;
    return {
        items: list.slice(start, end),
        total: list.length,
        page: p,
        pageSize: size,
        totalPages: Math.ceil(list.length / size)
    };
};

export const searchLearningArticles = (query, limit = 20) => {
    const q = String(query ?? '').trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = [];

    for (const item of learningIndex.searchIndex) {
        let score = 0;

        if (item.title && item.title.toLowerCase().includes(q)) score += 30;
        for (const t of tokens) {
            if (item.searchable.includes(t)) score += 10;
        }

        if (score > 0) scored.push({ score, item });
    }

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(b.item.date).localeCompare(String(a.item.date));
    });

    return scored.slice(0, Math.max(1, Number(limit) || 20)).map(x => x.item);
};

export const getProjectList = () => {
    return [
        { 
            id: 1, 
            name: '汽车销售管理系统', 
            desc: '面向中小型销售业务的后台系统，包含完整的用户下单与发货管理流程。',
            problem: '中小型销售业务普遍面临客户信息零散、价值密度低、实时跟进不及时、销售过程不透明、团队协作低效、缺乏实时数据分析等痛点。之前主要依赖 Excel 报表记录数据，存在数据密度大、管理混乱、难以追溯等问题。通过引入数据库统一管理数据，解决了信息分散、不便管理的问题；通过数据可视化大屏，让企业管理者能够实时观察数据并调整营销策略。',
            architecture: '整体采用分层架构设计：前端使用 Vue3 + Element Plus 保证页面的可用性和用户体验；可视化大屏部分使用 ECharts 做核心图表渲染，Data-v（Vue3 分支）做全屏容器；通过 RESTful API 实现前后端解耦，支持移动端和 PC 端多端通用。后端使用 Spring Boot + Java8，利用 @Transactional 事务机制确保操作的原子性；使用 Redis 作为中间件做数据库缓存，MySQL 作为持久化存储。核心业务流程：用户下单 → Redis 库存锁定 → 订单创建 → 发货管理。',
            decisions: [
                '极高的交付性价比：选择 Vue3 + Spring Boot 是因为这是目前市场上开发者储备最广的技术栈，招人容易、上手快、文档齐全，能够快速响应中小型业务频繁变化的需求，降低开发和维护成本。',
                '为什么选择 Spring Boot：使用 IOC 容器统一管理对象，实现控制反转，避免手动 new 对象的繁琐和容易出错的问题；通过 AOP 面向切面编程和依赖注入实现松耦合，使系统具备高度的可测试性和灵活性，方便后期功能的动态替换和扩展。',
                '为什么用 Redis 做库存锁定：Redis 是内存操作，响应速度非常快，相比 MySQL 的 IO 磁盘操作，Redis 更适合高并发多线程场景，能够保证系统稳定性，防止接口超时；同时利用 Redis 的单线程模型确保操作的原子性，防止商品超卖；使用 Redisson 解决 Redis 锁过期和续约问题，避免 30 秒未支付导致锁过期、另一个用户下单触发重复扣减超卖的问题。',
                'RBAC 权限模型的优势：采用 RBAC 实现权限解耦，不直接给用户分配权限，而是先创建角色（如销售员、销售经理、管理员），再给角色分配权限。当公司入职 50 个销售时，只需给他们统一挂上销售员角色，而不需要逐一勾选权限点，极大地降低了维护成本；灵活性极强，如果业务调整，规定销售员以后不能删除客户，只需要在后台修改销售员角色的权限表，所有关联的 50 个人会立即同步生效，无需修改代码或逐个调整用户。'
            ],
            stack: 'Java / Spring Boot / Vue 3',
            features: [
                '用户权限管理与 RBAC 权限模型',
                '多级分类商品搜索与筛选',
                '基于 Redis 的库存锁定机制',
                '图形化报表展示系统'
            ],
            techStack: [
                '后端：Spring Boot, Spring Security, MyBatis-Plus',
                '前端：Vue 3, Element Plus, ECharts',
                '存储：MySQL, Redis'
            ]
        },
        { 
            id: 2, 
            name: '自定义路由网络中继配置', 
            desc: '基于 ImmortalWrt 24.10 的无线中继网络调优与系统日志分析。',
            stack: 'OpenWrt / Linux / Networking',
            features: [
                '无线中继自动重连脚本',
                '多播负载均衡配置',
                '自定义防火墙规则',
                '实时流量监控面板'
            ],
            techStack: [
                '系统：OpenWrt (ImmortalWrt)',
                '脚本：Shell, Python',
                '网络：IPv6, QoS'
            ]
        },
        { 
            id: 3, 
            name: 'Git 本地仓库与远程克隆实战', 
            desc: '基于 Git 的本地与远程协作实践，涵盖初始化、克隆、分支合并与 SSH 配置。',
            stack: 'Git / GitHub / SSH',
            features: [
                '初始化与配置本地仓库',
                '生成并配置 SSH Key',
                '远程仓库克隆与同步',
                '分支管理与合并策略',
                '常见冲突的处理流程'
            ],
            techStack: [
                '工程实践：Git',
                '平台：GitHub/GitLab',
                '认证：SSH/HTTPS'
            ]
        }
    ];
};

export const getQuestions = () => {
    return [
        { id: 1, title: '如何解决 Redis 分布式锁的过期续期问题？', answer: '可以使用 Redisson 提供的看门狗机制，或者通过 Lua 脚本实现定时续期。', date: '2026-03-11' },
        { id: 2, title: 'MySQL 深度分页性能优化的常用手段？', answer: '使用 ID 范围查询、子查询优化或覆盖索引等方式，避免扫描过多行。', date: '2026-03-10' },
        { 
            id: 3, 
            title: 'Webhook 不生效：误把 Website 当 Webhook 如何排查？', 
            answer: '常见误区：1）把 http://your-domain.com:3000/webhook 填在 GitHub 仓库的 Website 字段。Website 仅用于展示项目信息，不会触发 webhook；2）用浏览器/GET 测试返回 "Cannot GET /webhook"。GitHub 发送的是 POST 请求并携带 JSON payload。正确做法：到 Settings → Webhooks → Add webhook 配置，将 Payload URL 填写为 http://your-domain.com:3000/webhook，Content-Type 选择 application/json，事件选择 push。保存后，从本地 push 到 GitHub，服务器才能收到 POST 并触发部署脚本（例如 /srv/deploy1.sh prod）。', 
            date: '2026-03-17' 
        },
        {
            id: 4,
            title: 'Git 本地仓库与远程克隆实战：最短操作清单',
            answer: '速查流程：1）初始化仓库：git init；2）暂存文件：git add .（或 git add <文件>）；3）提交版本：git commit -m "msg"；4）查看历史：git log；5）关联远程：git remote add origin <仓库地址> 并用 git remote -v 校验；6）推送远程：git push -u origin main。Linux 安装：Ubuntu/Debian 用 sudo apt update && sudo apt install git；CentOS/RHEL 用 sudo yum install git；最后用 git --version 确认。', 
            date: '2026-03-17'
        }
    ];
};
