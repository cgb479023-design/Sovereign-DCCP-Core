import { io } from 'socket.io-client';
import axios from 'axios';

const DCCP_URL = 'http://localhost:51124';

async function testBridge() {
    console.log('--- 🜲 MOCK AGENT (CODEX) CONNECTING ---');
    const socket = io(DCCP_URL);

    socket.on('connect', () => {
        console.log('✅ Connected to Neural Bridge');
    });

    socket.on('handoverSignal', (data) => {
        console.log('🚀 RECEIVED HANDOVER SIGNAL:', data.handoverId);
        console.log('📝 Context Summary:', data.context.summary);
    });

    socket.on('agentRelay', (data) => {
        console.log('📡 RECEIVED RELAY MESSAGE:', data.payload);
    });

    // Test 1: Trigger a handover
    console.log('Step 1: Triggering Handover...');
    try {
        const hoResp = await axios.post(`${DCCP_URL}/api/dccp/handover`, {
            context: {
                summary: "Pixel-perfect UI restoration completed. Moving to Agent Interop.",
                pendingTasks: ["Verify relay endpoints", "Capture victory shot"]
            },
            nextAgentHint: "Codex"
        });
        console.log('✅ Handover Initiated:', hoResp.data.handoverId);
    } catch (e: any) {
        console.error('❌ Handover Failed:', e.message);
    }

    // Test 2: Trigger a relay
    console.log('Step 2: Sending Relay...');
    try {
        await axios.post(`${DCCP_URL}/api/dccp/relay`, {
            targetAgentId: "Antigravity",
            payload: { type: "ACK", status: "READY_FOR_SYNC" }
        });
        console.log('✅ Relay Sent.');
    } catch (e: any) {
        console.error('❌ Relay Failed:', e.message);
    }

    setTimeout(() => {
        console.log('--- TEST COMPLETE ---');
        process.exit(0);
    }, 5000);
}

testBridge();
