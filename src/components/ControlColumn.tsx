import React, { useState } from "react";
import { Shield, Cpu, Wifi, User, Settings, Power } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

// 1. 原子组件：巨型霓虹开关 (Neon Toggle)
const NeonToggle = ({ label, isActive, onClick, color = "cyan" }: { label: string; isActive: boolean; onClick: () => void; color?: string }) => (
    <div
        onClick={onClick}
        className={clsx(
            "relative cursor-pointer group overflow-hidden rounded-lg border p-3 transition-all duration-300",
            "bg-slate-800/40 backdrop-blur-md hover:bg-slate-800/60",
            isActive
                ? (color === "cyan" ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]")
                : "border-slate-700 hover:border-slate-500"
        )}
    >
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold tracking-wider">{label}</span>
                <span className={clsx(
                    "text-[10px] mt-1 font-mono uppercase",
                    isActive ? (color === "cyan" ? "text-cyan-400" : "text-emerald-400") : "text-slate-600"
                )}>
                    {isActive ? "ONLINE" : "OFFLINE"}
                </span>
            </div>

            {/* 物理开关模拟 (The Switch Pill) */}
            <div className={clsx(
                "w-10 h-5 rounded-full p-1 transition-colors duration-300",
                isActive ? (color === "cyan" ? "bg-cyan-900/50" : "bg-emerald-900/50") : "bg-slate-900"
            )}>
                <motion.div
                    layout
                    className={clsx(
                        "w-3 h-3 rounded-full shadow-md",
                        isActive ? (color === "cyan" ? "bg-cyan-400 shadow-cyan-400" : "bg-emerald-400 shadow-emerald-400") : "bg-slate-600"
                    )}
                />
            </div>
        </div>
    </div>
);

// 2. 原子组件：数据方块 (Stat Block)
const StatBlock = ({ value, label, sub }: { value: string; label: string; sub?: string }) => (
    <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg backdrop-blur-sm hover:border-slate-600 transition-colors">
        <div className="text-xl font-mono font-bold text-slate-200 tracking-tighter">{value}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">{label}</div>
        {sub && <div className="text-[9px] text-slate-500 mt-1 border-t border-slate-700/50 pt-1">{sub}</div>}
    </div>
);

export default function ControlColumn({ sovereigntyRatio = 88.42, activeCount = 0, latencyAvg = '--', bandwidth = '--', wealthTotal = 0 }: { sovereigntyRatio?: number; activeCount?: number; latencyAvg?: string; bandwidth?: string; wealthTotal?: number }) {
    const [neuralActive, setNeural] = useState(true);
    const [localActive, setLocal] = useState(true);

    return (
        <div className="flex flex-col h-full space-y-3 w-full font-sans">

            {/* A. Sovereignty Ratio (顶部渐变仪表 - V5 High Fidelity) */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 relative overflow-hidden glass-volumetric">
                <div className="flex flex-col gap-1 mb-2">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-cyber tracking-widest uppercase">
                        <span className="flex items-center gap-2">
                            <Shield size={10} className="text-cyan-400" /> SVRG_RATIO
                        </span>
                        <span className="text-white font-black text-[11px] font-mono">{sovereigntyRatio}%</span>
                    </div>
                </div>
                {/* 渐变进度条 (Gradient Bar with Inner Glow) */}
                <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden flex border border-white/5 relative shadow-inner">
                    <div className="h-full w-[65%] bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] relative z-10" />
                    <div className="h-full w-[23.42%] bg-gradient-to-r from-purple-700 to-magenta-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                </div>
                <div className="flex justify-between text-[8px] mt-2 font-mono tracking-tighter opacity-70">
                    <span className="text-cyan-500 font-bold">[LOCAL: 65%]</span>
                    <span className="text-purple-500 font-bold">[CLOUD: 23%]</span>
                </div>
            </div>

            {/* B. Switches */}
            <NeonToggle
                label="NEURAL AUTO"
                isActive={neuralActive}
                onClick={() => setNeural(!neuralActive)}
                color="emerald"
            />
            <NeonToggle
                label="LOCAL FIRST"
                isActive={localActive}
                onClick={() => setLocal(!localActive)}
                color="cyan"
            />

            {/* C. Network Stats (Dynamic) */}
            <div className="grid grid-cols-1 gap-2">
                <StatBlock value={`$${wealthTotal.toLocaleString()}`} label="Est. Wealth" sub="Wealth potential generated" />
                <StatBlock value={`${String(activeCount).padStart(2, '0')} Active`} label="Queue Status" sub={`${Math.max(0, activeCount - 1).toString().padStart(2, '0')} Queued / ${activeCount === 0 ? '00' : '00'} Idle`} />
                <StatBlock value={latencyAvg} label="Latency Avg" />
                <StatBlock value={bandwidth} label="Bandwidth" />
            </div>

            {/* D. User Profile (Spacer to push to bottom) */}
            <div className="mt-auto space-y-2 pb-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-lg border border-slate-700 flex items-center space-x-3 group cursor-pointer hover:border-cyan-500/30 transition-all">
                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                        <User size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-200">A. JENKINS</div>
                        <div className="text-[9px] text-slate-500 font-mono">// LEADER</div>
                    </div>
                </div>

                <button className="w-full flex items-center justify-center space-x-2 p-2 rounded border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all">
                    <Settings size={12} />
                    <span className="text-[10px] font-bold">SETTINGS</span>
                </button>
            </div>
        </div>
    );
}
