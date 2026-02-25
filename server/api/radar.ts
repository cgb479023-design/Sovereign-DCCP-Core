// File: g:/Sovereign-DCCP-Core/server/api/radar.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import { NeuralRouter } from '../core/NeuralRouter';
import { DCCPCompiler } from '../core/compiler';

export default function createRadarRoutes(neuralRouter: NeuralRouter) {
    const router = express.Router();
    const compiler = new DCCPCompiler();

    /**
     * GET /api/radar/data
     * 获取最新的 VPH Radar 捕获报告
     */
    router.get('/data', (req, res) => {
        const reportPath = path.join(process.cwd(), 'workspace', 'vph_capture_report.json');
        if (!fs.existsSync(reportPath)) {
            return res.status(404).json({ error: 'No report found', message: 'VPH Radar has not materialized any report yet.' });
        }

        try {
            const data = fs.readFileSync(reportPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (err: any) {
            res.status(500).json({ error: 'Read error', message: err.message });
        }
    });

    /**
     * POST /api/radar/scan
     * 触发 VPH Radar 闭环扫描
     */
    router.post('/scan', async (req, res) => {
        try {
            // 构造封闭意志：扫描 YouTube 趋势并落盘
            const packet = compiler.compile(
                'Execute VPH Radar Surveillance: Scan YouTube Trending and materialize to workspace/vph_capture_report.json using Playwright.',
                'v4.0_arena',
                'workspace/vph_radar_core.ts'
            );

            const result = await neuralRouter.route(packet);

            if (result.success) {
                res.json({
                    status: 'initiated',
                    message: '意志传导成功，正在实体化并执行 VPH Radar...',
                    packetId: result.packetId
                });
            } else {
                res.status(502).json({ error: 'Routing failed', message: result.error });
            }
        } catch (err: any) {
            res.status(500).json({ error: 'Internal error', message: err.message });
        }
    });

    /**
     * POST /api/radar/analyze
     * 对特定热点目标进行深度病毒学分析
     */
    router.post('/analyze', async (req, res) => {
        const { title, link } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });

        try {
            console.log(`[Radar] 🧪 启动病毒学分析: ${title}`);
            const packet = compiler.compile(
                `Perform a Professional Viral Intelligence Analysis for the video: "${title}". 
                Output a JSON report with: 
                - viralScore (0-100)
                - sentimentScore (number 0-100)
                - demographic (primary target audience)
                - keyTriggers (array of 3-4 emotional hooks)
                - prediction (growth forecast)
                - blueprint (content strategy advice). 
                Format strictly as JSON.`,
                'v3.0_gpt4'
            );

            const result = await neuralRouter.route(packet);

            if (result.success) {
                // Try to parse JSON from AI response
                let intelligence = result.response;
                if (typeof intelligence === 'string') {
                    const match = intelligence.match(/\{[\s\S]*\}/);
                    if (match) intelligence = JSON.parse(match[0]);
                }
                res.json({ title, link, analysis: intelligence });
            } else {
                res.status(502).json({ error: 'Analysis failed', message: result.error });
            }
        } catch (err: any) {
            res.status(500).json({ error: 'Internal error', message: err.message });
        }
    });

    return router;
}
