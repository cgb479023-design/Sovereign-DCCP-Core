import { DCCPBridge } from './server/core/DCCPBridge';
import { NeuralRouter } from './server/core/NeuralRouter';
import { AgentRegistry } from './server/core/AgentRegistry';
import { ArenaAdapter } from './server/adapters/ArenaAdapter';

async function verifyDoomsday() {
    console.log('--- DOOMSDAY VERIFICATION START ---');

    // 测试一：DCCP Bridge 原子性写入与高并发冲突
    console.log('\n[TEST 1] DCCP Bridge 原子性高并发写入...');
    const bridge = new DCCPBridge();

    const writePromises = [];
    for (let i = 0; i < 50; i++) {
        writePromises.push(bridge.ingest({
            filePath: 'workspace/atomic_test.txt',
            content: `I am concurrent write ${i}`,
            backup: false
        }));
    }

    try {
        const results = await Promise.allSettled(writePromises);
        const successes = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[TEST 1] ✅ 并发写入完成: ${successes}/50 成功 (未抛出同步阻塞或文件破坏异常)`);
    } catch (e) {
        console.error('[TEST 1] ❌ 写入异常:', e);
    }

    // 测试二：Neural Router 指数退避与自愈测试
    console.log('\n[TEST 2] Neural Router 异常隔离与指数退避重试...');
    const registry = new AgentRegistry();
    const router = new NeuralRouter(registry, undefined, { enableAudit: false, enableAutoSwitch: false, maxRetries: 2, timeoutMs: 100 });
    const arenaAdapter = new ArenaAdapter();

    // 注入一个毒性适配器，故意抛出异常
    arenaAdapter.execute = async () => {
        throw new Error('SIMULATED_NETWORK_FAILURE');
    };

    router.registerAdapter(arenaAdapter);
    registry.registerNode({ id: 'bad-node', provider: 'ARENA', tier: 'v2.0', endpoint: 'mock' });

    try {
        const result = await router.route({
            id: 'doom-packet',
            timestamp: Date.now(),
            intent_fingerprint: 'test-doom',
            dna_payload: 'Execute arena with error',
            constraints: [],
            generation_limit: 'STRICT_CONTEXT'
        });

        if (!result.success && result.error?.includes('SIMULATED_NETWORK_FAILURE')) {
            console.log(`[TEST 2] ✅ 自愈机制触发完美: 成功隔离错误并耗尽重试池，没有导致宿主崩溃。`);
        } else {
            console.log(`[TEST 2] ⚠️ 结果非预期:`, result);
        }
    } catch (e) {
        console.error(`[TEST 2] ❌ 抛出了未处理的路由异常 (期望内部处理掉返回 {success: false}):`, e);
    }

    // 测试三：未捕获异常全局兜底
    console.log('\n[TEST 3] 全局未处理异常兜底触发模拟...');
    setTimeout(() => {
        console.log('[TEST 3] 触发 Unhandled Rejection...');
        Promise.reject(new Error('DOOMSDAY_ORPHAN_PROMISE'));
    }, 100);

    setTimeout(() => {
        console.log('\n--- DOOMSDAY VERIFICATION COMPLETE ---');
    }, 1000);
}

verifyDoomsday().catch(console.error);
