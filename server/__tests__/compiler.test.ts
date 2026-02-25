// File: g:/Sovereign-DCCP-Core/server/__tests__/compiler.test.ts
// DCCPCompiler 单元测试

import { DCCPCompiler, DCCPPacket } from '../core/compiler';

describe('DCCPCompiler', () => {
  let compiler: DCCPCompiler;

  beforeEach(() => {
    compiler = new DCCPCompiler();
  });

  describe('compile', () => {
    it('should create a valid DCCPPacket', () => {
      const packet = compiler.compile('Test intent', 'v2.0');
      
      expect(packet).toBeDefined();
      expect(packet.id).toBeDefined();
      expect(packet.timestamp).toBeDefined();
      expect(packet.intent_fingerprint).toBeDefined();
      expect(packet.dna_payload).toContain('Test intent');
      expect(packet.constraints).toEqual(expect.arrayContaining([
        '1.5S_PHYSICAL_HOOK',
        'ZERO_PLACEHOLDER_POLICY',
        'STRICT_JSON_OUTPUT'
      ]));
    });

    it('should set generation_limit based on agent tier', () => {
      const v15Packet = compiler.compile('Test', 'v1.5');
      const v20Packet = compiler.compile('Test', 'v2.0');
      const vNextPacket = compiler.compile('Test', 'vNext');
      
      expect(v15Packet.generation_limit).toBe('STRICT_CONTEXT');
      expect(v20Packet.generation_limit).toBe('AUTO_EVOLVE');
      expect(vNextPacket.generation_limit).toBe('AUTO_EVOLVE');
    });

    it('should include DCCP protocol envelope', () => {
      const packet = compiler.compile('Test intent', 'v2.0');
      
      expect(packet.dna_payload).toContain('DCCP PROTOCOL v1.0');
      expect(packet.dna_payload).toContain('SOVEREIGN DIRECTIVE');
      expect(packet.dna_payload).toContain('ARCHITECTURAL INJUNCTION');
    });

    it('should generate unique IDs for each packet', () => {
      const packet1 = compiler.compile('Test', 'v2.0');
      const packet2 = compiler.compile('Test', 'v2.0');
      
      expect(packet1.id).not.toBe(packet2.id);
    });
  });

  describe('intent fingerprint', () => {
    it('should generate consistent fingerprint for same intent', () => {
      const packet1 = compiler.compile('Hello World', 'v2.0');
      const packet2 = compiler.compile('Hello World', 'v2.0');
      
      expect(packet1.intent_fingerprint).toBe(packet2.intent_fingerprint);
    });

    it('should generate different fingerprint for different intents', () => {
      const packet1 = compiler.compile('Hello', 'v2.0');
      const packet2 = compiler.compile('World', 'v2.0');
      
      expect(packet1.intent_fingerprint).not.toBe(packet2.intent_fingerprint);
    });
  });
});
