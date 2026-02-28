import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Shield, Cpu, Wifi, Activity, Terminal, ExternalLink, RefreshCw, Power, Settings, Search, LayoutDashboard, Globe, Network, Cpu as CpuIcon, ShieldCheck, Zap, AlertTriangle, Play, Square, Command, Maximize2, X, LogOut, ChevronRight, ChevronLeft, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Import child components
import ControlColumn from './components/ControlColumn';
// Placeholder for other components if they are also missing, we assume they might exist or we mock them temporarily
// If they are missing, the user will see unresolved imports, but ControlColumn is the most critical one.
// import WarNodesList from './components/WarNodesList';
// import NeuralLatticeCanvas from './components/NeuralLatticeCanvas';
// import BottomDeck from './components/BottomDeck';

// Temporary Mock Components in case the entire src/components directory was wiped
const WarNodesList = ({ nodes, nodeActivities, loadHistory }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 h-full flex flex-col">
        <div className="text-xs text-cyan-500 font-mono mb-4 flex justify-between tracking-widest uppercase">
            <span>War-Nodes (AI Agents)</span>
            <span className="text-emerald-400">LIVE //</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {nodes.map((node: any) => (
                <div key={node.nodeId} className="bg-slate-800/40 p-3 rounded border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">[{node.provider?.substring(0, 5).toUpperCase()}] {node.nodeId}</span>
                        <span className={clsx("w-2 h-2 rounded-full", node.status === 'ACTIVE' || node.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600')} />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 font-mono flex justify-between">
                        <span>{node.status?.toUpperCase()} | {Math.floor(Math.random() * 50 + 10)}MS</span>
                        <span>LOAD: <span className="text-cyan-400">{node.load || 0}%</span></span>
                    </div>
                </div>
            ))}
            {nodes.length === 0 && <div className="text-xs text-slate-600 font-mono text-center mt-10">NO NODES DETECTED</div>}
        </div>
    </div>
);

