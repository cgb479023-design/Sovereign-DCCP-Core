# Sovereign-DCCP-Core 深度系统架构与工作流全解析 (NotebookLM 专业版)

## 一、 系统定位与概述
**项目名称**: Sovereign-DCCP-Core ( Digital Command & Control Protocol - 数字命令与控制协议中心引擎 )
**核心愿景**: 提供一个能联通并中转多模型（云端/Web端Agent）智能，并打破“云端模型/Web浏览器”与“本地物理环境系统”次元壁的**去中心化调度中心与物理接驳设施 (DCCP Bridge)**。

项目不只是一个普通的后端代理服务，更像是一个拥有**进化意识与免疫闭环**的“AI神经中控”。它不仅分发任务，还通过特有的“代际”、“主权等级”、“握手协议”、“IPE审计程序”以及“物理落盘桥”，构建了一个绝对遵循指令、并拒绝向环境妥协的稳健生命周期闭环。

---

## 二、 核心架构模块 (System Topography)

整个网络采用**Master-Slave Inversion**架构，以 Node.js 的**DCCP Core 为核心主导 (The Brain & Forge)**，一切流转和变更由后端发起，前端大屏等只作为态势观察端。

### 1. 神经路由器 (Neural Router)
**使命**: 集意志传导、策略转发、动态寻址与审计为一体的核心脑干。
- **动态选路**: 接收 `DCCPPacket` (意志包)，通过策略匹配最佳 Adapter (如 OpenAI, Anthropic, Google, Arena 等)。
- **算力节点甄别**: 从 `AgentRegistry` 请求最高“主权完备度” (Sovereignty Score) 的活动节点进行处理。若初始节点未授权或握手失败，会触发 **AutoSwitch 自动寻优切换** (免疫特性)。
- **IPE审计与封禁 (Audit)**: 所有节点返回的数据并非盲目采信。Neural Router 会拦截输出执行 IPE审计，如发现包含占位符、没有完全执行任务内容(TEMPLATE / TODO)、破坏了 JSON 约束等，则严格扣减该落盘任务的主权分，并标记审计失败。
- **落盘信号发射**: 只有在审核达标 (sovereigntyScore >= 70) 的前提下，组装携带目标文件路线的 `DiskIngestSignal` 发送至总线。

### 2. 算力节点注册中心 (Agent Registry)
**使命**: 全栈追踪和监控所有接入算力单元的健康、能力与代际演进状态。
- **算力接入与代际 (Tier)**: 归档每个节点，类型涵盖 `API` 甚至 `WEB_GHOST` (挂载在无头浏览器上的幽灵算力)。节点自带代际属性 (v1.5, v2.0, vNext)，高代际节点掌握更多权力参数。
- **主权完备度评估体系 (Sovereignty Score)**: 新节点入网时计算初始主权分（基础50分，vNext代际+35，能函数调用+5，支持Web自动化附加+10等等）。高主权节点在多节点池中获得优先级保障。
- **防腐与心跳 (Heartbeat)**: 内置存活自检 (cleanupInactive)，一旦超时五分钟未发送心跳，直接移除该死亡算力，防止任务路由遇到死胡同。

### 3. DCCP物理接驳桥 (DCCP Bridge)
**使命**: 从云端意图到实体磁盘存储的**物理执行终端**。
- **安全的意志实体化 (Sanitization)**: 它能将捕获的代码和逻辑写为实体文件，利用 `sanitizePath` 防止极其恶劣的 `../` 路径穿越攻击导致 OS 中毒，锁定 `rootDir` 边界。
- **无感创建与更新**: 支持自动递归创建所有必要的父级文件夹结构。支持单体落盘 (`ingest`) 和集群协同落盘 (`batchIngest`)。
- **自愈式版本控制 (Backup Strategy)**: 提供文件覆盖前的自动备份策略（`.dccp/backups/<filename>.bak`），支持生命周期自动清理保护。这是核心的**免崩溃护城河**。

