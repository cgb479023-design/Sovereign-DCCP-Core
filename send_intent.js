const http = require('http');

const data = JSON.stringify({
    rawIntent: "Write a high-performance Playwright scraper in TypeScript that extracts trending video titles and view counts from the YouTube Trending page. Save the results as a JSON file in the workspace directory. Ensure the code follows the DCCP Bridge materialization pattern. File target: workspace/vph_radar_core.ts.",
    targetFilePath: "workspace/vph_radar_core.ts",
    agentTier: "vNext"
});

const req = http.request({
    hostname: '127.0.0.1',
    port: 51124,
    path: '/api/dccp/route',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
}, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('Response:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
