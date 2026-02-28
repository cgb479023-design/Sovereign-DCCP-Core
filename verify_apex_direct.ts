import { chromium } from 'playwright';
import path from 'path';

async function verify() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const outputPath = 'C:/Users/cgb2026/.gemini/antigravity/brain/eae0de04-8f3a-406e-b856-f13d0b114398/browser/apex_final_victory.png';

    console.log('Navigating to Silicon Legion dashboard...');
    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        // Wait for Suspense/Neural Lattice
        await page.waitForTimeout(5000);
        console.log('Capturing screenshot to:', outputPath);
        await page.screenshot({ path: outputPath, fullPage: true });
        console.log('SUCCESS: Screenshot captured.');
    } catch (e: any) {
        console.error('FAILED: could not capture screenshot:', e.message);
    } finally {
        await browser.close();
    }
}

verify();
