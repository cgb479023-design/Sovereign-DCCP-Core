/**
 * Sovereign-DCCP-Core Concurrency Stress Test
 * 模拟 20 个高并发的意志突触同时轰炸 NeuralRouter
 */

const TARGET_URL = "http://localhost:51124/api/dccp/route";
const CONCURRENCY = 20;

async function sendIntent(id: number) {
    const payload = {
        rawIntent: `[STRESS_TEST_${id}] Force generate a random neural weight mapping array. Delay 500ms if possible.`,
        targetFilePath: `workspace/stress_test/output_${id}.json`,
        agentTier: "vNext"
    };

    const startTime = Date.now();
    console.log(`[TEST-${id}] 🚀 发起请求...`);

    try {
        const res = await fetch(TARGET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const elapsed = Date.now() - startTime;

        if (res.ok) {
            const data = await res.json();
            console.log(`[TEST-${id}] ✅ 成功 | 节点: ${data.nodeId} | 得分: ${data.sovereigntyScore} | 耗时: ${elapsed}ms`);
            return { success: true, id, elapsed };
        } else {
            const err = await res.text();
            console.error(`[TEST-${id}] ❌ 失败 | HTTP ${res.status} | ${err}`);
            return { success: false, id, elapsed, error: err };
        }
    } catch (error: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[TEST-${id}] 💥 崩溃 | ${error.message}`);
        return { success: false, id, elapsed, error: error.message };
    }
}

async function runStressTest() {
    console.log(`\n======================================================`);
    console.log(`🔥 启动突触风暴 (并发数: ${CONCURRENCY})`);
    console.log(`======================================================\n`);

    const startTime = Date.now();

    // 构造 Promise 数组进行并发突击
    const promises = [];
    for (let i = 1; i <= CONCURRENCY; i++) {
        promises.push(sendIntent(i));
    }

    // 等待所有突触执行完毕
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n======================================================`);
    console.log(`📊 突触风暴报告`);
    console.log(`======================================================`);
    console.log(`总请求数: ${CONCURRENCY}`);
    console.log(`通过数目: ${successful}`);
    console.log(`阻断数目: ${failed}`);
    console.log(`总共耗时: ${totalTime}ms`);
    console.log(`平均耗时: ${(totalTime / CONCURRENCY).toFixed(2)}ms / Req`);
    console.log(`吞吐量  : ${(CONCURRENCY / (totalTime / 1000)).toFixed(2)} Req/Sec`);
    console.log(`======================================================\n`);
}

runStressTest();
