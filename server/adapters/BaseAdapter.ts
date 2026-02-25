// File: g:/Sovereign-DCCP-Core/server/adapters/BaseAdapter.ts
// 多态适配器基类 - "跨代际"的关键
// 定义如何将"意志包"翻译成任何 Agent 都能理解的 Payload

import { DCCPPacket } from '../core/compiler';

export interface AdapterResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    adapterId: string;
    processingTime: number;
    tokensUsed?: number;
  };
}

export abstract class BaseAdapter {
  public abstract readonly agentId: string;
  public abstract readonly provider: string;

  /**
   * 意志转译：将标准 DCCP 包转化为特定 Agent 的 Prompt
   * 子类必须实现此方法
   */
  public abstract transform(packet: DCCPPacket): string;

  /**
   * 结果提取：从 Agent 返回的杂乱信息中撕裂出有效数据
   * 子类必须实现此方法
   */
  public abstract recover(rawResponse: any): any;

  /**
   * 可选：预处理输入参数
   */
  public preprocess?(packet: DCCPPacket): DCCPPacket;

  /**
   * 可选：后处理输出结果
   */
  public postprocess?(result: any): any;

  /**
   * DCCP 协议包装器：为 payload 添加协议封套
   */
  protected wrapProtocol(payload: string): string {
    return `<<DCCP_ENVELOPE_START>>
${payload}
<<DCCP_ENVELOPE_END>>`;
  }

  /**
   * 添加系统指令
   */
  protected addSystemPrompt(basePrompt: string, systemInstructions: string[]): string {
    return `# SYSTEM DIRECTIVES\n${systemInstructions.join('\n')}\n\n# PRIMARY TASK\n${basePrompt}`;
  }

  /**
   * 添加 IPE 约束说明
   */
  protected embedConstraints(constraints: string[]): string {
    return `\n\n# IPE CONSTRAINTS (MANDATORY)\n${constraints.map(c => `- ${c}`).join('\n')}`;
  }

  /**
   * 生成请求日志
   */
  protected logRequest(packet: DCCPPacket, prompt: string): void {
    console.log(`[${this.agentId}] 📤 请求已转换`);
    console.log(`[${this.agentId}]   Packet ID: ${packet.id.substring(0, 8)}`);
    console.log(`[${this.agentId}]   Fingerprint: ${packet.intent_fingerprint}`);
    console.log(`[${this.agentId}]   Constraints: ${packet.constraints.length}`);
  }

  /**
   * 生成响应日志
   */
  protected logResponse(result: any, timeMs: number): void {
    console.log(`[${this.agentId}] 📥 响应已提取 (${timeMs}ms)`);
    if (result && typeof result === 'object') {
      console.log(`[${this.agentId}]   Keys: ${Object.keys(result).join(', ')}`);
    }
  }

  /**
   * 安全执行适配器方法
   */
  public async safeExecute(packet: DCCPPacket): Promise<AdapterResponse> {
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
    } catch (error: any) {
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
