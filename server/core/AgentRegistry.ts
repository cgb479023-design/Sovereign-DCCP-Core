// File: g:/Sovereign-DCCP-Core/server/core/AgentRegistry.ts
// 算力节点注册中心 - 管理所有接入的算力资源
// 追踪"代际"与"主权完备度"

export type AgentProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'ARENA' | 'CUSTOM';
export type AgentTier = 'v1.5' | 'v2.0' | 'vNext';
export type AgentType = 'API' | 'WEB_GHOST';

export interface AgentConfig {
  id: string;
  provider: AgentProvider;
  tier: AgentTier;
  type: AgentType;
  endpoint?: string;
  capabilities?: string[];
  maxTokens?: number;
  status?: 'active' | 'dormant' | 'offline';
  lastSeen?: number;
  sovereigntyScore?: number; // 主权完备度 0-100
}

export interface RegistryStats {
  totalNodes: number;
  activeNodes: number;
  byProvider: Record<AgentProvider, number>;
  byTier: Record<AgentTier, number>;
  averageSovereigntyScore: number;
}

export class AgentRegistry {
  private nodes: Map<string, AgentConfig> = new Map();
  private readonly sovereigntyThresholds: Record<AgentTier, number> = {
    'v1.5': 50,
    'v2.0': 75,
    'vNext': 90
  };

  /**
   * 注册新节点
   */
  public registerNode(config: AgentConfig): AgentConfig {
    const node: AgentConfig = {
      ...config,
      status: 'active',
      lastSeen: Date.now(),
      sovereigntyScore: this.calculateSovereigntyScore(config),
      capabilities: config.capabilities || ['text_generation'],
      maxTokens: config.maxTokens || 4096
    };

    this.nodes.set(config.id, node);
    console.log(`[DCCP-Registry] 🛰️ 节点接入成功: ${config.id} (${config.provider})`);
    console.log(`[DCCP-Registry]   代际: ${config.tier} | 主权完备度: ${node.sovereigntyScore}%`);
    
    return node;
  }

  /**
   * 注销节点
   */
  public unregisterNode(id: string): boolean {
    const removed = this.nodes.delete(id);
    if (removed) {
      console.log(`[DCCP-Registry] ❌ 节点注销: ${id}`);
    }
    return removed;
  }

  /**
   * 获取所有可用节点
   */
  public getAvailableNodes(): AgentConfig[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'active');
  }

  /**
   * 获取指定节点
   */
  public getNode(id: string): AgentConfig | undefined {
    return this.nodes.get(id);
  }

  /**
   * 按 Provider 筛选节点
   */
  public getNodesByProvider(provider: AgentProvider): AgentConfig[] {
    return this.getAvailableNodes().filter(n => n.provider === provider);
  }

  /**
   * 按代际筛选节点
   */
  public getNodesByTier(tier: AgentTier): AgentConfig[] {
    return this.getAvailableNodes().filter(n => n.tier === tier);
  }

  /**
   * 过滤满足主权完备度要求的节点
   */
  public getSovereignNodes(tier: AgentTier): AgentConfig[] {
    const threshold = this.sovereigntyThresholds[tier];
    return this.getAvailableNodes().filter(
      n => n.tier === tier && (n.sovereigntyScore || 0) >= threshold
    );
  }

  /**
   * 心跳：更新节点最后活跃时间
   */
  public heartbeat(id: string): boolean {
    const node = this.nodes.get(id);
    if (node) {
      node.lastSeen = Date.now();
      node.status = 'active';
      return true;
    }
    return false;
  }

  /**
   * 设置节点状态
   */
  public setNodeStatus(id: string, status: 'active' | 'dormant' | 'offline'): boolean {
    const node = this.nodes.get(id);
    if (node) {
      node.status = status;
      return true;
    }
    return false;
  }

  /**
   * 获取注册中心统计信息
   */
  public getStats(): RegistryStats {
    const allNodes = Array.from(this.nodes.values());
    const activeNodes = allNodes.filter(n => n.status === 'active');

    const byProvider = {} as Record<AgentProvider, number>;
    const byTier = {} as Record<AgentTier, number>;

    activeNodes.forEach(n => {
      byProvider[n.provider] = (byProvider[n.provider] || 0) + 1;
      byTier[n.tier] = (byTier[n.tier] || 0) + 1;
    });

    const avgScore = activeNodes.length > 0
      ? activeNodes.reduce((sum, n) => sum + (n.sovereigntyScore || 0), 0) / activeNodes.length
      : 0;

    return {
      totalNodes: allNodes.length,
      activeNodes: activeNodes.length,
      byProvider,
      byTier,
      averageSovereigntyScore: Math.round(avgScore)
    };
  }

  /**
   * 计算节点主权完备度
   */
  private calculateSovereigntyScore(config: AgentConfig): number {
    let score = 50; // 基础分

    // 代际加成
    if (config.tier === 'v2.0') score += 20;
    if (config.tier === 'vNext') score += 35;

    // 能力加成
    if (config.capabilities?.includes('json_mode')) score += 5;
    if (config.capabilities?.includes('function_calling')) score += 5;
    if (config.capabilities?.includes('vision')) score += 5;

    // 类型加成
    if (config.type === 'WEB_GHOST') score += 10; // 网页自动化更高

    return Math.min(score, 100);
  }

  /**
   * 清理不活跃节点 (超过 5 分钟)
   */
  public cleanupInactive(timeoutMs: number = 300000): number {
    const now = Date.now();
    let cleaned = 0;
    
    this.nodes.forEach((node, id) => {
      if (node.status === 'active' && node.lastSeen && (now - node.lastSeen) > timeoutMs) {
        node.status = 'offline';
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[DCCP-Registry] 🧹 清理了 ${cleaned} 个不活跃节点`);
    }
    
    return cleaned;
  }
}
