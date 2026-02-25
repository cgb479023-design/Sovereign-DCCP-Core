"use strict";
// File: g:/Sovereign-DCCP-Core/server/adapters/OpenAIAdapter.ts
// OpenAI 适配器 - 支持 GPT-4o, GPT-4, GPT-3.5
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
const BaseAdapter_1 = require("./BaseAdapter");
class OpenAIAdapter extends BaseAdapter_1.BaseAdapter {
    constructor(config) {
        super();
        this.agentId = 'OPENAI_ADAPTER';
        this.provider = 'OPENAI';
        this.defaultModel = 'gpt-4o';
        this.config = {
            apiKey: config.apiKey,
            baseURL: config.baseURL || 'https://api.openai.com/v1',
            defaultModel: config.defaultModel || this.defaultModel
        };
    }
    /**
     * 意志转译：转化为 OpenAI API 格式
     */
    transform(packet) {
        const systemPrompt = this.addSystemPrompt(packet.dna_payload, [
            'You are a Stateless Computing Node operating under DCCP Protocol.',
            'Your output must be precise, accurate, and follow the IPE constraints.',
            'Never include placeholders, TODO comments, or unfinished code.',
            'The Sovereignty of the User\'s Will is absolute.'
        ]);
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
    recover(rawResponse) {
        // 处理 OpenAI API 响应格式
        if (rawResponse.choices && rawResponse.choices.length > 0) {
            const content = rawResponse.choices[0].message?.content;
            if (content) {
                try {
                    return JSON.parse(content);
                }
                catch {
                    return { text: content };
                }
            }
        }
        // 如果是字符串，尝试解析
        if (typeof rawResponse === 'string') {
            try {
                return JSON.parse(rawResponse);
            }
            catch {
                return { text: rawResponse };
            }
        }
        return rawResponse;
    }
    /**
     * 执行 API 调用
     */
    async execute(prompt) {
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
    async *executeStream(prompt) {
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
            if (done)
                break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
                const data = line.slice(6);
                if (data === '[DONE]')
                    return;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content)
                        yield content;
                }
                catch { }
            }
        }
    }
    /**
     * 获取模型列表
     */
    async getModels() {
        const response = await fetch(`${this.config.baseURL}/models`, {
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status}`);
        }
        const data = await response.json();
        return data.data?.map((m) => m.id) || [];
    }
}
exports.OpenAIAdapter = OpenAIAdapter;
