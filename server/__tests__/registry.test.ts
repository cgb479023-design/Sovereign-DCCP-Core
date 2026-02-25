// File: g:/Sovereign-DCCP-Core/server/__tests__/registry.test.ts
// AgentRegistry 单元测试

import { AgentRegistry, AgentConfig } from '../core/AgentRegistry';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  describe('registerNode', () => {
    it('should register a new node', () => {
      const config: AgentConfig = {
        id: 'test-node',
        provider: 'OPENAI',
        tier: 'v2.0',
        type: 'API'
      };

      const registered = registry.registerNode(config);
      
      expect(registered.id).toBe('test-node');
      expect(registered.status).toBe('active');
      expect(registered.sovereigntyScore).toBeGreaterThan(0);
    });

    it('should calculate sovereignty score based on tier', () => {
      const v15Config: AgentConfig = { id: 'v15', provider: 'OPENAI', tier: 'v1.5', type: 'API' };
      const v20Config: AgentConfig = { id: 'v20', provider: 'OPENAI', tier: 'v2.0', type: 'API' };
      const vNextConfig: AgentConfig = { id: 'vnext', provider: 'OPENAI', tier: 'vNext', type: 'API' };

      const v15 = registry.registerNode(v15Config);
      const v20 = registry.registerNode(v20Config);
      const vNext = registry.registerNode(vNextConfig);

      expect(v15.sovereigntyScore).toBeLessThan(v20.sovereigntyScore!);
      expect(v20.sovereigntyScore).toBeLessThan(vNext.sovereigntyScore!);
    });

    it('should assign higher score for WEB_GHOST type', () => {
      const apiNode: AgentConfig = { id: 'api', provider: 'OPENAI', tier: 'v2.0', type: 'API' };
      const webNode: AgentConfig = { id: 'web', provider: 'OPENAI', tier: 'v2.0', type: 'WEB_GHOST' };

      const api = registry.registerNode(apiNode);
      const web = registry.registerNode(webNode);

      expect(web.sovereigntyScore!).toBeGreaterThan(api.sovereigntyScore!);
    });
  });

  describe('getAvailableNodes', () => {
    it('should return only active nodes', () => {
      registry.registerNode({ id: 'node1', provider: 'OPENAI', tier: 'v2.0', type: 'API' });
      registry.registerNode({ id: 'node2', provider: 'ANTHROPIC', tier: 'v2.0', type: 'API' });
      
      registry.setNodeStatus('node1', 'offline');
      
      const available = registry.getAvailableNodes();
      
      expect(available.length).toBe(1);
      expect(available[0].id).toBe('node2');
    });
  });

  describe('heartbeat', () => {
    it('should update lastSeen timestamp', () => {
      registry.registerNode({ id: 'test', provider: 'OPENAI', tier: 'v2.0', type: 'API' });
      
      const before = registry.getNode('test')!.lastSeen;
      
      registry.heartbeat('test');
      
      const after = registry.getNode('test')!.lastSeen;
      expect(after).toBeGreaterThan(before!);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      registry.registerNode({ id: 'n1', provider: 'OPENAI', tier: 'v2.0', type: 'API' });
      registry.registerNode({ id: 'n2', provider: 'ANTHROPIC', tier: 'v2.0', type: 'API' });
      registry.registerNode({ id: 'n3', provider: 'GOOGLE', tier: 'v1.5', type: 'API' });

      const stats = registry.getStats();

      expect(stats.totalNodes).toBe(3);
      expect(stats.activeNodes).toBe(3);
      expect(stats.byProvider.OPENAI).toBe(1);
      expect(stats.byProvider.ANTHROPIC).toBe(1);
      expect(stats.byProvider.GOOGLE).toBe(1);
      expect(stats.byTier['v2.0']).toBe(2);
      expect(stats.byTier['v1.5']).toBe(1);
    });
  });
});
