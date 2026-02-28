/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // 核心色板：只有定义了这些，bg-cyan-900/20 才会生效
                cyan: { 400: '#22d3ee', 900: '#083344' },
                slate: { 900: '#0f172a', 950: '#020617' },
                magenta: { 500: '#d946ef', 900: '#701a75' },
            },
            boxShadow: {
                // 关键：这是你缺失的“霓虹光晕”
                'neon-cyan': '0 0 5px theme("colors.cyan.400"), 0 0 20px theme("colors.cyan.900")',
                'neon-magenta': '0 0 5px theme("colors.magenta.500"), 0 0 20px theme("colors.magenta.900")',
                'glass-inset': 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
            },
            fontFamily: {
                // 关键：科幻字体
                sans: ['"Orbitron"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            backgroundImage: {
                // 关键：网格背景，没有它，玻璃拟态看不出来
                'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            }
        },
    },
    plugins: [],
}
