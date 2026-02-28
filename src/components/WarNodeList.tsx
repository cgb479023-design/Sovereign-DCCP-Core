import React from 'react';
import WarNodeCard from './WarNodeCard';
import { Plus } from 'lucide-react';

interface Props {
    nodes: any[];
    selectedNodeId: string | null;
    onSelectNode: (id: string) => void;
    onDeployNode: () => void;
    nodeMessages?: Record<string, string>;
}

const WarNodeList: React.FC<Props> = ({ nodes, selectedNodeId, onSelectNode, onDeployNode, nodeMessages = {} }) => {
    return (
        <div className="h-full flex flex-col pr-2 overflow-y-auto scrollbar-hide relative pb-8">
            <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                    <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">War-Nodes</span>
                </div>
                <span className="text-[9px] text-emerald-500 font-mono animate-pulse tracking-widest uppercase">Live // {nodes.length}</span>
            </div>

            <button
                onClick={onDeployNode}
                className="mb-2 shrink-0 border border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-bold font-mono py-1 rounded transition-colors flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] tracking-widest w-full"
            >
                <Plus size={10} /> DEPLOY GHOST
            </button>

            <div className="flex-1 grid grid-cols-1 gap-1.5 content-start">
                {nodes.map(node => (
                    <WarNodeCard
                        key={node.nodeId}
                        node={node}
                        isSelected={selectedNodeId === node.nodeId}
                        onClick={() => onSelectNode(node.nodeId)}
                        latestMessage={nodeMessages[node.nodeId]}
                    />
                ))}
                {nodes.length === 0 && (
                    <div className="text-[9px] text-slate-700 font-mono text-center mt-10 tracking-[0.2em]">
                        SENSORS_OFFLINE
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarNodeList;
