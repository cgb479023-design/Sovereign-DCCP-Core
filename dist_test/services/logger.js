"use strict";
// File: g:/Sovereign-DCCP-Core/server/services/logger.ts
// DCCP 结构化日志系统 - 基于 Winston
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalLogger = exports.DCPLogger = void 0;
exports.createLogger = createLogger;
exports.createDCPLogger = createDCPLogger;
exports.initLogger = initLogger;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * 创建 DCCP 日志实例
 */
function createLogger(config) {
    // 确保日志目录存在
    const logDir = path_1.default.dirname(config.filePath);
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
    // 自定义格式化
    const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}] DCCP: ${message}`;
        if (Object.keys(meta).length > 0 && meta.stack) {
            log += `\n  Stack: ${meta.stack}`;
        }
        else if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
        }
        return log;
    }));
    // JSON 格式化 (用于日志收集)
    const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
    const transports = [
        // 控制台输出
        new winston_1.default.transports.Console({
            format: customFormat,
            level: config.level
        }),
        // 错误日志文件
        new winston_1.default.transports.File({
            filename: config.filePath.replace('.log', '.error.log'),
            level: 'error',
            format: jsonFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: config.maxFiles
        }),
        // 组合日志文件
        new winston_1.default.transports.File({
            filename: config.filePath,
            format: jsonFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: config.maxFiles
        })
    ];
    const logger = winston_1.default.createLogger({
        level: config.level,
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        },
        transports,
        exitOnError: false
    });
    return logger;
}
/**
 * DCCP 日志类别
 */
class DCPLogger {
    constructor(logger, context) {
        this.logger = logger;
        this.context = context;
    }
    formatMessage(message) {
        return `[${this.context}] ${message}`;
    }
    error(message, meta) {
        this.logger?.error(this.formatMessage(message), meta);
    }
    warn(message, meta) {
        this.logger?.warn(this.formatMessage(message), meta);
    }
    info(message, meta) {
        this.logger?.info(this.formatMessage(message), meta);
    }
    debug(message, meta) {
        this.logger?.debug(this.formatMessage(message), meta);
    }
    // 专用方法
    logRequest(method, path, status, duration) {
        this.info(`${method} ${path} - ${status} (${duration}ms)`, { method, path, status, duration });
    }
    logExecution(packetId, adapter, node, duration) {
        this.info(`Execution: ${packetId} -> ${adapter}@${node}`, { packetId, adapter, node, duration });
    }
    logAudit(packetId, passed, score) {
        this.info(`Audit: ${packetId} - ${passed ? 'PASSED' : 'FAILED'} (${score}%)`, { packetId, passed, score });
    }
    logIngest(filePath, size) {
        this.info(`Ingest: ${filePath} (${size} bytes)`, { filePath, size });
    }
    logNodeEvent(nodeId, event, details) {
        this.info(`Node ${event}: ${nodeId}`, { nodeId, event, ...details });
    }
}
exports.DCPLogger = DCPLogger;
/**
 * 创建带上下文的日志器
 */
function createDCPLogger(context) {
    return new DCPLogger(exports.globalLogger, context);
}
/**
 * 初始化全局日志系统
 */
function initLogger(config) {
    exports.globalLogger = createLogger(config);
    return exports.globalLogger;
}
