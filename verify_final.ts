import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 15000 });
        await page.waitForTimeout(5000); // 额外的等待，确保动画加载
        await page.screenshot({ path: 'g:/Sovereign-DCCP-Core/final_peak_verification.png', fullPage: true });
        console.log('Screenshot captured successfully.');
    } catch (e) {
        console.error('Failed to capture screenshot:', e.message);
    } finally {
        await browser.close();
    }
})();
