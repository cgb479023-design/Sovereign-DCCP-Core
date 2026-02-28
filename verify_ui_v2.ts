import { chromium } from 'playwright';

(async () => {
    console.log("启动多阶段自动化验证与截图采集...");
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 设置视口大小以确保捕捉完整 UI
    await page.setViewportSize({ width: 1600, height: 900 });

    try {
        await page.goto('http://localhost:3000');
    } catch (e: any) {
        console.warn("⚠️ 页面加载带有警告，可能是 Vite 的特殊响应导致，但尝试继续执行: ", e.message);
    }

    console.log("等待 UI 初始化 (包含 Wealth 接口的 Hydration)...");
    await page.waitForTimeout(4000);

    // ==========================================
    // 拍摄截图 1: 自动在控制台输入指令
    // ==========================================
    const inputSelector = 'input[type="text"]';
    await page.waitForSelector(inputSelector);

    const testDirective = "Initiate B2B Lead Generation and autonomous wealth generation cycle.";
    await page.fill(inputSelector, testDirective);
    await page.waitForTimeout(500); // 稍作停顿以确保输入框渲染完成

    const shot1Path = 'g:\\Sovereign-DCCP-Core\\verification_step1.png';
    await page.screenshot({ path: shot1Path, fullPage: true });
    console.log(`✅ 截图 1 采集完毕: 自动输入指令 -> ${shot1Path}`);

    // 触发指令下发
    console.log("--> 按下 Enter 触发指令下发");
    await page.keyboard.press('Enter');

    // ==========================================
    // 拍摄截图 3: 12个节点的实况快照
    // ==========================================
    console.log("等待指令流转与节点活动触发...");
    await page.waitForTimeout(2500); // 等待网络请求和前端动画开始

    const shot3Path = 'g:\\Sovereign-DCCP-Core\\verification_step3.png';
    await page.screenshot({ path: shot3Path, fullPage: true });
    console.log(`✅ 截图 3 采集完毕: 截取 12 个节点处理实况 -> ${shot3Path}`);

    // ==========================================
    // 拍摄截图 2: UI 动态反馈与 EST. WEALTH 计数器
    // ==========================================
    console.log("等待后端处理和状态完全同步...");
    await page.waitForTimeout(5000);

    const shot2Path = 'g:\\Sovereign-DCCP-Core\\verification_step2.png';
    // 我们可以专门截取右侧面板，或者依然截取全屏但重点展现数据
    // 这里采用全屏以保留完整上下文，用户能清晰看到 EST WEALTH
    await page.screenshot({ path: shot2Path, fullPage: true });
    console.log(`✅ 截图 2 采集完毕: 捕获 EST. WEALTH 与动态反馈 -> ${shot2Path}`);

    await browser.close();
    console.log("🎉 自动化采集全流程结束！");
})();
