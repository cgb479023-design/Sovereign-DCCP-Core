import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Terminal, Send, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { clsx } from 'clsx';

interface BottomDeckProps {
    manifest: any[];
}

const BottomDeck: React.FC<BottomDeckProps> = ({ manifest }) => {
    const [cmd, setCmd] = useState('');

    const handleDispatch = () => {
        if (!cmd.trim()) return;
        fetch('http://localhost:51124/api/dccp/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directive: cmd, target: 'auto' })
        }).catch(console.error);
        setCmd('');
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* Manifest Stream */}
            <div className="col-span-12 md:col-span-7 bg-[#0d1520]/60 border border-slate-800/80 rounded-xl p-4 flex flex-col relative group backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent group-hover:via-cyan-500/40 transition-all duration-1000" />

                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <Terminal size={12} className="text-cyan-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-cyan-500/80 uppercase">Live Manifest Stream</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-slate-600 font-mono">ENCRYPTED</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed custom-scrollbar pl-2 space-y-1.5">
                    {manifest.length === 0 && (
                        <div className="text-slate-700 italic h-full flex items-center justify-center text-[9px] tracking-widest">
                            {">"} PENDING INBOUND TELEMETRY...
                        </div>
                    )}
                    <AnimatePresence mode="popLayout">
                        {manifest.map((log: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-3 group/item hover:bg-white/2 transition-colors py-0.5"
                            >
                                <span className="text-[#334155] shrink-0">[{log.time}]</span>
                                <span className={clsx(
                                    "font-black shrink-0 whitespace-nowrap",
                                    log.agent.includes('ERROR') ? 'text-red-500' :
                                        log.agent.includes('WEALTH') ? 'text-emerald-400' :
                                            log.agent.includes('NEXUS') ? 'text-purple-400' : 'text-cyan-600'
                                )}>
                                    {log.agent}::
                                </span>
                                <span className="text-slate-400 group-hover/item:text-slate-200 transition-colors uppercase font-mono">{log.msg}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Command Interface */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
                <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between shadow-inner relative group overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />

                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase">Command Nexus</span>
                            <Cpu size={14} className="text-slate-700" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-cyan-600 font-mono tracking-tighter uppercase transition-opacity group-focus-within:opacity-100">Execute Order {">"}</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-900/40 to-transparent" />
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={cmd}
                                    onChange={(e) => setCmd(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleDispatch()}
                                    placeholder="INITIATE OPERATIONS..."
                                    className="w-full bg-transparent border-none text-cyan-300 font-mono text-base tracking-widest placeholder:text-slate-800 focus:ring-0 focus:outline-none py-2"
                                    autoComplete="off"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleDispatch}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-cyan-500/10 text-cyan-500 rounded-md border border-cyan-500/20 hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                >
                                    <Send size={18} />
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={10} className="text-slate-700" />
                            <span className="text-[8px] text-slate-700 font-mono tracking-widest">AUTH: 0x8F...1A2B // LEVEL_5_CLEAR</span>
                        </div>
                        <span className="text-[8px] text-slate-800 font-mono animate-pulse uppercase tracking-[0.2em]">Press return to broadcast</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BottomDeck;
