"use strict";
// File: g:/Sovereign-DCCP-Core/server/core/ProtocolHandshake.ts
// 契约握手协议 - 在分发指令前确保 Agent "屈服"于意志契约
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolHandshake = void 0;
class ProtocolHandshake {
    /**
     * 意志对齐检查 - 核心握手方法
     * 验证 Agent 是否准备好接受并正确执行 DCCP 意志包
     */
    static async verifyAlignment(packet, node) {
        console.log(`[DCCP-Handshake] 🔗 正在验证意志对齐: Will ${packet.id.substring(0, 8)} -> Node ${node.id}`);
        const warnings = [];
        const errors = [];
        let alignmentScore = 100;
        // 1. 代际能力检查
        const capabilityCheck = this.checkCapabilities(packet, node, warnings, errors);
        alignmentScore -= capabilityCheck.penalty;
        // 2. 约束兼容性检查
        const constraintCheck = this.checkConstraints(packet, node, warnings, errors);
        alignmentScore -= constraintCheck.penalty;
        // 3. 生成限制检查
        const limitCheck = this.checkGenerationLimit(packet, node, warnings, errors);
        alignmentScore -= limitCheck.penalty;
        // 4. 节点状态检查
        if (node.status !== 'active') {
            errors.push(`节点状态异常: ${node.status}`);
            alignmentScore -= 30;
        }
        // 5. 主权完备度检查
        if ((node.sovereigntyScore || 0) < 50) {
            warnings.push(`节点主权完备度过低: ${node.sovereigntyScore}%`);
            alignmentScore -= 20;
        }
        // 计算最终结果
        alignmentScore = Math.max(0, Math.min(100, alignmentScore));
        const success = errors.length === 0 && alignmentScore >= 50;
        const authorized = alignmentScore >= 70;
        let recommendedAction = 'PROCEED';
        if (!authorized) {
            recommendedAction = 'BLOCK';
        }
        else if (warnings.length > 0) {
            recommendedAction = 'WARN';
        }
        // 输出日志
        this.logResult(packet, node, { success, authorized, alignmentScore, recommendedAction });
        return {
            success,
            authorized,
            warnings,
            errors,
            alignmentScore,
            recommendedAction
        };
    }
    /**
     * 批量握手检查
     */
    static async verifyBatch(packet, nodes) {
        const results = new Map();
        for (const node of nodes) {
            const result = await this.verifyAlignment(packet, node);
            results.set(node.id, result);
        }
        // 排序找到最佳节点
        const sortedNodes = Array.from(results.entries())
            .sort((a, b) => b[1].alignmentScore - a[1].alignmentScore);
        console.log(`[DCCP-Handshake] 📊 批量握手完成，最佳匹配: ${sortedNodes[0]?.[0]}`);
        return results;
    }
    /**
     * 检查 Agent 能力是否满足需求
     */
    static checkCapabilities(packet, node, warnings, errors) {
        const requiredCapabilities = this.determineRequiredCapabilities(packet);
        const nodeCapabilities = node.capabilities || [];
        const missingCapabilities = requiredCapabilities.filter(c => !nodeCapabilities.includes(c));
        let penalty = 0;
        if (missingCapabilities.length > 0) {
            // 关键能力缺失
            const criticalMissing = missingCapabilities.filter(c => ['json_mode', 'function_calling'].includes(c));
            if (criticalMissing.length > 0) {
                errors.push(`缺少关键能力: ${criticalMissing.join(', ')}`);
                penalty += 40;
            }
            else {
                warnings.push(`缺少可选能力: ${missingCapabilities.join(', ')}`);
                penalty += 10;
            }
        }
        return { penalty };
    }
    /**
     * 检查约束兼容性
     */
    static checkConstraints(packet, node, warnings, errors) {
        let penalty = 0;
        // 检查 IPE 规则是否被节点支持
        const strictConstraints = packet.constraints.filter(c => c.includes('STRICT') || c.includes('ZERO_PLACEHOLDER'));
        if (strictConstraints.length > 0 && node.tier === 'v1.5') {
            warnings.push(`v1.5 节点执行严格约束可能性能不佳`);
            penalty += 15;
        }
        return { penalty };
    }
    /**
     * 检查生成限制兼容性
     */
    static checkGenerationLimit(packet, node, warnings, errors) {
        const forbidden = this.forbiddenGenerationLimits[node.tier] || [];
        let penalty = 0;
        if (forbidden.includes(packet.generation_limit)) {
            errors.push(`代际限制 ${packet.generation_limit} 不允许在 ${node.tier} 节点执行`);
            penalty += 50;
        }
        // v1.5 处理 AUTO_EVOLVE 时警告
        if (node.tier === 'v1.5' && packet.generation_limit === 'AUTO_EVOLVE') {
            warnings.push('警告：v1.5 节点处理 AUTO_EVOLVE 可能导致意志偏离');
            penalty += 10;
        }
        return { penalty };
    }
    /**
     * 根据数据包确定所需能力
     */
    static determineRequiredCapabilities(packet) {
        const capabilities = ['text_generation'];
        const payload = packet.dna_payload.toLowerCase();
        if (packet.constraints.includes('STRICT_JSON_OUTPUT') || payload.includes('json')) {
            capabilities.push('json_mode');
        }
        if (payload.includes('function') || payload.includes('tool')) {
            capabilities.push('function_calling');
        }
        if (payload.includes('image') || payload.includes('vision')) {
            capabilities.push('vision');
        }
        if (packet.generation_limit === 'AUTO_EVOLVE') {
            capabilities.push('auto_evolve');
        }
        return capabilities;
    }
    /**
     * 记录握手结果
     */
    static logResult(packet, node, result) {
        const icon = result.authorized ? '✅' : '❌';
        console.log(`[DCCP-Handshake] ${icon} 握手完成`);
        console.log(`[DCCP-Handshake]   节点: ${node.id} (${node.tier})`);
        console.log(`[DCCP-Handshake]   对齐分: ${result.alignmentScore}/100`);
        console.log(`[DCCP-Handshake]   建议: ${result.recommendedAction}`);
    }
}
exports.ProtocolHandshake = ProtocolHandshake;
ProtocolHandshake.tierCapabilities = {
    'v1.5': ['text_generation', 'basic_json'],
    'v2.0': ['text_generation', 'json_mode', 'function_calling', 'vision'],
    'vNext': ['text_generation', 'json_mode', 'function_calling', 'vision', 'agents', 'auto_evolve']
};
ProtocolHandshake.forbiddenGenerationLimits = {
    'v1.5': ['AUTO_EVOLVE'],
    'v2.0': [],
    'vNext': []
};
