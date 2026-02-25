// File: g:/Sovereign-DCCP-Core/server/index.ts
console.log('DEBUG: DCCP_STARTING_UP');
// DCCP 主权核心服务器 - 入口点
// 端口: 51124 (DCCP Protocol Port)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import createDccpRoutes from './api/dccp';
import createRadarRoutes from './api/radar';
import { eventBus } from './services/eventBus';
import { initLogger } from './services/logger';
import { loadConfig, getConfig, createDefaultConfig } from './core/config';
import { AgentRegistry } from './core/AgentRegistry';
import { NeuralRouter } from './core/NeuralRouter';
import { ArenaAdapter } from './adapters/ArenaAdapter';

dotenv.config();

// ---------------------------------------------------------
// 全局生命周期与异常保险丝 (Global Error Boundary)
// ---------------------------------------------------------
process.on('uncaughtException', (err: any) => {
  console.error('\n🚨 [FATAL] 未捕获的系统级异常 (Uncaught Exception):', err);
  // 在生产环境中应记录日志后 process.exit(1) 重启，此处做防御性吞咽处理
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('\n⚠️ [WARN] 未处理的异步拒绝 (Unhandled Rejection) at:', promise, 'reason:', reason);
});

// 加载配置
loadConfig();
const config = getConfig();

// 初始化日志系统
const logger = initLogger({
  level: config.log.level,
  filePath: config.log.filePath,
  maxFiles: config.log.maxFiles
});

const app = express();
const PORT = config.server.port;

// 创建 HTTP 服务器
const httpServer = createServer(app);

// 初始化事件总线 + Socket.io
const io = eventBus.init(httpServer);

// 初始化核心组件
const registry = new AgentRegistry();
const neuralRouter = new NeuralRouter(registry, eventBus, config.router);

// 从配置初始化适配器
neuralRouter.initAdaptersFromConfig();

// 注册 Arena 适配器 (不需要 API Key)
neuralRouter.registerAdapter(new ArenaAdapter());

// 从配置注册节点
for (const nodeConfig of config.nodes.registry) {
  registry.registerNode({
    id: nodeConfig.id,
    provider: nodeConfig.provider as any,
    tier: nodeConfig.tier as any,
    type: nodeConfig.type as any,
    endpoint: nodeConfig.endpoint
  });
}

