import { arbitrageEngine } from './arbitrage_engine';

/**
 * SOVEREIGN EXECUTIVE LOOP - V1.0
 * The high-frequency pulse engine for the Silicon Legion.
 * Triggers autonomous wealth generation cycles every 10 minutes.
 */

const PULSE_INTERVAL = 10 * 60 * 1000; // 10 Minutes

async function pulse() {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    console.log(`[${timestamp}] [SOVEREIGN-LOOP] Initiating Autonomous Wealth Pulse...`);

    try {
        await arbitrageEngine.executeDigitalSalesCycle();
    } catch (e) {
        console.error(`[${timestamp}] [ERROR] Pulse execution failed:`, e);
    }
}

console.log("--------------------------------------------------");
console.log("🤖 Sovereign Executive Loop Started.");
console.log("Persistent Awareness Active...");
console.log("--------------------------------------------------");

// Initial trigger
pulse();

// Set up the recurring heartbeat
setInterval(pulse, PULSE_INTERVAL);
