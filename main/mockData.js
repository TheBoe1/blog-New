export const getLearningLogs = () => {
    return [
        { id: 1, topic: 'Redis 分布式锁 (SETNX) 实践与优化', category: 'Cache', date: '2026-03-10' },
        { id: 2, topic: 'RocketMQ 分布式事务消息原理剖析', category: 'Middleware', date: '2026-03-08' },
        { id: 3, topic: 'MySQL 聚簇索引与 B+ 树底层结构', category: 'Database', date: '2026-03-05' },
        { id: 4, topic: 'ConcurrentHashMap 并发安全机制', category: 'Java', date: '2026-03-01' }
    ];
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

export const getSystemStats = () => {
    return { 
        uptime: '128 Days', 
        logsCount: 42, 
        projectsCount: 2, 
        questionsCount: 2,
        server: {
            status: 'Online', // Online, High Load, Error
            cpu: 45, // %
            memory: 68, // %
            disk: 32, // %
            netIn: 1.2, // MB/s
            netOut: 0.8, // MB/s
            history: [30, 45, 42, 50, 48, 45], // for small line chart
            logs: [
                { time: '14:20:05', level: 'INFO', msg: 'System monitoring service started' },
                { time: '14:25:12', level: 'WARN', msg: 'Memory usage exceeded 60%' },
                { time: '15:01:45', level: 'INFO', msg: 'Backup task completed successfully' }
            ]
        }
    };
};