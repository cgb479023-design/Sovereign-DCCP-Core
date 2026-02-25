async function runTest() {
    console.log("Starting Sovereign-DCCP-Core Loop Test...");
    try {
        const res = await fetch("http://localhost:51124/api/dccp/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rawIntent: "Write a hello world program to test end to end flow execution.",
                targetFilePath: "workspace/test_output.json",
                agentTier: "vNext"
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("HTTP Error:", res.status, errorText);
            return;
        }

        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
runTest();
