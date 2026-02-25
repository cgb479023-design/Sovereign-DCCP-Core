"use strict";
// File: g:/Sovereign-DCCP-Core/server/adapters/BaseAdapter.ts
// 多态适配器基类 - "跨代际"的关键
// 定义如何将"意志包"翻译成任何 Agent 都能理解的 Payload
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
class BaseAdapter {
    /**
     * DCCP 协议包装器：为 payload 添加协议封套
     */
    wrapProtocol(payload) {
        return `<<DCCP_ENVELOPE_START>>
${payload}
<<DCCP_ENVELOPE_END>>`;
    }
    /**
     * 添加系统指令
     */
    addSystemPrompt(basePrompt, systemInstructions) {
        return `# SYSTEM DIRECTIVES\n${systemInstructions.join('\n')}\n\n# PRIMARY TASK\n${basePrompt}`;
    }
    /**
     * 添加 IPE 约束说明
     */
    embedConstraints(constraints) {
        return `\n\n# IPE CONSTRAINTS (MANDATORY)\n${constraints.map(c => `- ${c}`).join('\n')}`;
    }
    /**
     * 生成请求日志
     */
    logRequest(packet, prompt) {
        console.log(`[${this.agentId}] 📤 请求已转换`);
        console.log(`[${this.agentId}]   Packet ID: ${packet.id.substring(0, 8)}`);
        console.log(`[${this.agentId}]   Fingerprint: ${packet.intent_fingerprint}`);
        console.log(`[${this.agentId}]   Constraints: ${packet.constraints.length}`);
    }
    /**
     * 生成响应日志
     */
    logResponse(result, timeMs) {
        console.log(`[${this.agentId}] 📥 响应已提取 (${timeMs}ms)`);
        if (result && typeof result === 'object') {
            console.log(`[${this.agentId}]   Keys: ${Object.keys(result).join(', ')}`);
        }
    }
    /**
     * 安全执行适配器方法
     */
    async safeExecute(packet) {
        const startTime = Date.now();
        try {
            // 预处理
            const processedPacket = this.preprocess ? this.preprocess(packet) : packet;
            // 转换
            const prompt = this.transform(processedPacket);
            this.logRequest(processedPacket, prompt);
            // TODO: 在子类中实现实际的 API 调用
            // 这里返回转换后的 prompt，实际请求由子类处理
            const processingTime = Date.now() - startTime;
            return {
                success: true,
                data: { prompt },
                metadata: {
                    adapterId: this.agentId,
                    processingTime
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                metadata: {
                    adapterId: this.agentId,
                    processingTime: Date.now() - startTime
                }
            };
        }
    }
}
exports.BaseAdapter = BaseAdapter;
