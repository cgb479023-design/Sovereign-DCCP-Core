import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

export class WebGhostEngine {
    private static instance: WebGhostEngine;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private userDataDir: string;
    private isInitialized: boolean = false;
    private isNavigating: boolean = false;

    private constructor() {
        // 存储在 workspace 下，确保持久化 session (Cookies, LocalStorage 等)
        this.userDataDir = path.join(process.cwd(), '.dccp', 'ghost_data');
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
        }
    }

    public static getInstance(): WebGhostEngine {
        if (!WebGhostEngine.instance) {
            WebGhostEngine.instance = new WebGhostEngine();
        }
        return WebGhostEngine.instance;
    }

    public async init() {
        if (this.isInitialized) return;
        try {
            console.log('[WebGhost] 👻 唤醒幽灵浏览器引擎 (Persistent Focus)...');

            // 自动侦测 G 盘存放的 Playwright 浏览引擎
            const chromePaths = [
                'G:\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe',
                'G:\\ms-playwright\\chromium-1187\\chrome-win\\chrome.exe',
                'G:\\ms-playwright\\chromium-1155\\chrome-win64\\chrome.exe'
            ];
            let executablePath = undefined;
            for (const p of chromePaths) {
                if (fs.existsSync(p)) {
                    executablePath = p;
                    console.log(`[WebGhost] 🎯 已锁定 G 盘浏览器引擎: ${p}`);
                    break;
                }
            }

            this.context = await chromium.launchPersistentContext(this.userDataDir, {
                headless: false, // 必须 false，才能让用户初始扫码或保留可视化监控
                viewport: { width: 1280, height: 720 },
                executablePath: executablePath,
                args: ['--disable-blink-features=AutomationControlled'] // 降低被检测率
            });
            this.page = await this.context.newPage();
            this.isInitialized = true;
            console.log('[WebGhost] ✅ 幽灵浏览器就绪。');
        } catch (error: any) {
            console.error('[WebGhost] 启动失败:', error.message);
        }
    }

    /**
     * 发送指令到免费的 Web AI 节点并抓取回复
     */
    public async sendPrompt(target: 'arena' | 'gemini', prompt: string): Promise<any> {
        if (!this.isInitialized || !this.page) {
            await this.init();
        }

        if (!this.page) throw new Error('Browser page not available');

        // 并发锁
        while (this.isNavigating) {
            await new Promise(r => setTimeout(r, 500));
        }
        this.isNavigating = true;

        try {
            if (target === 'arena') {
                return await this.handleArena(prompt);
            } else if (target === 'gemini') {
                return await this.handleGemini(prompt);
            }
            throw new Error(`Unsupported target: ${target}`);
        } finally {
            this.isNavigating = false;
        }
    }

    private async handleArena(prompt: string): Promise<any> {
        if (!this.page) throw new Error('Page null');

        console.log('[WebGhost] 🌐 导航至 Chatbot Arena...');
        await this.page.goto('https://lmarena.ai/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 1. 等待并点击 input 框
        const inputSelector = 'textarea[placeholder="Enter your prompt here..."]';
        try {
            await this.page.waitForSelector(inputSelector, { timeout: 10000 });
        } catch {
            throw new Error('Arena input box not found. Layout changed or network issue.');
        }

        console.log('[WebGhost] ✍️ 注入 DCCP 意志...');
        await this.page.fill(inputSelector, prompt);

        // 2. 点击 Send (通常是 textarea 旁边的 button)
        // Arena 的 DOM 可能经常变，尽量用精确的选择器
        try {
            await this.page.keyboard.press('Enter'); // 尝试回车发送，许多界面的标配
        } catch (e) {
            const sendBtn = this.page.locator('button:has(svg)').last(); // 模糊猜测
            await sendBtn.click();
        }

        console.log('[WebGhost] ⏳ 等待模型计算共识...');

        // 3. 等待回复区块出现并停止加载
        // Arena 产生回复时会有一段流式输出，我们需要等它输出完。
        // 一个简单的策略是等待 10-15 秒，然后抓取最后面生成的区块。
        // 注意：真实生产级的爬虫需要观察并等待生成结束的具体 DOM 变化 (如光标消失、重试按钮出现等)
        await this.page.waitForTimeout(10000); // 暂定强等 10s 以收集模型结果

        // 抓取模型 A 和 B 的文字
        const modelResponses = await this.page.$$eval('.prose', (elements) => {
            // 获取最新生成的两个对话气泡（忽略用户自己的输入框）
            return elements.map(el => (el as HTMLElement).innerText).slice(-2);
        });

        if (modelResponses.length < 2) {
            // 降级回退
            return JSON.stringify({
                status: "PARTIAL_RECOVERY",
                content: modelResponses[0] || "No response grabbed from Arena."
            });
        }

        // 以 Model A 作为主要结果返回，或者将两者的内容拼在一起作为“共识”
        const data = {
            status: "CONSENSUS_REACHED",
            winning_model: "Model_A_WebGhost",
            content: modelResponses[0]
        };

        return JSON.stringify(data);
    }

    private async handleGemini(prompt: string): Promise<any> {
        if (!this.page) throw new Error('Page null');

        console.log('[WebGhost] 🌐 导航至 Gemini Web...');
        await this.page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 等待输入框出现 (通常是 rich-textarea)
        const chatInput = this.page.locator('rich-textarea');
        try {
            await chatInput.waitFor({ timeout: 10000 });
        } catch {
            throw new Error('Gemini loaded failed. Unauthenticated? Please manually login in the spawned window.');
        }

        console.log('[WebGhost] ✍️ 注入主权意志...');
        await chatInput.fill(prompt);
        await this.page.keyboard.press('Enter');

        console.log('[WebGhost] ⏳ 窃取谷歌算力中...');

        // 等待生成结束：观测 Gemini 特有的加载骨架屏是否消失
        try {
            // 等个几秒让元素能够挂载
            await this.page.waitForTimeout(3000);

            // 抓取最新的回复 block
            // 此处的 class 名极大可能有变化，一般取 message-content
            await this.page.waitForTimeout(10000); // 暂定强等10s

            const lastResponse = await this.page.locator('.message-content').last().innerText();

            return JSON.stringify({
                status: "SUCCESS",
                content: lastResponse || "Scraped OK but empty."
            });
        } catch (e: any) {
            throw new Error('Gemini scraping timeout or element changes: ' + e.message);
        }
    }
}
