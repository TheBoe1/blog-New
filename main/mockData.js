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

const buildLearningRoute = ({ bigKey, techKey, themeKey, slug }) => `/learning/${bigKey}/${techKey}/${themeKey}/${slug}`;
const buildThemeRoute = ({ bigKey, techKey, themeKey }) => `/learning/${bigKey}/${techKey}/${themeKey}`;

const learningArticles = [
    {
        id: 1,
        topic: 'Redis 分布式锁 (SETNX) 实践与优化',
        content: '',
        tags: ['Redis', '分布式锁'],
        category: 'Cache',
        date: '2026-03-10'
    },
    {
        id: 2,
        topic: 'RocketMQ 分布式事务消息原理剖析',
        content: '',
        tags: ['Java', 'RocketMQ', '事务'],
        category: 'Middleware',
        date: '2026-03-08'
    },
    {
        id: 3,
        topic: 'MySQL 聚簇索引与 B+ 树底层结构',
        content: '',
        tags: ['MySQL', '索引'],
        category: 'Database',
        date: '2026-03-05'
    },
    {
        id: 4,
        topic: 'ConcurrentHashMap 并发安全机制',
        content: '',
        tags: ['Java', '并发'],
        category: 'Java',
        date: '2026-03-01'
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
            route: a.route,
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
        }
    ];
};

export const getQuestions = () => {
    return [
        { id: 1, title: '如何解决 Redis 分布式锁的过期续期问题？', answer: '可以使用 Redisson 提供的看门狗机制，或者通过 Lua 脚本实现定时续期。', date: '2026-03-11' },
        { id: 2, title: 'MySQL 深度分页性能优化的常用手段？', answer: '使用 ID 范围查询、子查询优化或覆盖索引等方式，避免扫描过多行。', date: '2026-03-10' }
    ];
};
