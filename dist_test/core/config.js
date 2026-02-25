"use strict";
// File: g:/Sovereign-DCCP-Core/server/core/config.ts
// DCCP 配置管理 - 外部化配置
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.getConfig = getConfig;
exports.createDefaultConfig = createDefaultConfig;
const fs_1 = __importDefault(require("fs"));
const defaultConfig = {
    server: {
        port: 51124,
        env: 'development',
        corsOrigins: ['http://localhost:3000', 'http://localhost:5173']
    },
    log: {
        level: 'info',
        filePath: './logs/dccp.log',
        maxFiles: 7
    },
    router: {
        enableAudit: true,
        enableAutoSwitch: true,
        maxRetries: 3,
        timeoutMs: 30000
    },
    adapters: {},
    nodes: {
        registry: [
            { id: 'gemini-node', provider: 'GOOGLE', tier: 'v2.0', type: 'API' },
            { id: 'claude-node', provider: 'ANTHROPIC', tier: 'v2.0', type: 'API' },
            { id: 'gpt-node', provider: 'OPENAI', tier: 'v1.5', type: 'API' },
            { id: 'arena-node', provider: 'ARENA', tier: 'vNext', type: 'WEB_GHOST' }
        ]
    },
    bridge: {
        rootDir: './',
        allowedExtensions: ['.ts', '.js', '.json', '.md', '.txt', '.yaml', '.yml', '.css', '.html', '.tsx', '.jsx'],
        enableBackup: true,
        backupDir: '.dccp/backups',
        backupMaxAge: 7
    }
};
let config = { ...defaultConfig };
/**
 * 加载配置文件
 */
function loadConfig(configPath) {
    const filePath = configPath || process.env.DCCP_CONFIG_PATH || './dccp-config.yaml';
    try {
        if (fs_1.default.existsSync(filePath)) {
            const content = fs_1.default.readFileSync(filePath, 'utf8');
            // 简单 YAML 解析
            const loaded = parseYaml(content);
            config = mergeDeep(defaultConfig, loaded);
            console.log(`[Config] 配置文件加载成功: ${filePath}`);
        }
        else {
            // 尝试从环境变量加载
            config = loadFromEnv(defaultConfig);
            console.log('[Config] 使用默认配置 + 环境变量');
        }
    }
    catch (error) {
        console.warn(`[Config] 配置加载失败，使用默认: ${error.message}`);
        config = loadFromEnv(defaultConfig);
    }
    return config;
}
/**
 * 获取配置
 */
function getConfig() {
    return config;
}
/**
 * 简单 YAML 解析
 */
function parseYaml(content) {
    const result = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentArray = null;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        // 节标题
        if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
            const key = trimmed.slice(0, -1);
            currentSection = {};
            result[key] = currentSection;
            continue;
        }
        // 数组项
        if (trimmed.startsWith('- ')) {
            if (!currentArray) {
                currentArray = [];
                if (currentSection) {
                    const lastKey = Object.keys(currentSection).pop();
                    if (lastKey)
                        currentSection[lastKey] = currentArray;
                }
            }
            const item = trimmed.slice(2);
            try {
                currentArray.push(JSON.parse(item));
            }
            catch {
                currentArray.push(item);
            }
            continue;
        }
        // 键值对
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
            const key = trimmed.slice(0, colonIndex).trim();
            let value = trimmed.slice(colonIndex + 1).trim();
            if (value === 'true')
                value = true;
            else if (value === 'false')
                value = false;
            else if (!isNaN(Number(value)))
                value = Number(value);
            else if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            if (currentSection) {
                currentSection[key] = value;
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
/**
 * 深度合并
 */
function mergeDeep(target, source) {
    const output = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = mergeDeep(target[key] || {}, source[key]);
        }
        else {
            output[key] = source[key];
        }
    }
    return output;
}
/**
 * 从环境变量加载配置
 */
function loadFromEnv(base) {
    const config = { ...base };
    if (process.env.DCCP_PORT)
        config.server.port = parseInt(process.env.DCCP_PORT);
    if (process.env.NODE_ENV)
        config.server.env = process.env.NODE_ENV;
    if (process.env.DCCP_CORS)
        config.server.corsOrigins = process.env.DCCP_CORS.split(',');
    if (process.env.DCCP_LOG_LEVEL)
        config.log.level = process.env.DCCP_LOG_LEVEL;
    if (process.env.OPENAI_API_KEY) {
        config.adapters.openai = {
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
            defaultModel: process.env.OPENAI_MODEL
        };
    }
    if (process.env.ANTHROPIC_API_KEY) {
        config.adapters.anthropic = {
            apiKey: process.env.ANTHROPIC_API_KEY,
            defaultModel: process.env.ANTHROPIC_MODEL
        };
    }
    if (process.env.GOOGLE_API_KEY) {
        config.adapters.google = {
            apiKey: process.env.GOOGLE_API_KEY,
            defaultModel: process.env.GOOGLE_MODEL
        };
    }
    return config;
}
/**
 * 创建默认配置文件
 */
function createDefaultConfig(filePath = './dccp-config.yaml') {
    const yaml = `# DCCP 主权核心配置文件
# Generated: ${new Date().toISOString()}

server:
  port: 51124
  env: development
  corsOrigins:
    - http://localhost:3000
    - http://localhost:5173

log:
  level: info
  filePath: ./logs/dccp.log
  maxFiles: 7

router:
  enableAudit: true
  enableAutoSwitch: true
  maxRetries: 3
  timeoutMs: 30000

adapters:
  openai:
    apiKey: ${process.env.OPENAI_API_KEY || 'your-openai-key'}
    baseURL: https://api.openai.com/v1
    defaultModel: gpt-4o
  anthropic:
    apiKey: ${process.env.ANTHROPIC_API_KEY || 'your-anthropic-key'}
    defaultModel: claude-sonnet-4-20250514
  google:
    apiKey: ${process.env.GOOGLE_API_KEY || 'your-google-key'}
    defaultModel: gemini-2.0-flash-exp

bridge:
  rootDir: ./
  enableBackup: true
  backupDir: .dccp/backups
  backupMaxAge: 7
`;
    fs_1.default.writeFileSync(filePath, yaml, 'utf8');
    console.log(`[Config] 默认配置已创建: ${filePath}`);
}
