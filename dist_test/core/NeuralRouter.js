"use strict";
// File: g:/Sovereign-DCCP-Core/server/core/NeuralRouter.ts
// 神经路由器 - 协调 AgentRegistry 和 Adapters 的核心决策引擎
// 接收意志包 -> 匹配最优适配器 -> 发起执行 -> 触发 IPE 审计 -> 返回落盘信号
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralRouter = void 0;
const compiler_1 = require("./compiler");
const ProtocolHandshake_1 = require("./ProtocolHandshake");
const OpenAIAdapter_1 = require("../adapters/OpenAIAdapter");
const AnthropicAdapter_1 = require("../adapters/AnthropicAdapter");
const GoogleAdapter_1 = require("../adapters/GoogleAdapter");
const logger_1 = require("../services/logger");
const config_1 = require("./config");
const SecurityAuditor_1 = require("./SecurityAuditor");
class NeuralRouter {
    constructor(registry, eventBus, config) {
        this.adapters = new Map();
        this.logger = (0, logger_1.createDCPLogger)('NeuralRouter');
        this.activeTasks = 0;
        this.compiler = new compiler_1.DCCPCompiler();
        this.registry = registry;
        this.eventBus = eventBus;
        this.config = {
            enableAudit: config?.enableAudit ?? true,
            enableAutoSwitch: config?.enableAutoSwitch ?? true,
            maxRetries: config?.maxRetries ?? 3,
            timeoutMs: config?.timeoutMs ?? 30000
        };
        this.securityAuditor = new SecurityAuditor_1.SecurityAuditor();
    }
    /**
     * 注册适配器
     */
    registerAdapter(adapter) {
        this.adapters.set(adapter.agentId, adapter);
        this.logger.info(`适配器注册: ${adapter.agentId}`);
    }
    /**
     * 根据配置初始化适配器
     */
    initAdaptersFromConfig() {
        const config = (0, config_1.getConfig)();
        if (config.adapters.openai?.apiKey && config.adapters.openai.apiKey !== 'your-openai-key') {
            const openaiAdapter = new OpenAIAdapter_1.OpenAIAdapter(config.adapters.openai);
            this.registerAdapter(openaiAdapter);
            this.logger.info('OpenAI 适配器已初始化');
        }
        if (config.adapters.anthropic?.apiKey && config.adapters.anthropic.apiKey !== 'your-anthropic-key') {
            const anthropicAdapter = new AnthropicAdapter_1.AnthropicAdapter(config.adapters.anthropic);
            this.registerAdapter(anthropicAdapter);
            this.logger.info('Anthropic 适配器已初始化');
        }
        if (config.adapters.google?.apiKey && config.adapters.google.apiKey !== 'your-google-key') {
            const googleAdapter = new GoogleAdapter_1.GoogleAdapter(config.adapters.google);
            this.registerAdapter(googleAdapter);
            this.logger.info('Google 适配器已初始化');
        }
    }
    /**
     * 核心路由：接收意志包 -> 匹配最优适配器 -> 执行 -> 审计 -> 落盘信号
     */
    async route(packet) {
        const startTime = Date.now();
        this.logger.info(`意志传导开始: ${packet.id.substring(0, 8)} | 指纹: ${packet.intent_fingerprint}`);
        // 1. 寻找最优适配器
        const adapter = this.findOptimalAdapter(packet);
        if (!adapter) {
            return this.createErrorResult(packet.id, '无可用适配器', startTime);
        }
        // 2. 寻找最优节点
        const node = await this.findOptimalNode(packet);
        if (!node) {
            return this.createErrorResult(packet.id, '无可用节点', startTime);
        }
        // 3. 握手验证
        const handshake = await ProtocolHandshake_1.ProtocolHandshake.verifyAlignment(packet, node);
        this.eventBus?.emit('handshake', { packetId: packet.id, nodeId: node.id, result: handshake });
        if (!handshake.authorized) {
            if (this.config.enableAutoSwitch) {
                this.logger.warn(`初始节点未授权，尝试自动切换...`);
                const altNode = await this.findAlternativeNode(packet, node.id);
                if (altNode) {
                    return this.routeWithNode(packet, adapter, altNode, startTime);
                }
            }
            return this.createErrorResult(packet.id, `握手失败: ${handshake.errors.join(', ')}`, startTime);
        }
        // 4. 执行意志
        this.activeTasks++;
        try {
            const result = await this.routeWithNode(packet, adapter, node, startTime);
            return result;
        }
        finally {
            this.activeTasks--;
        }
    }
    /**
     * 使用指定节点执行路由
     */
    async routeWithNode(packet, adapter, node, startTime) {
        try {
            this.eventBus?.emit('executionStart', {
                packetId: packet.id,
                adapterId: adapter.agentId,
                nodeId: node.id,
                nodeTier: node.tier
            });
            // 转换意志包
            const prompt = adapter.transform(packet);
            this.eventBus?.emit('promptTransformed', { packetId: packet.id, adapterId: adapter.agentId });
            // 实际调用外部 API
            const response = await this.executeWithAdapter(adapter, prompt, node);
            // 恢复结果
            const recovered = adapter.recover(response);
            this.eventBus?.emit('responseRecovered', { packetId: packet.id, keys: Object.keys(recovered) });
            // IPE 审计
            let auditResult;
            if (this.config.enableAudit) {
                auditResult = await this.performAudit(packet, recovered, node);
                this.eventBus?.emit('auditComplete', { packetId: packet.id, audit: auditResult });
            }
            const executionTime = Date.now() - startTime;
            this.logger.logExecution(packet.id, adapter.agentId, node.id, executionTime);
            // 发出落盘信号
            if (auditResult?.passed && packet.target_file_path && recovered.content) {
                const ingestSignal = {
                    packetId: packet.id,
                    filePath: packet.target_file_path,
                    content: typeof recovered.content === 'string' ? recovered.content : JSON.stringify(recovered.content, null, 2),
                    encoding: 'utf8',
                    backup: true,
                    sourceNodeId: node.id,
                    auditPassed: true,
                    sovereigntyScore: auditResult.sovereigntyScore || 0,
                    zone: packet.deploymentZone
                };
                this.eventBus?.emit('diskIngestSignal', ingestSignal);
                this.logger.info(`已发出落盘信号: ${packet.id.substring(0, 8)} -> ${ingestSignal.filePath}`);
            }
            return {
                success: this.config.enableAudit ? (auditResult?.passed ?? true) : true,
                packetId: packet.id,
                adapterId: adapter.agentId,
                nodeId: node.id,
                response: recovered,
                executionTime,
                auditResult
            };
        }
        catch (error) {
            this.logger.error(`执行失败: ${error.message}`);
            return {
                success: false,
                packetId: packet.id,
                adapterId: adapter.agentId,
                nodeId: node.id,
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }
    /**
     * 使用适配器执行 API 调用
     */
    async executeWithAdapter(adapter, prompt, node) {
        // 检查适配器是否支持直接执行
        if ('execute' in adapter && typeof adapter.execute === 'function') {
            return await this.executeWithTimeout(async () => {
                return await adapter.execute(prompt);
            });
        }
        // 否则使用模拟执行
        return await this.executeWithTimeout(async () => {
            return { status: 'success', output: 'Adapter execute method not implemented' };
        });
    }
    /**
     * 执行并设置超时
     */
    async executeWithTimeout(fn) {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Execution timeout'));
            }, this.config.timeoutMs);
            try {
                const result = await fn();
                clearTimeout(timer);
                resolve(result);
            }
            catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }
    /**
     * 寻找最优适配器
     */
    findOptimalAdapter(packet) {
        const payload = packet.dna_payload.toLowerCase();
        // 策略路由
        if (payload.includes('arena') || payload.includes('adversarial') || payload.includes('audit')) {
            return this.adapters.get('ARENA_CLUSTER');
        }
        if (payload.includes('openai') || payload.includes('gpt')) {
            return this.adapters.get('OPENAI_ADAPTER');
        }
        if (payload.includes('anthropic') || payload.includes('claude')) {
            return this.adapters.get('ANTHROPIC_ADAPTER');
        }
        if (payload.includes('google') || payload.includes('gemini')) {
            return this.adapters.get('GOOGLE_ADAPTER');
        }
        // 默认返回第一个可用适配器
        return this.adapters.values().next().value;
    }
    /**
     * 寻找最优节点
     */
    async findOptimalNode(packet) {
        const availableNodes = this.registry.getAvailableNodes();
        if (availableNodes.length === 0)
            return undefined;
        if (packet.generation_limit === 'AUTO_EVOLVE') {
            const v2Nodes = availableNodes.filter(n => n.tier === 'v2.0' || n.tier === 'vNext');
            if (v2Nodes.length > 0) {
                return this.selectBestBySovereignty(v2Nodes);
            }
        }
        return this.selectBestBySovereignty(availableNodes);
    }
    /**
     * 寻找替代节点
     */
    async findAlternativeNode(packet, excludeId) {
        const availableNodes = this.registry.getAvailableNodes()
            .filter(n => n.id !== excludeId);
        if (availableNodes.length === 0)
            return undefined;
        return this.selectBestBySovereignty(availableNodes);
    }
    /**
     * 按主权完备度选择最佳节点
     */
    selectBestBySovereignty(nodes) {
        return nodes.reduce((best, current) => (current.sovereigntyScore || 0) > (best.sovereigntyScore || 0) ? current : best);
    }
    /**
     * IPE 审计
     */
    async performAudit(packet, response, node) {
        const deviations = [];
        let sovereigntyScore = 100;
        const responseStr = JSON.stringify(response);
        if (responseStr.includes('TEMPLATE') || responseStr.includes('TODO') || responseStr.includes('PLACEHOLDER')) {
            deviations.push('输出包含占位符');
            sovereigntyScore -= 30;
        }
        try {
            if (typeof response === 'string') {
                JSON.parse(response);
            }
        }
        catch {
            deviations.push('输出不是有效 JSON');
            sovereigntyScore -= 40;
        }
        const constraints = packet.constraints;
        if (constraints.includes('STRICT_JSON_OUTPUT') && typeof response !== 'object') {
            deviations.push('违反 STRICT_JSON_OUTPUT 约束');
            sovereigntyScore -= 25;
        }
        const passed = deviations.length === 0 && sovereigntyScore >= 70;
        // --- IPE V2: 安全深度审计 ---
        const securityResult = this.securityAuditor.audit(responseStr);
        if (!securityResult.passed) {
            deviations.push(...securityResult.violations);
            sovereigntyScore = Math.min(sovereigntyScore, securityResult.riskScore);
            this.eventBus?.emitAlert('error', `意志包含恶意指令 (威胁等级: ${securityResult.threatLevel})`);
            this.logger.error(`安全审计未通过 [${packet.id}]: ${securityResult.violations.join(', ')}`);
        }
        else if (securityResult.threatLevel !== 'NONE') {
            this.logger.warn(`安全警示 [${packet.id}]: 发现低风险模式 (${securityResult.threatLevel})`);
        }
        const finalPassed = passed && securityResult.passed;
        this.logger.logAudit(packet.id, finalPassed, sovereigntyScore);
        return {
            passed: finalPassed,
            deviations,
            sovereigntyScore
        };
    }
    /**
     * 创建错误结果
     */
    createErrorResult(packetId, error, startTime) {
        return {
            success: false,
            packetId,
            adapterId: 'NONE',
            nodeId: 'NONE',
            error,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * 获取路由统计
     */
    getStats() {
        return {
            registeredAdapters: Array.from(this.adapters.keys()),
            availableNodes: this.registry.getAvailableNodes().length,
            activeTasks: this.activeTasks,
            config: this.config
        };
    }
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('路由器配置已更新', this.config);
    }
}
exports.NeuralRouter = NeuralRouter;
