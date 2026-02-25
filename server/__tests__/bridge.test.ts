// File: g:/Sovereign-DCCP-Core/server/__tests__/bridge.test.ts
// DCCPBridge 单元测试

import { DCCPBridge } from '../core/DCCPBridge';
import fs from 'fs';
import path from 'path';

describe('DCCPBridge', () => {
  let bridge: DCCPBridge;
  const testDir = path.join(__dirname, '../../test-output');

  beforeEach(() => {
    bridge = new DCCPBridge();
  });

  afterEach(() => {
    // 清理测试文件
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('ingest', () => {
    it('should write file to disk', async () => {
      const result = await bridge.ingest({
        filePath: 'test-output/test.txt',
        content: 'Hello DCCP'
      });

      expect(result.status).toBe('success');
      expect(result.path).toBe('test-output/test.txt');
      
      const fullPath = path.join(__dirname, '../../test-output/test.txt');
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.readFileSync(fullPath, 'utf8')).toBe('Hello DCCP');
    });

    it('should create parent directories automatically', async () => {
      const result = await bridge.ingest({
        filePath: 'test-output/nested/dir/test.ts',
        content: 'export const test = true;'
      });

      expect(result.status).toBe('success');
    });

    it('should reject path traversal', async () => {
      await expect(bridge.ingest({
        filePath: '../../../etc/passwd',
        content: 'malicious'
      })).rejects.toThrow('Path traversal detected');
    });

    it('should reject disallowed file extensions', async () => {
      await expect(bridge.ingest({
        filePath: 'test.exe',
        content: 'malicious'
      })).rejects.toThrow('File extension not allowed');
    });

    it('should allow whitelisted extensions', async () => {
      const extensions = ['.ts', '.js', '.json', '.md', '.tsx', '.jsx'];
      
      for (const ext of extensions) {
        const result = await bridge.ingest({
          filePath: `test-output/file${ext}`,
          content: 'test'
        });
        expect(result.status).toBe('success');
      }
    });

    it('should create backup when enabled', async () => {
      await bridge.ingest({
        filePath: 'test-output/backup-test.txt',
        content: 'original',
        backup: true
      });

      await bridge.ingest({
        filePath: 'test-output/backup-test.txt',
        content: 'modified',
        backup: true
      });

      const backupDir = path.join(__dirname, '../../.dccp/backups');
      expect(fs.existsSync(backupDir)).toBe(true);
    });
  });

  describe('batchIngest', () => {
    it('should ingest multiple files', async () => {
      const results = await bridge.batchIngest([
        { filePath: 'test-output/file1.txt', content: 'content1' },
        { filePath: 'test-output/file2.txt', content: 'content2' },
        { filePath: 'test-output/file3.txt', content: 'content3' }
      ]);

      expect(results.length).toBe(3);
      expect(results.filter(r => r.status === 'success').length).toBe(3);
    });

    it('should handle partial failures', async () => {
      const results = await bridge.batchIngest([
        { filePath: 'test-output/valid.txt', content: 'valid' },
        { filePath: '../../../etc/passwd', content: 'invalid' }
      ]);

      expect(results[0].status).toBe('success');
      expect(results[1].status).toBe('error');
    });
  });
});
