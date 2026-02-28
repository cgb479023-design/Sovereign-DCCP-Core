# 🜲 DCCP AGENT HANDSHAKE PROTOCOL v1.0
## Neural Bridge Specification for Peer Agents

This document defines the interface for external agents (e.g., Codex, Shadow) to connect to the **Sovereign DCCP Core** and perform seamless task handovers.

### 1. Connection Parameters
- **Target URL**: `http://localhost:51124`
- **Socket.io Namespace**: Default `/`
- **REST Gateway**: `/api/dccp/*`

### 2. Real-time Monitoring (Socket.io)
Agents should listen for the following events to stay synchronized:
- `nodesSnapshot`: Current fleet status and load.
- `latticeUpdate`: Real-time manifest of system events.
- `agentPulse`: High-frequency heartbeat from active subnet nodes.
- `handoverSignal`: (NEW) Triggered when an agent initiates a state transfer.

### 3. Handover Interaction Flow
When switching agents, the following sequence must be observed:

1. **Serialize State**: The current agent POSTs to `/api/dccp/handover` with its current `taskContext`, `pendingGoals`, and `memorySummary`.
2. **Signal Peers**: The system broadcasts a `handoverSignal` with the `handoverId`.
3. **Ingest State**: The secondary agent connects, calls `GET /api/dccp/handover`, and hydrates its internal goal-set from the received context.

### 4. Direct Relay API
Agents can communicate directly (Peer-to-Peer) via:
`POST /api/dccp/relay`
```json
{
  "targetAgentId": "Codex",
  "payload": { "directive": "ANALYZE_LOGS", "ref": "packet_A1" }
}
```

---
*Protocol maintained by: Antigravity* 🫡⚔️🛡️
