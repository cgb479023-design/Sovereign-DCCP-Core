"use strict";
// File: g:/Sovereign-DCCP-Core/server/core/DCCPBridge.ts
// DCCP 物理接驳桥：从"云端"到"实体"
// 打破 Web 页面与本地文件系统之间的"次元壁"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DCCPBridge = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
class DCCPBridge {
    constructor() {
        // 锁定根目录，防止 Agent 幻觉导致路径越权
        this.rootDir = path_1.default.resolve(__dirname, '../../');
        // 允许的文件扩展名白名单
        this.allowedExtensions = ['.ts', '.js', '.json', '.md', '.txt', '.yaml', '.yml', '.css', '.html'];
    }
    /**
     * 物理落盘：将从 Web 端截获的代码写入硬盘
     * 实现意志的瞬时物理实体化
     */
    async ingest(payload) {
        const zone = payload.zone || 'STAGING';
        console.log(`[DCCP-BRIDGE] 🏗️ 准备物化 [Zone: ${zone}]: ${payload.filePath}`);
        try {
            // 1. 安全校验：防止路径穿越攻击
            const absolutePath = this.sanitizePath(payload.filePath);
            // 2. 扩展名白名单检查
            if (!this.isAllowedExtension(absolutePath)) {
                throw new Error(`File extension not allowed: ${path_1.default.extname(absolutePath)}`);
            }
            const directory = path_1.default.dirname(absolutePath);
            // 3. 自动创建不存在的目录
            if (!fs_1.default.existsSync(directory)) {
                fs_1.default.mkdirSync(directory, { recursive: true });
            }
            // 4. 可选：备份现有文件
            if (payload.backup && fs_1.default.existsSync(absolutePath)) {
                this.createBackup(absolutePath);
            }
            // 5. 写入文件（意志实体化）
            const encoding = payload.encoding || 'utf8';
            fs_1.default.writeFileSync(absolutePath, payload.content, encoding);
            // 6. 如果是生产环境，触发模拟 Git 部署流
            if (zone === 'PRODUCTION') {
                await this.simulateGitDeploy(payload.filePath);
            }
            const stats = fs_1.default.statSync(absolutePath);
            console.log(`[DCCP-BRIDGE] ✅ 物化完成: ${payload.filePath} (${stats.size} bytes)`);
            return {
                status: 'success',
                path: payload.filePath,
                size: stats.size,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error(`[DCCP-BRIDGE] ❌ 物化失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 模拟 Git 部署流 (Production 专用)
     */
    async simulateGitDeploy(filePath) {
        console.log(`[GIT-DEPLOY] 📥 Initializing Sovereign Commit for ${filePath}...`);
        await new Promise(r => setTimeout(r, 800)); // 模拟网络延迟
        console.log(`[GIT-DEPLOY] 🛠️ Creating delta patch...`);
        await new Promise(r => setTimeout(r, 500));
        console.log(`[GIT-DEPLOY] 🚀 Pushed to High-Availability Cluster: SUCCESS`);
    }
    /**
     * 批量落盘：同时写入多个文件
     */
    async batchIngest(payloads) {
        console.log(`[DCCP-BRIDGE] 📦 开始批量落盘: ${payloads.length} 个文件...`);
        const results = [];
        for (const payload of payloads) {
            try {
                const result = await this.ingest(payload);
                results.push(result);
            }
            catch (error) {
                results.push({
                    status: 'error',
                    path: payload.filePath
                });
            }
        }
        const successCount = results.filter(r => r.status === 'success').length;
        console.log(`[DCCP-BRIDGE] ✅ 批量完成: ${successCount}/${payloads.length} 成功`);
        return results;
    }
    /**
     * 安全路径校验：防止 ../ 路径穿越
     */
    sanitizePath(inputPath) {
        // 规范化路径
        const normalized = path_1.default.normalize(inputPath);
        // 移除路径开头的 / 或 \，确保是相对路径
        const relativePath = normalized.replace(/^[\/\\]/, '');
        // 解析为绝对路径
        const absolutePath = path_1.default.join(this.rootDir, relativePath);
        // 校验：确保最终路径在 rootDir 内
        if (!absolutePath.startsWith(this.rootDir)) {
            throw new Error(`Path traversal detected: ${inputPath}`);
        }
        return absolutePath;
    }
    /**
     * 扩展名白名单检查
     */
    isAllowedExtension(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        return this.allowedExtensions.includes(ext);
    }
    /**
     * 创建文件备份
     */
    createBackup(filePath) {
        let backupDir;
        try {
            const config = (0, config_1.getConfig)();
            backupDir = path_1.default.join(this.rootDir, config.bridge.backupDir);
        }
        catch {
            backupDir = path_1.default.join(this.rootDir, '.dccp/backups');
        }
        if (!fs_1.default.existsSync(backupDir)) {
            fs_1.default.mkdirSync(backupDir, { recursive: true });
        }
        const fileName = path_1.default.basename(filePath);
        const timestamp = Date.now();
        const backupPath = path_1.default.join(backupDir, `${fileName}.${timestamp}.bak`);
        fs_1.default.copyFileSync(filePath, backupPath);
        console.log(`[DCCP-BRIDGE] 💾 备份创建: ${backupPath}`);
    }
    /**
     * 清理过期备份文件
     * @param maxAgeDays 保留天数，默认7天
     */
    cleanupBackups(maxAgeDays) {
        let backupDir;
        let maxAge;
        try {
            const config = (0, config_1.getConfig)();
            backupDir = path_1.default.join(this.rootDir, config.bridge.backupDir);
            maxAge = maxAgeDays ?? config.bridge.backupMaxAge;
        }
        catch {
            backupDir = path_1.default.join(this.rootDir, '.dccp/backups');
            maxAge = maxAgeDays ?? 7;
        }
        if (!fs_1.default.existsSync(backupDir)) {
            return 0;
        }
        const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
        const now = Date.now();
        let cleanedCount = 0;
        const files = fs_1.default.readdirSync(backupDir);
        for (const file of files) {
            if (!file.endsWith('.bak'))
                continue;
            const filePath = path_1.default.join(backupDir, file);
            const stats = fs_1.default.statSync(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
                fs_1.default.unlinkSync(filePath);
                cleanedCount++;
                console.log(`[DCCP-BRIDGE] 🧹 清理过期备份: ${file}`);
            }
        }
        if (cleanedCount > 0) {
            console.log(`[DCCP-BRIDGE] ✅ 清理完成: 删除 ${cleanedCount} 个过期备份`);
        }
        return cleanedCount;
    }
    /**
     * 获取备份文件列表
     */
    listBackups() {
        let backupDir;
        try {
            const config = (0, config_1.getConfig)();
            backupDir = path_1.default.join(this.rootDir, config.bridge.backupDir);
        }
        catch {
            backupDir = path_1.default.join(this.rootDir, '.dccp/backups');
        }
        if (!fs_1.default.existsSync(backupDir)) {
            return [];
        }
        return fs_1.default.readdirSync(backupDir)
            .filter(f => f.endsWith('.bak'))
            .map(f => {
            const filePath = path_1.default.join(backupDir, f);
            const stats = fs_1.default.statSync(filePath);
            return {
                file: f,
                size: stats.size,
                modified: stats.mtime
            };
        });
    }
}
exports.DCCPBridge = DCCPBridge;
