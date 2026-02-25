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

  return router;
}
