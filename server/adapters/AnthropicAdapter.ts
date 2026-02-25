// File: g:/Sovereign-DCCP-Core/server/adapters/AnthropicAdapter.ts
// Anthropic 适配器 - 支持 Claude 3.5, Claude 3, Claude 2

import { BaseAdapter, AdapterResponse } from './BaseAdapter';
import { DCCPPacket } from '../core/compiler';

export interface AnthropicConfig {
  apiKey: string;
  defaultModel?: string;
}

export class AnthropicAdapter extends BaseAdapter {
  readonly agentId = 'ANTHROPIC_ADAPTER';
  readonly provider = 'ANTHROPIC';

  private config: AnthropicConfig;
  private defaultModel = 'claude-sonnet-4-20250514';

  constructor(config: AnthropicConfig) {
    super();
    this.config = {
      apiKey: config.apiKey,
      defaultModel: config.defaultModel || this.defaultModel
    };
  }

  /**
   * 意志转译：转化为 Anthropic API 格式
   */
  public transform(packet: DCCPPacket): string {
    const systemPrompt = `
You are a Stateless Computing Node operating under DCCP Protocol.
Your output must be precise, accurate, and follow the IPE constraints.
Never include placeholders, TODO comments, or unfinished code.
The Sovereignty of the User's Will is absolute.

IPE CONSTRAINTS:
${packet.constraints.map(c => `- ${c}`).join('\n')}
`.trim();

    const constraintEmbed = this.embedConstraints(packet.constraints);

    return JSON.stringify({
      model: this.config.defaultModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `[INTENT_FINGERPRINT: ${packet.intent_fingerprint}]\n\n${packet.dna_payload}${constraintEmbed}`
        }
      ],
      temperature: 0.7,
      stream: false
    });
  }

  /**
   * 结果提取：从 Anthropic 响应中提取内容
   */
  public recover(rawResponse: any): any {
    // 处理 Anthropic API 响应格式
    if (rawResponse.content && Array.isArray(rawResponse.content)) {
      const textBlocks = rawResponse.content.filter((c: any) => c.type === 'text');
      if (textBlocks.length > 0) {
        const text = textBlocks[0].text;
        try {
          return JSON.parse(text);
        } catch {
          return { text };
        }
      }
    }

    // 如果是字符串，尝试解析
    if (typeof rawResponse === 'string') {
      try {
        return JSON.parse(rawResponse);
      } catch {
        return { text: rawResponse };
      }
    }

    return rawResponse;
  }

  /**
   * 执行 API 调用
   */
  public async execute(prompt: string): Promise<any> {
    const requestBody = JSON.parse(prompt);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * 流式执行
   */
  public async *executeStream(prompt: string): AsyncGenerator<string> {
    const requestBody = JSON.parse(prompt);
    requestBody.stream = true;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic API Error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.delta?.text;
          if (content) yield content;
        } catch { }
      }
    }
  }

  /**
   * 获取可用模型
   */
  public getAvailableModels(): string[] {
    return [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20240307',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }
}
