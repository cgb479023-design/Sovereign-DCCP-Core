// File: g:/Sovereign-DCCP-Core/server/services/eventBus.ts
// 实时事件总线 - 通过 Socket.io 将后端事件实时推送到前端
// 实现指挥中心与算力网络的低延迟信息同步

import { Server as SocketIoServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AgentConfig, RegistryStats } from '../core/AgentRegistry';
import { AuditResult } from '../core/NeuralRouter';
import EventEmitter from 'events'; // 引入Node.js内置的EventEmitter

export interface NodeSnapshotPayload {
    nodeId: string;
    provider: string;
    tier: string;
    status: 'active' | 'dormant' | 'offline';
    load: number; // 0-100
    sovereigntyScore: number; // 0-100
    willDeviation: number; // 0-100 意志偏离度
    lastSeen: number;
}

export interface ExecutionEventPayload {
    packetId: string;
    adapterId: string;
    nodeId: string;
    nodeTier: string;
    message: string;
    timestamp: number;
}

export interface AuditEventPayload {
    packetId: string;
    audit: AuditResult;
    timestamp: number;
}

export type AlertType = 'info' | 'warning' | 'error' | 'success';

export class EventBus extends EventEmitter { // 继承EventEmitter
    private io: SocketIoServer | null = null;
    private clients: Map<string, Socket> = new Map();

    constructor() {
        super(); // 调用父类构造函数
    }

    /**
     * 初始化 Socket.io 服务器
     */
    public init(httpServer: HttpServer): SocketIoServer {
        this.io = new SocketIoServer(httpServer, {
            cors: {
                origin: "*", // 允许所有来源，生产环境应限制为特定前端地址
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`[EventBus] 📡 客户端连接: ${socket.id}`);
            this.clients.set(socket.id, socket);

            // 示例：发送欢迎消息和初始状态
            socket.emit('welcome', { message: 'Connected to Sovereign DCCP Core Event Bus', timestamp: Date.now() });

            socket.on('disconnect', () => {
                console.log(`[EventBus] 🔌 客户端断开: ${socket.id}`);
                this.clients.delete(socket.id);
            });

            // 监听前端发出的节点命令
            socket.on('nodeCommand', (data: { command: string; nodeId: string }) => {
                console.log(`[EventBus] 收到前端节点命令: ${data.command} -> ${data.nodeId} (由 ${socket.id} 发出)`);
                // 将命令转发给需要处理的模块（例如 AgentRegistry）
                // 使用内置的EventEmitter来通知后端其他模块
                this.emit('commandReceived', data);
            });
        });

        console.log('[EventBus] ✨ Socket.io 服务器已启动');
        return this.io;
    }

    /**
     * 发射事件到所有连接的客户端
     */
    public emit(event: string, payload: any): boolean {
        if (this.io) {
            this.io.emit(event, payload);

            // 下发通用聚合事件以供终端监视器打印所有日志
            if (event !== 'nodesSnapshot' && event !== 'statsSnapshot') {
                this.io.emit('dccpEvent', { type: event, timestamp: Date.now(), payload });
            }

            super.emit(event, payload); // 同时通过内置EventEmitter发出，供后端内部监听
            return true;
        }
        console.warn('[EventBus] Socket.io 未初始化，事件无法发射。');
        return false;
    }

    /**
     * 发送系统警报
     */
    public emitAlert(type: AlertType, message: string): void {
        this.emit('alert', { type, message, timestamp: Date.now() });
    }

    /**
     * 推送节点快照更新
     */
    public pushNodeSnapshot(nodes: NodeSnapshotPayload[]): void {
        this.emit('nodesSnapshot', nodes);
    }

    /**
     * 推送适配器运行日志/进度
     */
    public pushAdapterLog(log: ExecutionEventPayload): void {
        this.emit('adapterLog', log);
    }

    /**
     * 推送审计结果
     */
    public pushAuditResult(audit: AuditEventPayload): void {
        this.emit('auditResult', audit);
    }

    // ... 可以添加更多特定事件推送方法

    public getIoInstance(): SocketIoServer | null {
        return this.io;
    }
}

export const eventBus = new EventBus();