const NeuralLatticeCanvas = ({ nodes, activeNodeIds }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 h-full relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-4 left-4 text-[10px] text-cyan-500/50 font-mono tracking-widest uppercase">NEURAL LATTICE TOPOLOGY</div>
        {/* Central Nexus Node */}
        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute z-20">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600/80 to-cyan-500/80 rounded-full blur-md absolute inset-0 animate-pulse" />
            <div className="w-16 h-16 bg-slate-900 border-2 border-cyan-500 rounded-full relative flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                <span className="text-[10px] font-bold text-white tracking-widest text-center shadow-black drop-shadow-md">SOVEREIGN<br />NEXUS</span>
            </div>
        </motion.div>
        {/* Surround Nodes */}
        {nodes.map((node: any, i: number) => {
            const isFired = activeNodeIds.includes(node.nodeId);
            const angle = (i / nodes.length) * Math.PI * 2;
            const radius = 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
                <React.Fragment key={node.nodeId}>
                    {/* Connecting Line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <line x1="50%" y1="50%" x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`} stroke={isFired ? "#a855f7" : "#334155"} strokeWidth={isFired ? 2 : 1} strokeDasharray={isFired ? "none" : "4,4"} className={clsx(isFired && "opacity-80 animate-pulse")} />
                    </svg>
                    {/* Node Orb */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, x: x, y: y }} transition={{ duration: 1 }} className="absolute z-10 flex flex-col items-center justify-center">
                        <div className={clsx("w-3 h-3 rounded-full mb-1 shadow-md transition-all duration-300", isFired ? "bg-magenta-500 shadow-[0_0_15px_rgba(236,72,153,0.8)] scale-150" : (node.status === 'active' || node.status === 'ACTIVE' ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-slate-600"))} />
                        <span className="text-[8px] text-slate-400 font-mono bg-slate-900/80 px-1 rounded absolute -top-4 whitespace-nowrap">{node.nodeId}</span>
                    </motion.div>
                </React.Fragment>
            );
        })}
    </div>
);

const BottomDeck = ({ manifest }: any) => {
    const [cmd, setCmd] = useState('');

    const handleDispatch = () => {
        if (!cmd.trim()) return;
        fetch('http://localhost:51124/api/dccp/dispatch', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directive: cmd, target: 'auto' })
        }).catch(console.error);
        setCmd('');
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-full font-mono">
            <div className="col-span-12 md:col-span-7 bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex flex-col relative overflow-hidden">
                <div className="text-[10px] text-slate-500 mb-2 font-bold tracking-widest flex items-center absolute top-3 left-4 z-10 bg-slate-900/90 px-2 py-1">
                    <ChevronRight size={12} className="text-cyan-500 mr-2" /> LIVE MANIFEST STREAM
                </div>
                <div className="flex-1 overflow-y-auto mt-8 font-mono text-[11px] leading-relaxed custom-scrollbar pl-2 space-y-1">
                    {manifest.length === 0 && <div className="text-slate-600 italic">Waiting for inbound telemetry...</div>}
                    {manifest.map((log: any, i: number) => (
                        <div key={i} className="flex space-x-2 w-full break-words">
                            <span className="text-slate-500 shrink-0">[{log.time}]</span>
                            <span className={clsx("font-bold shrink-0", log.agent.includes('OLLAMA') ? 'text-amber-400' : log.agent.includes('ERROR') ? 'text-red-400' : 'text-cyan-400')}>
                                {log.agent}:
                            </span>
                            <span className="text-slate-300">{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-12 md:col-span-5 bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                <div className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase mb-4">COMMAND NEXUS</div>
                <div className="relative">
                    <div className="text-[10px] text-slate-500 mb-1">EXECUTE COMMAND {">"}</div>
                    <input
                        type="text"
                        value={cmd}
                        onChange={(e) => setCmd(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDispatch()}
                        placeholder="Initiate operations..."
                        className="w-full bg-slate-950 border-b border-cyan-500/50 text-cyan-300 font-mono text-sm py-2 px-0 focus:outline-none focus:border-cyan-400 transition-colors"
                        autoComplete="off"
                    />
                    <button onClick={handleDispatch} className="absolute right-0 bottom-2 text-cyan-500 hover:text-cyan-300">
                        <Send size={14} />
                    </button>
                </div>
                <div className="text-[9px] text-slate-600 text-right mt-2 flex justify-between">
                    <span className="text-slate-700 font-sans">AUTH_KEY: 0x8f92...1A2B</span>
                    <span>// PRESS ENTER TO DISPATCH</span>
                </div>
            </div>
        </div>
    );
};

const Send = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);


function App() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [clusterStats, setClusterStats] = useState({ activeTasks: 0, avgLatency: 0, totalDispatched: 0 });
    const [manifest, setManifest] = useState<any[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);
    const [wealthTotal, setWealthTotal] = useState(0);

    useEffect(() => {
        const s = io('http://localhost:51124');
        setSocket(s);

        s.on('connect', () => {
            setManifest(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString('en-GB', { hour12: false }), agent: 'LINK', msg: 'Neural Bridge established with DCCP Core on Port 51124.' }]);
        });

        s.on('nodesSnapshot', (data) => setNodes(data || []));
        s.on('statsSnapshot', (stats) => setClusterStats(stats || { activeTasks: 0, avgLatency: 0, totalDispatched: 0 }));

        s.on('latticeUpdate', (log) => {
            setManifest(prev => [...prev.slice(-49), log]);
        });

        // Handle Direct telemetry pulses (highlight nodes in Lattice)
        s.on('agentPulse', (pulse) => {
            if (pulse.nodeId) {
                setActiveNodeIds(prev => [...new Set([...prev, pulse.nodeId])]);
                // Remove highlight after 2 seconds
                setTimeout(() => {
                    setActiveNodeIds(prev => prev.filter(id => id !== pulse.nodeId));
                }, 2000);
            }
        });

        // Listen for Wealth Generation Events from the Arbitrage Engine
        s.on('wealthGenerated', (data) => {
            if (data && data.value) {
                setWealthTotal(prev => prev + data.value);
                setManifest(prev => [...prev.slice(-49), {
                    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                    agent: 'WEALTH_SYSTEM',
                    msg: `💎 SECURED: $${data.value.toLocaleString()} | CYCLE: ${data.cycleId} | TARGET: ${data.proposal?.substring(0, 30)}...`
                }]);
            }
        });

        // Initial Wealth Fetch
        const fetchWealth = async () => {
            try {
                const resp = await fetch('http://localhost:51124/api/dccp/wealth/stats');
                const data = await resp.json();
                if (data && data.success) {
                    setWealthTotal(data.total || 0);
                }
            } catch (e) {
                console.warn("Could not fetch initial wealth.");
            }
        };
        fetchWealth();

        setManifest(prev => [...prev, { time: new Date().toLocaleTimeString('en-GB', { hour12: false }), agent: 'INFRA', msg: 'Sovereign Command Nexus initialized. Level 5 Authority active.' }]);

        return () => { s.disconnect(); };
    }, []);

    // Compute mock sovereignty ratio for visual flair
    const sovereigntyRatio = 88.42;

    // Derive active nodes count safely
    const activeCount = Array.isArray(nodes) ? nodes.filter(n => n?.status === 'Active' || n?.status === 'ACTIVE').length : 0;

    return (
        <div className="h-screen w-screen bg-[#0a0f16] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col relative command-center-bg">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen" />

            {/* --- HUD HEADER --- */}
            <header className="h-[72px] shrink-0 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 relative z-20 bg-gradient-to-r from-slate-900 via-slate-900 to-[#0a0f16]">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-[20px] opacity-20" />
                        <div className="w-10 h-10 border border-cyan-500/30 rounded-lg flex items-center justify-center bg-slate-900 relative">
                            <Shield className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 font-cyber drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                            SILICON LEGION
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">{nodes.length} GHOSTS DISPATCHABLE</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">|</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">CRYPTO_HASH: 593A...E921</span>
                        </div>
                    </div>
                </div>

                {/* Phase Indicator */}
                <div className="hidden md:flex items-center space-x-2 border border-cyan-900/50 bg-cyan-950/20 px-3 py-1 rounded-sm relative overflow-hidden group">
                    <div className="absolute inset-0 w-[20%] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out" />
                    <span className="text-[10px] text-cyan-600 font-bold font-mono tracking-widest">PHASE 2 ::</span>
                    <span className="text-[10px] text-cyan-400 font-bold font-mono tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">ACTIVE</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/2 hover:bg-white/5 transition-all cursor-pointer">
                            <Settings className="w-5 h-5 text-slate-500 hover:text-cyan-400 transition-colors" />
                        </div>
                        <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/2 hover:bg-white/5 transition-all group/power cursor-pointer">
                            <LogOut className="w-5 h-5 text-slate-500 group-hover/power:text-magenta-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- HUD MAIN VIEW (Absolute Parity 3-Column Arch) --- */}
            <main className="flex-1 overflow-hidden grid grid-cols-12 grid-rows-12 gap-6 p-6 relative z-10 max-w-[1600px] mx-auto w-full">
                {/* 2. Left Panel: War Nodes (左侧列) */}
                <div className="col-span-12 md:col-span-3 row-span-8 overflow-hidden flex flex-col h-full">
                    <WarNodesList nodes={nodes} nodeActivities={{}} loadHistory={{}} />
                </div>

                {/* 3. Center Panel: Neural Lattice (中间核心) */}
                <div className="col-span-12 md:col-span-7 row-span-8 overflow-hidden h-full">
                    <NeuralLatticeCanvas nodes={nodes} activeNodeIds={activeNodeIds} />
                </div>

                {/* 4. Right Panel: Controls (右侧列) */}
                <div className="col-span-12 md:col-span-2 row-span-8 overflow-hidden h-full">
                    <ControlColumn
                        sovereigntyRatio={sovereigntyRatio}
                        activeCount={activeCount}
                        latencyAvg={clusterStats.avgLatency > 0 ? `${clusterStats.avgLatency}ms` : `${Math.floor(Math.random() * 15 + 5)}ms`}
                        bandwidth={`${(clusterStats.totalDispatched * 0.8 + 12).toFixed(1)} TB/s`}
                        wealthTotal={wealthTotal}
                    />
                </div>

                {/* 5. Bottom Deck (底部) */}
                <div className="col-span-12 row-span-4 mt-2">
                    <BottomDeck manifest={manifest} />
                </div>
            </main>

            {/* --- HUD FOOTER --- */}
            <footer className="h-10 border-t border-white/5 flex items-center justify-between px-10 relative z-30 bg-slate-900/90 backdrop-blur-xl">
                <div className="flex items-center gap-6 text-[10px] font-cyber font-black tracking-[0.2em] text-slate-600">
                    <div className="flex items-center gap-2">
                        <Command className="w-3 h-3 text-cyan-500" />
                        STATION: <span className="text-slate-500">SOVEREIGN_COMMAND_V1</span>
                    </div>
                    <div className="flex items-center gap-2 uppercase">
                        LATTICE: <span className="text-emerald-500">LINKED</span>
                        <div className="flex gap-1 ml-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="w-3 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                    <motion.div animate={{ x: [-12, 12] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: i * 0.1 }} className="w-full h-full bg-emerald-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        <span className="text-cyan-400 font-bold">QUANTUM CORE RESONANCE: OPTIMIZED</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-slate-600" />
                        <span>VITE RESONANCE: <span className="text-slate-400">RESONANCE[1] OK</span></span>
                    </div>
                    <div>|</div>
                    <div>BUILD: 0.3.1-DOMINION-L5</div>
                </div>
            </footer>

        </div>
    );
}

export default App;
