import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, Zap, Radio } from 'lucide-react';

interface NeuralLatticeProps {
    nodes: any[];
    activeNodeIds: string[];
    selectedNodeId?: string | null;
}

export default function NeuralLattice({ nodes, activeNodeIds, selectedNodeId }: NeuralLatticeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use refs for dynamic data to prevent canvas remount flickering
    const nodesRef = useRef(nodes);
    const activeIdsRef = useRef(activeNodeIds);
    const selectedIdRef = useRef(selectedNodeId);

    // Track coordinates of nodes for HTML overlay positioning
    const [selectedCoords, setSelectedCoords] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        nodesRef.current = nodes;
        activeIdsRef.current = activeNodeIds;
        selectedIdRef.current = selectedNodeId;
    }, [nodes, activeNodeIds, selectedNodeId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // --- HiDPI Engine Initialization ---
        const resize = () => {
            const { clientWidth, clientHeight } = container;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = clientWidth * dpr;
            canvas.height = clientHeight * dpr;
            canvas.style.width = `${clientWidth}px`;
            canvas.style.height = `${clientHeight}px`;
            ctx.scale(dpr, dpr);
        };
        window.addEventListener('resize', resize);
        resize();

        let time = 0;

        // --- Star Topology Render Loop ---
        const render = () => {
            time += 0.005; // Global orbital speed
            const w = container.clientWidth;
            const h = container.clientHeight;
            const cx = w / 2;
            const cy = h / 2;

            // Define orbital ellipse radii
            const rx = w * 0.35;
            const ry = h * 0.35;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Central SOVEREIGN-NEXUS
            const nexusPulse = 15 + Math.sin(time * 8) * 3;
            ctx.shadowBlur = 35 + Math.sin(time * 6) * 15;
            ctx.shadowColor = '#d946ef'; // Cyber-magenta core
            ctx.fillStyle = '#d946ef';
            ctx.beginPath();
            ctx.arc(cx, cy, nexusPulse, 0, Math.PI * 2);
            ctx.fill();

            // Nexus hot core
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, nexusPulse * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Nexus Holographic Label
            ctx.font = 'bold 12px Orbitron';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('SOVEREIGN-NEXUS', cx, cy - nexusPulse - 12);

            // 2. Map the Orbital Fleet
            const currentNodes = nodesRef.current;
            const nodeCount = currentNodes.length;
            let currentSelectedCoords: { x: number, y: number } | null = null;

            currentNodes.forEach((node, i) => {
                const isActive = activeIdsRef.current.includes(node.nodeId);
                const isSelected = selectedIdRef.current === node.nodeId;

                // Orbital mechanics (some counter-orbit for chaos)
                const offset = (Math.PI * 2 * i) / nodeCount;
                const angle = offset + (i % 2 === 0 ? time * 0.8 : -time * 0.5);

                const px = cx + Math.cos(angle) * rx;
                const py = cy + Math.sin(angle) * ry;

                if (isSelected) {
                    currentSelectedCoords = { x: px, y: py };
                }

                // 2.a Draw Data Tethers (Bezier curves)
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const cpX = cx + Math.cos(angle - 0.5) * rx * 0.4;
                const cpY = cy + Math.sin(angle - 0.5) * ry * 0.4;
                ctx.quadraticCurveTo(cpX, cpY, px, py);

                ctx.strokeStyle = isActive || isSelected
                    ? 'rgba(34, 211, 238, 0.9)' // Active/Selected: intense cyan
                    : 'rgba(71, 85, 105, 0.4)'; // Idle: slate
                ctx.lineWidth = isActive || isSelected ? 1.5 : 0.8;

                if (isActive || isSelected) {
                    ctx.shadowBlur = isSelected ? 20 : 10;
                    ctx.shadowColor = '#22d3ee';
                } else {
                    ctx.shadowBlur = 0;
                }
                ctx.stroke();

                // 2.b Draw Targeting Reticle for Selected Node
                if (isSelected) {
                    const reticleRadius = 15 + Math.sin(time * 15) * 5;
                    ctx.beginPath();
                    ctx.arc(px, py, reticleRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = '#22d3ee';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]); // Dashed circle
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset dash

                    // Crosshairs
                    ctx.beginPath();
                    ctx.moveTo(px - reticleRadius - 5, py);
                    ctx.lineTo(px - Math.max(0, reticleRadius - 2), py);
                    ctx.moveTo(px + reticleRadius + 5, py);
                    ctx.lineTo(px + Math.max(0, reticleRadius - 2), py);
                    ctx.moveTo(px, py - reticleRadius - 5);
                    ctx.lineTo(px, Math.max(0, py - reticleRadius + 2));
                    ctx.moveTo(px, py + reticleRadius + 5);
                    ctx.lineTo(px, py + Math.max(0, reticleRadius - 2));
                    ctx.stroke();
                }

                // 2.c Draw the Agent Nodes
                ctx.shadowBlur = isActive || isSelected ? 15 : 5;
                ctx.shadowColor = isActive || isSelected ? '#22d3ee' : '#d946ef';
                ctx.fillStyle = isActive || isSelected ? '#22d3ee' : '#d946ef';
                ctx.beginPath();
                ctx.arc(px, py, isActive || isSelected ? 4 : 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, py, isActive || isSelected ? 2 : 1, 0, Math.PI * 2);
                ctx.fill();

                // 2.d Draw Node Designation
                ctx.font = isSelected ? 'bold 10px "JetBrains Mono"' : '9px "JetBrains Mono"';
                ctx.fillStyle = isSelected ? '#ffffff' : (isActive ? '#22d3ee' : '#94a3b8');
                ctx.textAlign = px > cx ? 'left' : 'right';
                const textOffsetX = px > cx ? 12 : -12;
                ctx.fillText(node.nodeId.toUpperCase(), px + textOffsetX, py + (isSelected ? 4 : 3));

                // 2.e Ambient Active Particles
                if (isActive || isSelected) {
                    const pTime = time * (isSelected ? 12 : 8);
                    for (let p = 0; p < (isSelected ? 5 : 3); p++) {
                        const pAngle = pTime + (Math.PI * 2 * p / (isSelected ? 5 : 3));
                        const pr = isSelected ? 12 : 8;
                        const ppx = px + Math.cos(pAngle) * pr;
                        const ppy = py + Math.sin(pAngle) * pr;

                        ctx.fillStyle = '#22d3ee';
                        ctx.beginPath();
                        ctx.arc(ppx, ppy, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });

            // Update HTML overlay position only if it has moved significantly to avoid React churn
            if (currentSelectedCoords) {
                setSelectedCoords(prev => {
                    if (!prev || Math.abs(prev.x - currentSelectedCoords!.x) > 1 || Math.abs(prev.y - currentSelectedCoords!.y) > 1) {
                        return currentSelectedCoords;
                    }
                    return prev;
                });
            } else {
                setSelectedCoords(null);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const selectedNode = selectedNodeId ? nodes.find(n => n.nodeId === selectedNodeId) : null;

    return (
        <div ref={containerRef} className="relative w-full h-full bg-slate-900/40 rounded-lg overflow-hidden border border-slate-700/50 shadow-neon-cyan backdrop-blur-sm">
            {/* Top UI Bar */}
            <div className="absolute top-0 left-0 w-full h-8 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-4 z-10 pointer-events-none">
                <span className="text-[10px] font-bold text-cyan-500/80 tracking-widest font-sans uppercase">NEURAL LATTICE TOPOLOGY</span>
                <div className="flex items-center gap-3">
                    <span className="text-[8px] text-slate-500 font-mono tracking-widest">{nodes.length} NODES // {nodes.length > 0 ? nodes.length * 12 : 0} LINKS</span>
                    <div className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} className="block" />

            {/* Holographic Telemetry HUD Overlay */}
            <AnimatePresence>
                {selectedNode && selectedCoords && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="absolute z-20 pointer-events-none"
                        style={{
                            left: `${Math.min(selectedCoords.x + 30, containerRef.current?.clientWidth! - 220)}px`,
                            top: `${Math.max(40, Math.min(selectedCoords.y - 60, containerRef.current?.clientHeight! - 180))}px`,
                        }}
                    >
                        <div className="w-[200px] bg-[#050B14]/90 border border-cyan-500/50 rounded p-3 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-md">
                            <div className="flex justify-between items-start border-b border-slate-800/80 pb-2 mb-2">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-mono">[{selectedNode.provider}]</div>
                                    <div className="text-[13px] text-cyan-400 font-bold tracking-wider uppercase mt-0.5 shadow-cyan-400/50 drop-shadow">{selectedNode.nodeId}</div>
                                </div>
                                <div className="text-[10px] text-emerald-500 font-bold border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-500/10 uppercase animate-pulse">
                                    {selectedNode.status || 'ACTIVE'}
                                </div>
                            </div>

                            <div className="space-y-2 mt-3">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-slate-500 flex items-center gap-1.5"><Cpu size={10} /> CORE LOAD</span>
                                    <span className="text-cyan-400">{selectedNode.load || Math.floor(Math.random() * 40 + 10)}%</span>
                                </div>

                                <div className="w-full h-1 bg-slate-800 overflow-hidden rounded-full">
                                    <div
                                        className="h-full bg-cyan-400 shadow-[0_0_8px_cyan]"
                                        style={{ width: `${selectedNode.load || Math.floor(Math.random() * 40 + 10)}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                                    <span className="text-slate-500 flex items-center gap-1.5"><Radio size={10} /> FREQUENCY</span>
                                    <span className="text-slate-300">{(Math.random() * 2 + 1).toFixed(3)} GHz</span>
                                </div>
                            </div>
                        </div>

                        {/* Connection line from HUD to Reticle */}
                        <svg className="absolute top-1/2 -left-6 w-6 h-1 -translate-y-1/2 overflow-visible">
                            <line x1="0" y1="0" x2="24" y2="0" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
                            <circle cx="0" cy="0" r="2" fill="#22d3ee" />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
