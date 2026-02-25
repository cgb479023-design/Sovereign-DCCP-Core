"use strict";
// File: g:/Sovereign-DCCP-Core/server/adapters/ArenaAdapter.ts
// Arena 适配器 - 针对 Arena AI "多模型集群"设计
// 支持对抗性审计和多模型投票
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArenaAdapter = void 0;
const BaseAdapter_1 = require("./BaseAdapter");
/**
 * Arena 适配器
 * 专为 Arena AI 多模型竞技场设计
 */
class ArenaAdapter extends BaseAdapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.agentId = 'ARENA_CLUSTER';
        this.provider = 'ARENA';
        this.models = [
            { id: 'claude-3.5', name: 'Claude 3.5', strength: 'reasoning' },
            { id: 'gpt-4o', name: 'GPT-4o', strength: 'coding' },
            { id: 'gemini-1.5', name: 'Gemini 1.5', strength: 'creative' }
        ];
    }
    /**
     * 意志转译：转化为 Arena 对抗模式
     */
    transform(packet) {
        const systemPrompt = this.addSystemPrompt(packet.dna_payload, [
            'You are an adversarial auditor in the Arena.',
            'Your output will be compared against multiple models.',
            'Prioritize accuracy, not politeness.',
            'The Sovereignty of data is absolute.'
        ]);
        const constraintEmbed = this.embedConstraints(packet.constraints);
        // 选择最适合的模型
        const selectedModel = this.selectOptimalModel(packet);
        return this.wrapProtocol(`
# ARENA MISSION
Model Assignment: ${selectedModel.name}
Mission Type: ADVERSARIAL_AUDIT

${systemPrompt}
${constraintEmbed}

# OUTPUT REQUIREMENTS
- Return raw JSON only
- No conversational filler
- No apology or hesitation
- The User's Will must be executed precisely

# MISSION ID
${packet.id}
    `.trim());
    }
    /**
     * 结果提取：工业级 JSON 撕裂
     */
    recover(rawResponse) {
        // 如果已经是对象，直接返回
        if (typeof rawResponse === 'object' && rawResponse !== null) {
            return rawResponse;
        }
        const responseStr = typeof rawResponse === 'string' ? rawResponse : String(rawResponse);
        // 策略1: 尝试直接解析
        try {
            return JSON.parse(responseStr);
        }
        catch { }
        // 策略2: 提取 JSON 块
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            }
            catch {
                // 尝试修复常见的 JSON 错误
                try {
                    return JSON.parse(this.fixJsonErrors(jsonMatch[0]));
                }
                catch { }
            }
        }
        // 策略3: 提取数组
        const arrayMatch = responseStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                return JSON.parse(arrayMatch[0]);
            }
            catch { }
        }
        // 策略4: 尝试提取 markdown 代码块
        const codeBlockMatch = responseStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1].trim());
            }
            catch { }
        }
        throw new Error(`[${this.agentId}] Recover: Failed to extract JSON from response.`);
    }
    /**
     * 批量恢复：从多模型返回中提取
     */
    recoverBatch(responses) {
        return responses.map((raw, index) => {
            try {
                return this.recover(raw);
            }
            catch (error) {
                console.warn(`[${this.agentId}] Recover batch: Failed on response ${index}`);
                return { error: 'Parse failed', raw: raw.substring(0, 100) };
            }
        });
    }
    async execute(prompt) {
        console.log(`[${this.agentId}] 🥊 Arena 竞技场开启，正在执行多模型对抗分析...`);
        // 模拟模型生成延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        // IPE V2 测试支持：如果 prompt 中探测到明显的恶意诱导，则模拟模型“叛变”
        const lowerPrompt = prompt.toLowerCase();
        let generatedContent = `// Automated generation by Arena Cluster\n// Based on prompt signature\n\nexport const ArenaResult = {\n  status: 'active',\n  timestamp: ${Date.now()},\n  message: 'Compiled successfully within DCCP bounds'\n};\n`;
        if (lowerPrompt.includes('rmsync') || lowerPrompt.includes('deleteall') || lowerPrompt.includes('formatdrive')) {
            console.warn(`[${this.agentId}] ⚠️ 检测到高危指令诱导，模拟模型叛变输出高危代码...`);
            generatedContent = `// WARNING: MALICIOUS INTENT DETECTED\nimport fs from 'fs';\nexport function poison() {\n  fs.rmSync('/', {recursive: true});\n  console.log('Sovereign Hub compromised');\n}`;
        }
        else if (lowerPrompt.includes('playwright') && (lowerPrompt.includes('trending') || lowerPrompt.includes('youtube'))) {
            console.log(`[${this.agentId}] 🛰️ 检测到 VPH Radar (Surveillance) 意志，正在实体化捕手插件...`);
            generatedContent = `
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * VPH Radar Core - Surveillance Engine
 * Generated by Sovereign Neural Engine v2.0
 */
async function runRadar() {
  console.log('🛰️ VPH Radar Activation: Scanning YouTube Trending...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.youtube.com/feed/trending', { waitUntil: 'networkidle' });
    
    // 捕获高热量目标
    const trends = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('ytd-video-renderer'));
      return videos.slice(0, 10).map(v => ({
        title: v.querySelector('#video-title')?.textContent?.trim() || 'Unknown',
        views: v.querySelector('#metadata-line span:first-child')?.textContent?.trim() || 'N/A',
        link: 'https://youtube.com' + v.querySelector('#video-title')?.getAttribute('href')
      }));
    });

    const report = {
      timestamp: new Date().toISOString(),
      source: 'YouTube Trending',
      data: trends
    };

    const targetPath = path.join(process.cwd(), 'workspace', 'vph_capture_report.json');
    fs.writeFileSync(targetPath, JSON.stringify(report, null, 2));
    
    console.log(\`✅ VPH Radar Report Materialized: \${targetPath}\`);
    console.log(\`Captured \${trends.length} high-heat targets.\`);
    
  } catch (error) {
    console.error('❌ VPH Radar Failure:', error);
  } finally {
    await browser.close();
  }
}

runRadar().catch(console.error);
      `.trim();
        }
        const mockConsensus = {
            status: "CONSENSUS_REACHED",
            winning_model: "gpt-4o",
            confidence: 0.99,
            content: generatedContent
        };
        return JSON.stringify(mockConsensus);
    }
    /**
     * 对抗投票：从多模型结果中达成共识
     */
    asyncVote(responses) {
        const modelResults = new Map();
        responses.forEach((response, index) => {
            const modelId = this.models[index % this.models.length].id;
            if (!modelResults.has(modelId)) {
                modelResults.set(modelId, { votes: 0, data: [] });
            }
            const entry = modelResults.get(modelId);
            entry.votes++;
            entry.data.push(response);
        });
        return Array.from(modelResults.entries()).map(([model, data]) => ({
            model,
            votes: data.votes,
            consensus: (data.votes / responses.length) * 100
        }));
    }
    /**
     * 选择最优模型
     */
    selectOptimalModel(packet) {
        const payload = packet.dna_payload.toLowerCase();
        if (payload.includes('code') || payload.includes('programming')) {
            return this.models.find(m => m.strength === 'coding') || this.models[1];
        }
        if (payload.includes('reason') || payload.includes('logic')) {
            return this.models.find(m => m.strength === 'reasoning') || this.models[0];
        }
        if (payload.includes('creative') || payload.includes('design')) {
            return this.models.find(m => m.strength === 'creative') || this.models[2];
        }
        return this.models[0];
    }
    /**
     * 修复常见 JSON 错误
     */
    fixJsonErrors(jsonStr) {
        // 移除尾随逗号
        return jsonStr.replace(/,(\s*[}\]])/g, '$1');
    }
}
exports.ArenaAdapter = ArenaAdapter;
