// File: g:/Sovereign-DCCP-Core/server/adapters/OpenAIAdapter.ts
// OpenAI 适配器 - 支持 GPT-4o, GPT-4, GPT-3.5

import { BaseAdapter, AdapterResponse } from './BaseAdapter';
import { DCCPPacket } from '../core/compiler';

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

export class OpenAIAdapter extends BaseAdapter {
  readonly agentId = 'OPENAI_ADAPTER';
  readonly provider = 'OPENAI';

  private config: OpenAIConfig;
  private defaultModel = 'gpt-4o';

  constructor(config: OpenAIConfig) {
    super();
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      defaultModel: config.defaultModel || this.defaultModel
    };
  }

  /**
   * 意志转译：转化为 OpenAI API 格式
   */
  public transform(packet: DCCPPacket): string {
    const systemPrompt = this.addSystemPrompt(
      packet.dna_payload,
      [
        'You are a Stateless Computing Node operating under DCCP Protocol.',
        'Your output must be precise, accurate, and follow the IPE constraints.',
        'Never include placeholders, TODO comments, or unfinished code.',
        'The Sovereignty of the User\'s Will is absolute.'
      ]
    );

    const constraintEmbed = this.embedConstraints(packet.constraints);

    return JSON.stringify({
      model: this.config.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${packet.intent_fingerprint}\n\n${packet.dna_payload}${constraintEmbed}` }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });
  }

  /**
   * 结果提取：从 OpenAI 响应中提取内容
   */
  public recover(rawResponse: any): any {
    // 处理 OpenAI API 响应格式
    if (rawResponse.choices && rawResponse.choices.length > 0) {
      const content = rawResponse.choices[0].message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return { text: content };
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

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * 流式执行 (用于长输出)
   */
  public async *executeStream(prompt: string): AsyncGenerator<string> {
    const requestBody = JSON.parse(prompt);
    requestBody.stream = true;

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI API Error: ${response.status}`);
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
          const parsed = JSON.parse(data) as any;
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch { }
      }
    }
  }

  /**
   * 获取模型列表
   */
  public async getModels(): Promise<string[]> {
    const response = await fetch(`${this.config.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.data?.map((m: any) => m.id) || [];
  }
}