// CORS 配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 开发环境允许所有
    if (config.server.env === 'development') {
      return callback(null, true);
    }

    // 生产环境检查白名单
    if (!origin) {
      return callback(new Error('CORS origin undefined'), false);
    }

    if (config.server.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

import { DCCPBridge } from './core/DCCPBridge';
const dccpBridge = new DCCPBridge();

// API 路由
app.use('/api/dccp', createDccpRoutes(neuralRouter));
app.use('/api/radar', createRadarRoutes(neuralRouter));

// 后端监听意志落盘信号，打通从 Router 到 Bridge 的物理隔离
eventBus.on('diskIngestSignal', async (signal: any) => {
  logger.info(`[EventBus] 📡 截获意志落盘信号: ${signal.packetId} -> ${signal.filePath}`);
  try {
    await dccpBridge.ingest({
      filePath: signal.filePath,
      content: signal.content,
      encoding: signal.encoding,
      backup: signal.backup !== false
    });
    logger.info(`[EventBus] ✅ 自动物理落盘成功`);
    eventBus.emitAlert('success', `意志已成功实体化: ${signal.filePath}`);
  } catch (error: any) {
    logger.error(`[EventBus] ❌ 自动物理落盘失败: ${error.message}`);
    eventBus.emitAlert('error', `物理落盘阻断: ${error.message}`);
  }
});

// 节点管理 API
app.get('/api/dccp/nodes', (req, res) => {
  res.json(registry.getStats());
});

app.get('/api/dccp/router/stats', (req, res) => {
  res.json(neuralRouter.getStats());
});

// Socket.io 客户端命令处理
io.on('connection', (socket) => {
  logger.info(`客户端连接: ${socket.id}`);

  // 辅助函数：根据路由器状态计算节点的真实感负载
  const getAuthenticLoad = (node: any) => {
    const stats = neuralRouter.getStats();
    const baseLoad = node.status === 'active' ? 5 + (node.sovereigntyScore / 20) : 0;
    // 叠加活跃任务带来的动态负载
    const dynamicLoad = stats.activeTasks > 0 ? (stats.activeTasks * 15) : 0;
    return Math.min(Math.round(baseLoad + dynamicLoad + (Math.random() * 5)), 100);
  };

  // 首次连接即刻下发当前的快照（水合数据 Hydration）
  socket.emit('nodesSnapshot', Array.from(registry.getAvailableNodes().map(n => ({
    nodeId: n.id,
    provider: n.provider,
    tier: n.tier,
    status: n.status,
    load: getAuthenticLoad(n),
    sovereigntyScore: n.sovereigntyScore,
    lastSeen: n.lastSeen
  }))));

  // 立即下发当时的系统总体统计状态
  socket.emit('statsSnapshot', neuralRouter.getStats());

  socket.on('nodeCommand', (data: { command: string; nodeId: string }) => {
    logger.info(`收到节点命令: ${data.command} -> ${data.nodeId}`);

    if (data.command === 'shutdown') {
      registry.setNodeStatus(data.nodeId, 'offline');
      eventBus.emitAlert('warning', `Node ${data.nodeId} has been shutdown`);
    } else if (data.command === 'reload') {
      registry.setNodeStatus(data.nodeId, 'active');
      registry.heartbeat(data.nodeId);
      eventBus.emitAlert('info', `Node ${data.nodeId} has been reloaded`);
    }

    // 广播更新
    io.emit('nodesSnapshot', Array.from(registry.getAvailableNodes().map(n => ({
      nodeId: n.id,
      provider: n.provider,
      tier: n.tier,
      status: n.status,
      load: getAuthenticLoad(n),
      sovereigntyScore: n.sovereigntyScore,
      lastSeen: n.lastSeen
    }))));
  });
});

// 每 5 秒自动广播一次全量遥测快照，确保 UI 这种即便没有事件也具备“呼吸感”
setInterval(() => {
  const activeNodes = registry.getAvailableNodes();
  const stats = neuralRouter.getStats();

  const getAuthenticLoad = (node: any) => {
    const baseLoad = node.status === 'active' ? 5 + (node.sovereigntyScore / 20) : 0;
    const dynamicLoad = stats.activeTasks > 0 ? (stats.activeTasks * 15) : 0;
    return Math.min(Math.round(baseLoad + dynamicLoad + (Math.random() * 5)), 100);
  };

  eventBus.getIoInstance()?.emit('nodesSnapshot', activeNodes.map(n => ({
    nodeId: n.id,
    provider: n.provider,
    tier: n.tier,
    status: n.status,
    load: getAuthenticLoad(n),
    sovereigntyScore: n.sovereigntyScore,
    lastSeen: n.lastSeen
  })));

  eventBus.getIoInstance()?.emit('statsSnapshot', stats);
}, 5000);

// 根路由
app.get('/', (req, res) => {
  res.json({
    service: 'Sovereign DCCP Core',
    version: '1.0.0',
    status: 'operational',
    env: config.server.env,
    socket: `ws://localhost:${PORT}/dccp-events`,
    endpoints: {
      ingest: 'POST /api/dccp/ingest',
      batch: 'POST /api/dccp/batch',
      health: 'GET /api/dccp/health',
      nodes: 'GET /api/dccp/nodes',
      router: 'GET /api/dccp/router/stats'
    }
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Server error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🜲 SOVEREIGN DCCP CORE v1.0                            ║
║      Digital Command & Control Protocol                   ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║  Status:    OPERATIONAL                                    ║
║  Port:      ${PORT}                                        
║  Env:       ${config.server.env}                                     
║  Socket:    ws://localhost:${PORT}/dccp-events              
║                                                            ║
║  Components:                                               ║
║  • NeuralRouter    - 意志传导引擎                          ║
║  • AgentRegistry   - ${registry.getStats().totalNodes} 个算力节点已注册                   
║  • EventBus        - 实时事件通道                          ║
║  • Logger          - 结构化日志                            ║
║                                                            ║
║  Adapters:                                                 ║
${neuralRouter.getStats().registeredAdapters.map(a => `║  • ${a}`).join('\n') || '║  • (无)'}                                                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  logger.info(`DCCP 服务器启动完成，端口: ${PORT}`);
});

export default app;
