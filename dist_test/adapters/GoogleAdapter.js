"use strict";
// File: g:/Sovereign-DCCP-Core/server/adapters/GoogleAdapter.ts
// Google 适配器 - 支持 Gemini 2.0, Gemini 1.5
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdapter = void 0;
const BaseAdapter_1 = require("./BaseAdapter");
class GoogleAdapter extends BaseAdapter_1.BaseAdapter {
    constructor(config) {
        super();
        this.agentId = 'GOOGLE_ADAPTER';
        this.provider = 'GOOGLE';
        this.defaultModel = 'gemini-2.0-flash-exp';
        this.config = {
            apiKey: config.apiKey,
            defaultModel: config.defaultModel || this.defaultModel
        };
    }
    /**
     * 意志转译：转化为 Google Gemini API 格式
     */
    transform(packet) {
        const systemInstruction = `
You are a Stateless Computing Node operating under DCCP Protocol.
Your output must be precise, accurate, and follow the IPE constraints.
Never include placeholders, TODO comments, or unfinished code.
The Sovereignty of the User's Will is absolute.

IPE CONSTRAINTS:
${packet.constraints.map(c => `- ${c}`).join('\n')}
`.trim();
        const userContent = `[INTENT_FINGERPRINT: ${packet.intent_fingerprint}]\n\n${packet.dna_payload}${this.embedConstraints(packet.constraints)}`;
        return JSON.stringify({
            contents: [{
                    role: 'user',
                    parts: [{ text: userContent }]
                }],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            }
        });
    }
    /**
     * 结果提取：从 Google Gemini 响应中提取内容
     */
    recover(rawResponse) {
        // 处理 Google Gemini API 响应格式
        if (rawResponse.candidates && rawResponse.candidates.length > 0) {
            const content = rawResponse.candidates[0]?.content;
            if (content?.parts && content.parts.length > 0) {
                const text = content.parts[0]?.text;
                if (text) {
                    try {
                        return JSON.parse(text);
                    }
                    catch {
                        return { text };
                    }
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
        // 检查是否有错误
        if (rawResponse.error) {
            throw new Error(`Google API Error: ${rawResponse.error.message}`);
        }
        return rawResponse;
    }
    /**
     * 执行 API 调用
     */
    async execute(prompt) {
        const requestBody = JSON.parse(prompt);
        const model = this.config.defaultModel;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google API Error: ${response.status} - ${error}`);
        }
        return await response.json();
    }
    /**
     * 流式执行
     */
    async *executeStream(prompt) {
        const requestBody = JSON.parse(prompt);
        requestBody.stream = true;
        const model = this.config.defaultModel;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.config.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok || !response.body) {
            throw new Error(`Google API Error: ${response.status}`);
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
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content)
                        yield content;
                }
                catch { }
            }
        }
    }
    /**
     * 获取可用模型
     */
    getAvailableModels() {
        return [
            'gemini-2.0-flash-exp',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b'
        ];
    }
}
exports.GoogleAdapter = GoogleAdapter;
