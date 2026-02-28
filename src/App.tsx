import React, { Suspense, useState, useEffect } from "react";
import { io, Socket } from 'socket.io-client';
import WarNodeList from "./components/WarNodeList";
import ControlColumn from "./components/ControlColumn";
import BottomDeck from "./components/BottomDeck";
import { ShieldCheck, Wifi, Activity } from "lucide-react";

// 懒加载核心网络，防止主线程阻塞
const NeuralLattice = React.lazy(() => import("./components/NeuralLattice"));

const LoadingGrid = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800/50 rounded-lg">
        <Activity className="w-8 h-8 text-cyan-500 animate-bounce" />
        <span className="text-xs text-cyan-600 font-mono mt-4 animate-pulse">INITIALIZING NEURAL CORE...</span>
    </div>
);

const StatusBar = () => (
    <div className="col-span-12 flex justify-between items-center px-4 py-1 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur text-[9px] text-slate-500 font-mono uppercase tracking-widest z-20">
        <div className="flex gap-6">
            <span className="flex items-center gap-2 text-cyan-600">
                <ShieldCheck size={10} /> SOVEREIGN COMMAND V1
            </span>
        </div>
        <div className="flex gap-6">
            <span className="animate-pulse text-emerald-600">● SYSTEM STABLE</span>
        </div>
    </div>
);

