import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: ['react-force-graph-2d', 'three']
    },
    server: {
        port: 3000,
        open: true,
        watch: {
            usePolling: true,
        },
    }
});
