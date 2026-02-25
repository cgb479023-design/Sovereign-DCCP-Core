const net = require('net');

const LISTEN_PORT = 9222;
const TARGET_PORT = 9223;

console.log(`[Proxy] 🛡️  Starting CDP Self-Healing Proxy: ${LISTEN_PORT} -> ${TARGET_PORT}`);

const server = net.createServer((socket) => {
    console.log('[Proxy] ⚡ Connection received on 9222, forwarding to 9223...');

    const target = net.createConnection({ port: TARGET_PORT }, () => {
        console.log('[Proxy] ✅ Target 9223 connected.');
    });

    socket.pipe(target);
    target.pipe(socket);

    socket.on('error', (err) => console.error('[Proxy] Socket error:', err.message));
    target.on('error', (err) => console.error('[Proxy] Target error:', err.message));
});

server.listen(LISTEN_PORT, '127.0.0.1', () => {
    console.log(`[Proxy] 🚀 Listening on 127.0.0.1:${LISTEN_PORT}`);
});
