import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Zap, Shield, SquareTerminal } from 'lucide-react';
import { clsx } from 'clsx';

interface NodeProps {
    node: {
        nodeId: string;
        provider: string;
        status: string;
        load: number;
    };
    isSelected?: boolean;
    onClick?: () => void;
    latestMessage?: string;
}

const WarNodeCard: React.FC<NodeProps> = ({ node, isSelected, onClick, latestMessage }) => {
    const isActive = node.status === 'ACTIVE' || node.status === 'active';

    // Generate mock sparkline points
    const points = Array.from({ length: 10 }).map((_, i) => ({
        x: i * 10,
        y: 20 + Math.random() * 30
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={clsx(
                "group relative bg-[#0d1520]/80 border rounded p-1.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col gap-1",
                isSelected ? "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "border-slate-800 hover:border-cyan-500/40"
            )}
        >
            {/* Background Glow */}
            <div className={clsx(
                "absolute inset-0 transition-opacity duration-300 bg-gradient-to-br pointer-events-none",
                isSelected ? "opacity-20 from-cyan-400 to-transparent" : "opacity-0 group-hover:opacity-10",
                isActive ? "from-cyan-500/20" : "from-slate-500/20"
            )} />

            {/* Top Node Info Header */}
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-slate-500 font-mono tracking-tighter">[{node.provider?.substring(0, 3).toUpperCase()}]</span>
                    <span className="text-[10px] font-bold text-slate-200 tracking-wider uppercase truncate max-w-[80px]">{node.nodeId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={clsx("text-[9px] font-black font-mono", isActive ? "text-cyan-400" : "text-slate-600")}>
                        {node.load || 0}%
                    </span>
                    <div className={clsx(
                        "w-1.5 h-1.5 rounded-full shadow-[0_0_5px]",
                        isActive ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-slate-700 shadow-none"
                    )} />
                </div>
            </div>

            {/* Sparkline & Bottom Indicators - Condensed */}
            <div className="mt-1 flex items-end justify-between gap-2 relative z-10">
                <div className="flex-1 h-3 relative opacity-60">
                    <svg className="w-full h-full overflow-visible preserveAspectRatio='none'">
                        <motion.path
                            d={`M ${points.map((p, idx) => `${idx * 15},${p.y / 4}`).join(' L ')}`}
                            fill="none"
                            stroke={isActive ? "#22d3ee" : "#475569"}
                            strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </svg>
                </div>
                <div className="flex gap-1 opacity-60 shrink-0">
                    <Activity size={8} className={isActive ? "text-cyan-500" : "text-slate-700"} />
                    <Zap size={8} className={isActive ? "text-purple-500" : "text-slate-700"} />
                    <span className="text-[7px] font-mono text-slate-500 ml-1">{Math.floor(Math.random() * 50 + 10)}MS</span>
                </div>
            </div>

            {/* Expandable Agent Chat Simulation Panel */}
            <AnimatePresence>
                {latestMessage && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="relative z-10 border-t border-cyan-900/50 pt-1.5 overflow-hidden"
                    >
                        <div className="bg-cyan-950/30 border border-cyan-800/50 rounded px-1.5 py-1.5 flex gap-1.5 items-start relative">
                            {/* Blinking cursor effect overlay */}
                            <div className="absolute inset-0 bg-transparent animate-[pulse_2s_ease-in-out_infinite] border-l-2 border-cyan-400/50 pointer-events-none" />

                            <SquareTerminal size={10} className="text-cyan-500 shrink-0 mt-0.5 animate-pulse" />
                            <div className="text-[8.5px] font-mono text-cyan-300/90 leading-tight tracking-tight break-words relative w-full">
                                {/* Typewriter effect wrapper could go here, but simple text is fine for the simulation spread */}
                                {latestMessage}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default WarNodeCard;
