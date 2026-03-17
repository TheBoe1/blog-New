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
    { key: 'practice', name: '工程实践' }
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
            answer: '常见误区：1）把 http://59.110.41.235:3000/webhook 填在 GitHub 仓库的 Website 字段。Website 仅用于展示项目信息，不会触发 webhook；2）用浏览器/GET 测试返回 “Cannot GET /webhook”。GitHub 发送的是 POST 请求并携带 JSON payload。正确做法：到 Settings → Webhooks → Add webhook 配置，将 Payload URL 填写为 http://59.110.41.235:3000/webhook，Content-Type 选择 application/json，事件选择 push。保存后，从本地 push 到 GitHub，服务器才能收到 POST 并触发部署脚本（例如 /srv/deploy1.sh prod）。', 
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
