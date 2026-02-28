// File: g:/Sovereign-DCCP-Core/server/api/dccp.ts
// DCCP 网关入口：连接 51124 端口
// 浏览器插件或脚本的意志投递点

import express from 'express';
import { DCCPBridge, IngestPayload } from '../core/DCCPBridge';
import { NeuralRouter } from '../core/NeuralRouter';
import { DCCPCompiler } from '../core/compiler';

export default function createDccpRoutes(neuralRouter: NeuralRouter) {
  const router = express.Router();
  const bridge = new DCCPBridge();
  const compiler = new DCCPCompiler();

  // In-memory wealth storage for the session
  let sessionWealth = 0;

  /**
   * POST /api/dccp/route
   * 全自动意志传导闭环端点：直接接收原始意图，交由路由器和模型自动处理并落盘
   */
  router.post('/route', async (req, res) => {
    const { rawIntent, targetFilePath, agentTier } = req.body;

    if (!rawIntent) {
      return res.status(400).json({ error: 'DCCP-005', message: 'rawIntent is required for routing' });
    }

    try {
      // 1. 编译为 DCCPPacket
      const tier = agentTier || 'v2.0';
      const packet = compiler.compile(rawIntent, tier, targetFilePath);

      // 2. 扔进神经路由器执行全生命周期网关流转
      const result = await neuralRouter.route(packet);

      if (result.success) {
        res.json({
          status: 'success',
          packetId: result.packetId,
          adapterId: result.adapterId,
          nodeId: result.nodeId,
          executionTime: result.executionTime,
          auditPassed: result.auditResult?.passed,
          sovereigntyScore: result.auditResult?.sovereigntyScore,
          message: '意志传导并执行成功，若附加了 targetFilePath 并且审计通过则已落盘'
        });
      } else {
        res.status(502).json({
          error: 'DCCP-502',
          message: `执行阻断: ${result.error}`,
          packetId: result.packetId
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'DCCP-500', message: err.message });
    }
  });

  /**
   * POST /api/dccp/ingest
   * 单文件意志直接落盘 (越过路由直达物理层, 后门端点)
   */
  router.post('/ingest', async (req, res) => {
    const { filePath, content, encoding, backup } = req.body;

    // 参数完整性校验
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        error: 'DCCP-001',
        message: 'Incomplete DCCP Packet: filePath is required'
      });
    }

    if (content === undefined || content === null) {
      return res.status(400).json({
        error: 'DCCP-002',
        message: 'Incomplete DCCP Packet: content is required'
      });
    }

    try {
      const payload: IngestPayload = {
        filePath,
        content,
        encoding,
        backup: backup || false
      };

      const result = await bridge.ingest(payload);
      res.json(result);
    } catch (err: any) {
      console.error(`[DCCP-API] 落盘失败: ${err.message}`);
      res.status(500).json({
        error: 'DCCP-500',
        message: err.message
      });
    }
  });

  /**
   * POST /api/dccp/batch
   * 批量文件直接落盘 (越过路由直达物理层)
   */
  router.post('/batch', async (req, res) => {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'DCCP-003',
        message: 'Batch ingest requires non-empty files array'
      });
    }

    // 验证每个文件对象
    const invalidFiles = files.filter((f: any) => !f.filePath || f.content === undefined);
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        error: 'DCCP-004',
        message: `Invalid files at indices: ${invalidFiles.map((f: any, i: number) => i).join(', ')}`
      });
    }

    try {
      const payloads: IngestPayload[] = files.map((f: any) => ({
        filePath: f.filePath,
        content: f.content,
        encoding: f.encoding,
        backup: f.backup || false
      }));

      const results = await bridge.batchIngest(payloads);
      res.json({
        status: 'completed',
        total: files.length,
        results
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'DCCP-500',
        message: err.message
      });
    }
  });

  /**
   * POST /api/dccp/config
   * 更新路由器运行时配置
   */
  router.post('/config', (req, res) => {
    const { enableAudit, enableAutoSwitch } = req.body;
    neuralRouter.setConfig({
      enableAudit: typeof enableAudit === 'boolean' ? enableAudit : undefined,
      enableAutoSwitch: typeof enableAutoSwitch === 'boolean' ? enableAutoSwitch : undefined
    });
    res.json({ status: 'success', currentConfig: neuralRouter.getStats().config });
  });

  /**
   * GET /api/dccp/health
   * 健康检查端点
   */
  router.get('/health', (req, res) => {
    res.json({
      status: 'operational',
      service: 'DCCP-Bridge',
      timestamp: Date.now()
    });
  });

  /**
   * GET /api/dccp/wealth/stats
   * 获取当前 session 的财富统计
   */
  router.get('/wealth/stats', (req, res) => {
    res.json({
      success: true,
      total: sessionWealth,
      currency: 'USD'
    });
  });

  /**
   * POST /api/dccp/internal/emit
   * 内部事件转发端点：供 arbitrage_engine.ts 调用，将事件通过 Socket.io 转发给 UI
   */
  router.post('/internal/emit', (req, res) => {
    const { event, data } = req.body;

    if (!event || !data) {
      return res.status(400).json({ error: 'Missing event or data' });
    }

    // 更新内存中的财富总额
    if (event === 'wealthGenerated' && typeof data.value === 'number') {
      sessionWealth += data.value;
    }

    // 通过 Socket.io 广播给所有 UI 客户端
    const io = require('../services/eventBus').eventBus.getIoInstance();
    if (io) {
      io.emit(event, data);
      res.json({ success: true, message: `Event ${event} emitted to UI` });
    } else {
      res.status(500).json({ error: 'Socket.io instance not available' });
    }
  });

  /**
   * POST /api/dccp/handover
   * 代理状态交接端点：序列化当前任务上下文以供下一个 Agent 读取
   */
  let lastHandoverContext: any = null;
  router.post('/handover', (req, res) => {
    const { context, nextAgentHint } = req.body;
    if (!context) return res.status(400).json({ error: 'Context is required for handover' });

    lastHandoverContext = {
      timestamp: Date.now(),
      context,
      nextAgentHint,
      handoverId: `HO-${Date.now().toString(36).toUpperCase()}`
    };

    const io = require('../services/eventBus').eventBus.getIoInstance();
    if (io) io.emit('handoverSignal', lastHandoverContext);

    res.json({ success: true, handoverId: lastHandoverContext.handoverId });
  });

  /**
   * GET /api/dccp/handover
   * 获取最新的交接上下文
   */
  router.get('/handover', (req, res) => {
    if (!lastHandoverContext) return res.status(404).json({ error: 'No active handover found' });
    res.json(lastHandoverContext);
  });

  /**
   * POST /api/dccp/relay
   * 代理间实时中继：允许 Agent A 通过 Socket.io 向 Agent B 发送私有指令
   */
  router.post('/relay', (req, res) => {
    const { targetAgentId, payload } = req.body;
    const io = require('../services/eventBus').eventBus.getIoInstance();
    if (io) {
      io.emit('agentRelay', { targetAgentId, payload, from: 'Antigravity' });
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Relay failed' });
    }
  });

  router.post('/dispatch', async (req, res) => {
    const { directive, target } = req.body;

    if (!directive) {
      return res.status(400).json({ error: 'Directive is required' });
    }

    try {
      const io = require('../services/eventBus').eventBus.getIoInstance();

      // 1. 同步通过 Socket.io 通知 UI 指令已受理并显示在 Manifest 中
      if (io) {
        io.emit('latticeUpdate', {
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          agent: 'NEXUS_DISPATCH',
          msg: `COMMAND ACCEPTED: [${directive}] -> TARGET: ${target || 'AUTO_ROUTED'}`
        });
      }

      // --- 拦截并发放多节点讨论流 (Multi-Agent Swarm Mode) ---
      // 当指挥官下达这类评估/讨论指令时，强行分发给所有节点
      if (directive.includes('讨论') || directive.includes('评估') || directive.includes('UI') || directive.includes('ui')) {

        const arenaAdapter = neuralRouter['adapters'].get('ARENA_CLUSTER');
        if (arenaAdapter && io) {
          const activeNodes = require('../services/eventBus').eventBus['clients'] /* We just need a way to get nodes, let's use neuralRouter registry indirectly if possible, or just emit a message */
        }

        // To properly access AgentRegistry we should pull it. We know neuralRouter has it.
        const registry = neuralRouter['registry'];
        const availableNodes = registry ? registry.getAvailableNodes() : [];

        if (availableNodes.length > 0 && arenaAdapter && io) {
          // 编译一个专用的测试包
          const packet = compiler.compile(directive, 'v2.0', 'temp');

          // 构造多线程并发执行
          availableNodes.forEach((node: any, index: number) => {
            const delay = 500 + (Math.random() * 5000); // 错峰 0.5 - 5 秒

            setTimeout(async () => {
              let isMock = false;
              let isWebGhost = false;
              let adapterId = 'ARENA_CLUSTER';

              if (node.provider === 'OPENAI') adapterId = 'OPENAI_ADAPTER';
              else if (node.provider === 'ANTHROPIC') adapterId = 'ANTHROPIC_ADAPTER';
              else if (node.provider === 'GOOGLE') adapterId = 'GOOGLE_ADAPTER';

              let targetAdapter = neuralRouter['adapters'].get(adapterId);

              // 检查节点是否被明确配置为 WEB_GHOST (免费白嫖算力层)
              if (node.tier === 'WEB_GHOST') {
                targetAdapter = arenaAdapter; // 交给 ArenaAdapter 处理物理网页抓取
                isWebGhost = true;
              } else if (!targetAdapter || !(targetAdapter as any).execute) {
                // 若真实 API 适配器没配置或不可用，强制降级到 Arena 本地模拟
                targetAdapter = arenaAdapter;
                isMock = true;
              }

              try {
                let responseStr;

                if (isMock) {
                  // Arena 降级沙盒处理
                  const nodePrompt = targetAdapter.transform(packet) + `\n[Context: You are responding specifically as Node Agent ${node.id} from Provider ${node.provider}. Keep it exactly 1 concise cyber-themed sentence evaluating the UI.]`;
                  responseStr = await (targetAdapter as any).execute(nodePrompt);
                } else if (isWebGhost) {
                  // Web Ghost Engine 物理爬虫启动
                  const nodePrompt = targetAdapter.transform(packet) + `\n[MANDATORY CONTEXT: Respond in the persona of Node [${node.id}] powered by [${node.provider}] Web. 1 short cyberpunk sentence evaluating the UI. No formatting.]`;
                  const ghostPacket = {
                    ...packet,
                    _useGhost: true,
                    _ghostTarget: (node.provider === 'GOOGLE' || node.provider === 'MOONSHOT') ? 'gemini' : 'arena'
                  };
                  responseStr = await (targetAdapter as any).execute(nodePrompt, ghostPacket);
                } else {
                  // 真实大厂 HTTP 请求
                  const customPacket = {
                    ...packet,
                    dna_payload: packet.dna_payload + `\n\n[MANDATORY CONTEXT: You must respond in the persona of Node [${node.id}] powered by API [${node.provider}]. The user has triggered a Swarm Protocol via the DCCP Command Nexus. Your response must be EXACTLY ONE highly concise, cyberpunk-themed sentence evaluating the UI or confirming your readiness. No conversational filler. Do NOT use markdown formatting for the text, just plain text.]`
                  };
                  const nodePrompt = targetAdapter.transform(customPacket);
                  responseStr = await (targetAdapter as any).execute(nodePrompt);
                }

                const parsed = targetAdapter.recover(responseStr);
                // 提取核心信息 (JSON解析容错)
                const baseMsg = typeof parsed === 'string' ? parsed : (parsed.text ? parsed.text : JSON.stringify(parsed));

                const cleanMsg = baseMsg.replace(/[\{\}\"]/g, '').substring(0, 200).trim();
                const modifier = isMock ? '[Mock] ' : (isWebGhost ? '[Ghost] ' : '');
                const finalDisplay = `${modifier}${cleanMsg}`;

                // 2. 利用 Socket.io 真实反哺前端
                io.emit('agentBroadcastResponse', {
                  nodeId: node.id,
                  message: `[${node.provider}] ${finalDisplay}`
                });

              } catch (e: any) {
                console.error(`[NEXUS_DISPATCH] Node ${node.id} Failed:`, e.message);
                io.emit('agentBroadcastResponse', {
                  nodeId: node.id,
                  message: `[SYSTEM] Processing error: ${e.message.substring(0, 30)}...`
                });
              }
            }, delay);
          });

          return res.json({ success: true, message: 'Swarm processing initiated for all nodes.' });
        }
      }

      // 默认单线路由
      const packet = compiler.compile(directive, 'v2.0', target || 'auto');
      const result = await neuralRouter.route(packet);

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