export default function App() {
    const [socketNodes, setSocketNodes] = useState<any[]>([]);
    const [phantomNodes, setPhantomNodes] = useState<any[]>([]); // User-deployed ghost nodes
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Merge real nodes with user-deployed ghost nodes
    const nodes = [...socketNodes, ...phantomNodes];

    const [clusterStats, setClusterStats] = useState({ activeTasks: 0, avgLatency: 0, totalDispatched: 0 });
    const [manifest, setManifest] = useState<any[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);
    const [wealthTotal, setWealthTotal] = useState(0);

    const [nodeMessages, setNodeMessages] = useState<Record<string, string>>({});

    useEffect(() => {
        const s = io('http://localhost:51124');
        setSocket(s);

        s.on('connect', () => {
            setManifest(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString('en-GB', { hour12: false }), agent: 'LINK', msg: 'Neural Bridge established with DCCP Core on Port 51124.' }]);
        });

        s.on('nodesSnapshot', (data) => setSocketNodes(data || []));
        s.on('statsSnapshot', (stats) => setClusterStats(stats || { activeTasks: 0, avgLatency: 0, totalDispatched: 0 }));

        s.on('latticeUpdate', (log) => {
            setManifest(prev => [...prev.slice(-49), log]);
        });

        // --- REAL Multi-Agent Backend Resonance ---
        s.on('agentBroadcastResponse', (payload: { nodeId: string, message: string }) => {
            // 1. Show real message under the card
            setNodeMessages(prev => ({ ...prev, [payload.nodeId]: payload.message }));

            // 2. Pulse the canvas tether for visual sync
            setActiveNodeIds(prev => [...new Set([...prev, payload.nodeId])]);

            // 3. Auto-select the node briefly to show its HUD
            setSelectedNodeId(payload.nodeId);

            // Log the response to the terminal stream too
            setManifest(prevManifest => [...prevManifest.slice(-49), {
                time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                agent: payload.nodeId,
                msg: payload.message.substring(0, 50).toUpperCase() + (payload.message.length > 50 ? '...' : '')
            }]);

            // Turn off pulse after 2s
            setTimeout(() => {
                setActiveNodeIds(prev => prev.filter(id => id !== payload.nodeId));
            }, 2000);
        });

        s.on('agentPulse', (pulse) => {
            if (pulse.nodeId) {
                setActiveNodeIds(prev => [...new Set([...prev, pulse.nodeId])]);
                setTimeout(() => {
                    setActiveNodeIds(prev => prev.filter(id => id !== pulse.nodeId));
                }, 2000);
            }
        });

        s.on('wealthGenerated', (data) => {
            if (data && data.value) {
                setWealthTotal(prev => prev + data.value);
                setManifest(prev => [...prev.slice(-49), {
                    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                    agent: 'WEALTH_SYSTEM',
                    msg: `💎 SECURED: $${data.value.toLocaleString()} | CYCLE: ${data.cycleId}`
                }]);
            }
        });

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

    const deployNewNode = () => {
        const hash = Math.random().toString(16).substring(2, 6).toUpperCase();
        const newPhantom = {
            nodeId: `GHOST-${hash}`,
            provider: 'PHANTOM',
            status: 'ACTIVE',
            load: Math.floor(Math.random() * 40 + 10),
            type: 'WEB_GHOST'
        };
        setPhantomNodes(prev => [...prev, newPhantom]);
        setManifest(prev => [...prev.slice(-49), {
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            agent: 'COMMAND',
            msg: `⚡ NEW GHOST NODE DEPLOYED: ${newPhantom.nodeId}`
        }]);

        // Auto-select the newly deployed node
        setSelectedNodeId(newPhantom.nodeId);

        // Trigger a fake pulse for visual awesomeness
        setActiveNodeIds(prev => [...new Set([...prev, newPhantom.nodeId])]);
        setTimeout(() => {
            setActiveNodeIds(prev => prev.filter(id => id !== newPhantom.nodeId));
        }, 3000);
    };

    const sovereigntyRatio = 88.42;
    const activeCount = Array.isArray(nodes) ? nodes.filter(n => n?.status === 'Active' || n?.status === 'ACTIVE').length : 0;

    return (
        <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center scanlines overflow-hidden text-slate-200 font-sans selection:bg-cyan-500/30">

            {/* 背景层：确保有足够的深度 */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-80 pointer-events-none"></div>

            {/* 核心容器 */}
            <div className="relative z-10 w-full max-w-[1600px] h-[95vh] p-4 flex flex-col gap-4">

                {/* 1. Header (Top Row) */}
                <div className="flex justify-between items-center border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-4 py-2 rounded-t-lg">
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl md:text-3xl font-black tracking-[0.1em] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] uppercase font-sans">
                            SILICON LEGION
                        </h1>
                        <div className="hidden md:flex gap-4 text-[10px] text-cyan-700 font-mono mt-1">
                            <span>:: PROTOCOL: GHOST_ENGINE</span>
                            <span>:: LATENCY: {clusterStats.avgLatency || 12}ms</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-400 font-mono">SECURE CONNECTION</div>
                            <div className="text-xs text-emerald-500 font-bold shadow-emerald-500/50 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] uppercase">ENCRYPTED</div>
                        </div>
                        <div className="h-8 w-1 bg-cyan-500/20 rounded-full relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-cyan-400 shadow-[0_0_10px_cyan] animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* 2. Main 3-Column Layout area */}
                <div className="flex-1 grid grid-cols-12 gap-4 h-0 min-h-0">
                    {/* Left: Nodes */}
                    <div className="col-span-12 md:col-span-3 h-full overflow-hidden min-h-0 rounded-lg">
                        <WarNodeList
                            nodes={nodes}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={setSelectedNodeId}
                            onDeployNode={deployNewNode}
                            nodeMessages={nodeMessages}
                        />
                    </div>

                    {/* Center: Lattice */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-7 h-full relative min-h-0 rounded-lg">
                        <Suspense fallback={<LoadingGrid />}>
                            <NeuralLattice
                                nodes={nodes}
                                activeNodeIds={activeNodeIds}
                                selectedNodeId={selectedNodeId}
                            />
                        </Suspense>
                    </div>

                    {/* Right: Control */}
                    <div className="hidden md:block md:col-span-3 lg:col-span-2 h-full overflow-hidden min-h-0 rounded-lg">
                        <ControlColumn
                            sovereigntyRatio={sovereigntyRatio}
                            activeCount={activeCount}
                            latencyAvg={clusterStats.avgLatency > 0 ? `${clusterStats.avgLatency}ms` : `--`}
                            bandwidth={`${((clusterStats.totalDispatched || 0) * 0.8 + 12).toFixed(1)} TB/s`}
                            wealthTotal={wealthTotal}
                        />
                    </div>
                </div>

                {/* 3. Bottom Panel (Terminal/Deck) */}
                <div className="h-32 min-h-[120px] rounded-lg overflow-hidden">
                    <BottomDeck manifest={manifest} />
                </div>

                {/* 4. Footer */}
                <StatusBar />
            </div>
        </div>
    );
}
