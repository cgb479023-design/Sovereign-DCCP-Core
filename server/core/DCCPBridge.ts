// File: g:/Sovereign-DCCP-Core/server/core/DCCPBridge.ts
// DCCP 物理接驳桥：从"云端"到"实体"
// 打破 Web 页面与本地文件系统之间的"次元壁"

import fs from 'fs';
import path from 'path';
import { getConfig } from './config';

export type DeploymentZone = 'STAGING' | 'PRODUCTION';

export interface IngestPayload {
  filePath: string;
  content: string;
  encoding?: BufferEncoding;
  backup?: boolean;
  zone?: DeploymentZone;
}

export interface IngestResult {
  status: 'success' | 'error';
  path: string;
  size?: number;
  timestamp?: number;
}

export class DCCPBridge {
  private readonly rootDir: string;
  private readonly allowedExtensions: string[];

  constructor() {
    // 锁定根目录，防止 Agent 幻觉导致路径越权
    this.rootDir = path.resolve(__dirname, '../../');
    // 允许的文件扩展名白名单
    this.allowedExtensions = ['.ts', '.js', '.json', '.md', '.txt', '.yaml', '.yml', '.css', '.html'];
  }

  /**
   * 物理落盘：将从 Web 端截获的代码写入硬盘
   * 实现意志的瞬时物理实体化
   */
  public async ingest(payload: IngestPayload): Promise<IngestResult> {
    const zone = payload.zone || 'STAGING';
    console.log(`[DCCP-BRIDGE] 🏗️ 准备物化 [Zone: ${zone}]: ${payload.filePath}`);

    try {
      // 1. 安全校验：防止路径穿越攻击
      const absolutePath = this.sanitizePath(payload.filePath);

      // 2. 扩展名白名单检查
      if (!this.isAllowedExtension(absolutePath)) {
        throw new Error(`File extension not allowed: ${path.extname(absolutePath)}`);
      }

      const directory = path.dirname(absolutePath);

      // 3. 自动创建不存在的目录 (异步非阻塞)
      if (!fs.existsSync(directory)) {
        await fs.promises.mkdir(directory, { recursive: true });
      }

      // 4. 可选：备份现有文件
      if (payload.backup && fs.existsSync(absolutePath)) {
        await this.createBackup(absolutePath);
      }

      // 5. 原子性写入文件 (Atomic Write-Temp-Then-Rename)
      const encoding = payload.encoding || 'utf8';
      const tempPath = `${absolutePath}.dccp.tmp.${Date.now()}`;

      // 先异步写入临时文件
      await fs.promises.writeFile(tempPath, payload.content, encoding);
      // 然后原子性重命名为目标文件，切除并发覆写风险
      await fs.promises.rename(tempPath, absolutePath);

      // 6. 如果是生产环境，触发模拟 Git 部署流
      if (zone === 'PRODUCTION') {
        await this.simulateGitDeploy(payload.filePath);
      }

      const stats = fs.statSync(absolutePath);
      console.log(`[DCCP-BRIDGE] ✅ 物化完成: ${payload.filePath} (${stats.size} bytes)`);

      return {
        status: 'success',
        path: payload.filePath,
        size: stats.size,
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error(`[DCCP-BRIDGE] ❌ 物化失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 模拟 Git 部署流 (Production 专用)
   */
  private async simulateGitDeploy(filePath: string): Promise<void> {
    console.log(`[GIT-DEPLOY] 📥 Initializing Sovereign Commit for ${filePath}...`);
    await new Promise(r => setTimeout(r, 800)); // 模拟网络延迟
    console.log(`[GIT-DEPLOY] 🛠️ Creating delta patch...`);
    await new Promise(r => setTimeout(r, 500));
    console.log(`[GIT-DEPLOY] 🚀 Pushed to High-Availability Cluster: SUCCESS`);
  }

  /**
   * 批量落盘：同时写入多个文件
   */
  public async batchIngest(payloads: IngestPayload[]): Promise<IngestResult[]> {
    console.log(`[DCCP-BRIDGE] 📦 开始批量落盘: ${payloads.length} 个文件...`);

    const results: IngestResult[] = [];
    for (const payload of payloads) {
      try {
        const result = await this.ingest(payload);
        results.push(result);
      } catch (error: any) {
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
  private sanitizePath(inputPath: string): string {
    // 规范化路径
    const normalized = path.normalize(inputPath);

    // 移除路径开头的 / 或 \，确保是相对路径
    const relativePath = normalized.replace(/^[\/\\]/, '');

    // 解析为绝对路径
    const absolutePath = path.join(this.rootDir, relativePath);

    // 校验：确保最终路径在 rootDir 内
    if (!absolutePath.startsWith(this.rootDir)) {
      throw new Error(`Path traversal detected: ${inputPath}`);
    }

    return absolutePath;
  }

  /**
   * 扩展名白名单检查
   */
  private isAllowedExtension(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.allowedExtensions.includes(ext);
  }

  /**
   * 创建文件备份
   */
  private async createBackup(filePath: string): Promise<void> {
    let backupDir: string;
    try {
      const config = getConfig();
      backupDir = path.join(this.rootDir, config.bridge.backupDir);
    } catch {
      backupDir = path.join(this.rootDir, '.dccp/backups');
    }

    if (!fs.existsSync(backupDir)) {
      await fs.promises.mkdir(backupDir, { recursive: true });
    }

    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);

    await fs.promises.copyFile(filePath, backupPath);
    console.log(`[DCCP-BRIDGE] 💾 备份创建 (异步): ${backupPath}`);
  }

  /**
   * 清理过期备份文件
   * @param maxAgeDays 保留天数，默认7天
   */
  public cleanupBackups(maxAgeDays?: number): number {
    let backupDir: string;
    let maxAge: number;

    try {
      const config = getConfig();
      backupDir = path.join(this.rootDir, config.bridge.backupDir);
      maxAge = maxAgeDays ?? config.bridge.backupMaxAge;
    } catch {
      backupDir = path.join(this.rootDir, '.dccp/backups');
      maxAge = maxAgeDays ?? 7;
    }

    if (!fs.existsSync(backupDir)) {
      return 0;
    }

    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleanedCount = 0;

    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      if (!file.endsWith('.bak')) continue;

      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
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
  public listBackups(): { file: string; size: number; modified: Date }[] {
    let backupDir: string;

    try {
      const config = getConfig();
      backupDir = path.join(this.rootDir, config.bridge.backupDir);
    } catch {
      backupDir = path.join(this.rootDir, '.dccp/backups');
    }

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    return fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.bak'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          file: f,
          size: stats.size,
          modified: stats.mtime
        };
      });
  }
}
