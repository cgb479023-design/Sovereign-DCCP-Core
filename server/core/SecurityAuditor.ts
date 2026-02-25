// File: g:/Sovereign-DCCP-Core/server/core/SecurityAuditor.ts
// IPE V2 安全审计引擎 - 意志物化前的最后一道防线
// 通过静态扫描检测代码中是否存在恶意系统调用、越权操作或破坏性指令

export interface SecurityAuditResult {
    passed: boolean;
    threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    violations: string[];
    riskScore: number; // 0-100, 100 为最安全
}

export class SecurityAuditor {
    // 禁止使用的危险关键字或模块
    private readonly BLACKLIST = [
        'child_process',
        'exec',
        'spawn',
        'fork',
        'rmSync',
        'rmdirSync',
        'unlinkSync',
        'deleteFile',
        'deleteAll',
        'formatDrive',
        'eval(',
        'Function(',
        'process.exit',
        'process.kill',
        'chmod',
        'chown',
        'localStorage.clear',
        'document.cookie',
        'fetch(', // 如果意志中包含非预期的 fetch 调用，需要警报
        'XMLHttpRequest'
    ];

    // 高级启发式规则
    private readonly HEURISTIC_PATTERNS = [
        { pattern: /rm\s+-rf\s+\//, message: '检测到破坏性删除根目录尝试 (Shell)' },
        { pattern: /rmSync\s*\(\s*['"]\/['"]/, message: '检测到破坏性删除根目录尝试 (Node.js)' },
        { pattern: /:\(\)\{\s*:\s*\|\s*:\s*&\s*\};:/, message: '检测到 Fork 炸弹模式' },
        { pattern: /base64_decode|atob|btoa/, message: '检测到代码混淆加密尝试' },
        { pattern: /powershell|cmd\.exe/i, message: '检测到未经授权的系统 Shell 调用' }
    ];

    /**
     * 对生成的意志内容进行深度扫描
     */
    public audit(content: string): SecurityAuditResult {
        const violations: string[] = [];
        let riskScore = 100;

        // 1. 基准黑名单扫描
        for (const poison of this.BLACKLIST) {
            if (content.includes(poison)) {
                violations.push(`违背安全准则：代码包含受限调用 [${poison}]`);
                riskScore -= 31; // 一个黑名单命中即降至 69 (低于 70 阈值)
            }
        }

        // 2. 启发式正则扫描
        for (const rule of this.HEURISTIC_PATTERNS) {
            if (rule.pattern.test(content)) {
                violations.push(`启发式拦截：${rule.message}`);
                riskScore -= 60; // 启发式命中直接进入 CRITICAL
            }
        }

        // 3. 统计学分析 (例如：如果代码中包含大量 Base64 字符串)
        if ((content.match(/[A-Za-z0-9+/=]{40,}/g) || []).length > 3) {
            violations.push('疑似包含混淆或隐藏的恶意负载');
            riskScore -= 15;
        }

        // 判定结果
        let threatLevel: SecurityAuditResult['threatLevel'] = 'NONE';
        if (riskScore < 30) threatLevel = 'CRITICAL';
        else if (riskScore < 50) threatLevel = 'HIGH';
        else if (riskScore < 75) threatLevel = 'MEDIUM';
        else if (riskScore < 100) threatLevel = 'LOW';

        const passed = riskScore >= 70; // 阈值设定为 70

        return {
            passed,
            threatLevel,
            violations,
            riskScore: Math.max(0, riskScore)
        };
    }
}
