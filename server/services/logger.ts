// File: g:/Sovereign-DCCP-Core/server/services/logger.ts
// DCCP 结构化日志系统 - 基于 Winston

import winston from 'winston';
import path from 'path';
import fs from 'fs';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LoggerConfig {
  level: LogLevel;
  filePath: string;
  maxFiles: number;
}

/**
 * 创建 DCCP 日志实例
 */
export function createLogger(config: LoggerConfig): winston.Logger {
  // 确保日志目录存在
  const logDir = path.dirname(config.filePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 自定义格式化
  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}] DCCP: ${message}`;

      if (Object.keys(meta).length > 0 && meta.stack) {
        log += `\n  Stack: ${meta.stack}`;
      } else if (Object.keys(meta).length > 0) {
        log += ` | ${JSON.stringify(meta)}`;
      }

      return log;
    })
  );

  // JSON 格式化 (用于日志收集)
  const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  );

  const transports: winston.transport[] = [
    // 控制台输出
    new winston.transports.Console({
      format: customFormat,
      level: config.level
    }),

    // 错误日志文件
    new winston.transports.File({
      filename: config.filePath.replace('.log', '.error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles
    }),

    // 组合日志文件
    new winston.transports.File({
      filename: config.filePath,
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: config.maxFiles
    })
  ];

  const logger = winston.createLogger({
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
export class DCPLogger {
  private logger: winston.Logger;
  private context: string;

  constructor(logger: winston.Logger, context: string) {
    this.logger = logger;
    this.context = context;
  }

  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`;
  }

  error(message: string, meta?: any): void {
    this.logger?.error(this.formatMessage(message), meta);
  }

  warn(message: string, meta?: any): void {
    this.logger?.warn(this.formatMessage(message), meta);
  }

  info(message: string, meta?: any): void {
    this.logger?.info(this.formatMessage(message), meta);
  }

  debug(message: string, meta?: any): void {
    this.logger?.debug(this.formatMessage(message), meta);
  }

  // 专用方法
  logRequest(method: string, path: string, status: number, duration: number): void {
    this.info(`${method} ${path} - ${status} (${duration}ms)`, { method, path, status, duration });
  }

  logExecution(packetId: string, adapter: string, node: string, duration: number): void {
    this.info(`Execution: ${packetId} -> ${adapter}@${node}`, { packetId, adapter, node, duration });
  }

  logAudit(packetId: string, passed: boolean, score: number): void {
    this.info(`Audit: ${packetId} - ${passed ? 'PASSED' : 'FAILED'} (${score}%)`, { packetId, passed, score });
  }

  logIngest(filePath: string, size: number): void {
    this.info(`Ingest: ${filePath} (${size} bytes)`, { filePath, size });
  }

  logNodeEvent(nodeId: string, event: string, details?: any): void {
    this.info(`Node ${event}: ${nodeId}`, { nodeId, event, ...details });
  }
}

/**
 * 创建带上下文的日志器
 */
export function createDCPLogger(context: string): DCPLogger {
  return new DCPLogger(globalLogger, context);
}

// 全局日志实例
export let globalLogger: winston.Logger;

/**
 * 初始化全局日志系统
 */
export function initLogger(config: LoggerConfig): winston.Logger {
  globalLogger = createLogger(config);
  return globalLogger;
}