### 4. Arena 模型竞技中心与适配器群组 (Adapters/ArenaAdapter)
适配器不局限于简单的 Provider API 对接。以**ArenaAdapter**为例：
- **对抗审计模式 (Adversarial Audit)**: 在分派任务时强制注入系统约束，摒弃闲聊，对齐 JSON 返回格式。
- **重构撕裂 (Recover Engine)**: 极尽强大的容错 JSON 提取引擎。无视大模型经常夹杂的废话，通过正则精准切割 JSON 甚至 Markdown 中的代码块。
- **多模型共识 (Async Vote)**: 对抗投票，能够发送多路请求给不同模型矩阵，并计算共识率获取最终输出结果，彻底规避单一由于平台风控而致的截断阻断。

---

## 三、 端到端闭环完整工作流 (End-to-End Closed Loop)

DCCP Core 执行机制严格遵循“发起 -> 路由 -> 审计 -> 物理落盘 -> 态势反馈”的免疫循环工作流，确保系统面对任何环境变异（诸如：风控/DOM变动/网络异常）不直接崩塌。

### 【Phase 1：意志触发与握手介入】 (Ingestion & Handshake)
1. 系统内任意子进程 / 浏览器插件 / API前端 发送包含 `dna_payload` 和 `constraints` 的意图请求至。
2. **NeuralRouter** 激活，分析指纹意图。匹配最佳的执行终端（在 v2.0 与 vNext 节点间寻找具备最高主权特性的节点）。
3. 激活 **`ProtocolHandshake`**：与节点握手，若权限不足，自发启动 `Auto Switch` 调度容灾替代方案。

### 【Phase 2：适配转换与攻防传导】 (Transformation & Execution)
4. 将 DCCP Packet 路由进对应的特定适配器（例如 ArenaCluster）。
5. 融合系统级底层预设安全和逻辑限制。
6. 并发或限时 `executeWithTimeout` 执行，如超时则自动阻断，切断长时间未响应的毒瘤链路。

### 【Phase 3：免疫审查机制】 (IPE Audit)
7. 输出返回后立刻进入 **Recover 组件**，从混乱输出中剥离纯粹有效业务载荷（JSON）。
8. 进入 NeuralRouter 的 **`performAudit`**:
   - 如果发现偷懒（含 TODO、TEMPLATE）：扣除 30 分！
   - 如果违背了 `STRICT_JSON_OUTPUT`：扣除 25 分！
   - 如果 JSON 炸裂：扣除 40 分！
9. 任何分值跌落及格线 (70) 的意志都会被定性为“腐化结果”，禁止执行后续操作并报警。

### 【Phase 4：物理接驳与覆盖落库】 (Physical Manifestation)
10. 一旦通过审计，Router 自动在事件总线 `EventBus` 发送 `diskIngestSignal` 广播。
11. **DCCP Bridge** 监听到指令，激活文件流。为将被覆盖的原文件做 `.bak` 物理缓存。随后强制实施写入，将代码和指令彻底固化在物理 OS 数据盘。
12. 数据库和文件系统双双被激活。

### 【Phase 5：战术大屏事件同步】 (Surveillance Feed)
13. 同时，Socket.io (`ws://localhost:51124/dccp-events`) 监听以上发生的所有流转节点信息、节点的健康程度、负载、算力消耗。
14. 将最新态势以 `nodesSnapshot` 和 `auditComplete` 等事件即时多播到 React 战术大屏的观察域进行渲染。系统回到空闲并等待新一轮请求，从而形成了**完美的数据自治进化闭环**。

--- 

## 四、 本资料专为 NotebookLM 使用设计的知识脉络 (Prompt Optimization)
1. **关键词关联**: Query "如何防崩溃" -> 关联 [Sovereignty Score 审计机制], [Auto Switch 切换], [Backup 物理恢复层], [Arena JSON Recover]。
2. **系统定位分析**: Master-Slave Inversion，后端主导，拒绝前端自发操作，一切请求需上报 NeuralRouter -> Bridge 落库体系。
3. **架构隐喻**: 
   - Cortex / 脑干 -> Neural Router
   - Nervous System / 神经网 -> Socket.io & EventBus
   - Manipulator / 机械臂 -> DCCP Bridge
   - Organs / 分泌器 -> Agent Registry Nodes
