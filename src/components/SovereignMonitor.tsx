import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface NodeStatus {
  nodeId: string;
  provider: string;
  tier: string;
  status: 'active' | 'dormant' | 'offline';
  load: number;
  sovereigntyScore: number;
  lastSeen: number;
}

interface DCCPEvent {
  type: string;
  timestamp: number;
  payload: any;
}

const COLORS = {
  bg: '#0a0e14',
  panel: '#0d1117',
  border: '#1a2332',
  primary: '#00d4ff',
  secondary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#e2e8f0',
  textDim: '#64748b'
};

export default function SovereignMonitor() {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);
  const [events, setEvents] = useState<DCCPEvent[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState({ totalExecutions: 0, successful: 0 });
  const [testIntent, setTestIntent] = useState('');
  const [selectedTier, setSelectedTier] = useState('v3.0_gpt4');
  const [isFiring, setIsFiring] = useState(false);
  const [fireStatus, setFireStatus] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });
  const [sysConfig, setSysConfig] = useState({ enableAudit: true, enableAutoSwitch: true });
  const [viewMode, setViewMode] = useState<'DCCP' | 'RADAR' | 'ANALYSIS'>('DCCP');
  const [radarData, setRadarData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchRadarData = async () => {
    try {
      const resp = await fetch('http://localhost:51124/api/radar/data');
      if (resp.ok) {
        const data = await resp.json();
        setRadarData(data);
      }
    } catch (e) {
      console.error('Radar data fetch failed', e);
    }
  };

  const handleAnalyzeVideo = async (video: any) => {
    setIsAnalyzing(true);
    setViewMode('ANALYSIS');
    setFireStatus({ type: 'idle', msg: `🧪 ANALYZING VIRAL GENOME: ${video.title}...` });
    try {
      const resp = await fetch('http://localhost:51124/api/radar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: video.title, link: video.link })
      });
      if (resp.ok) {
        const data = await resp.json();
        setSelectedAnalysis(data);
        setFireStatus({ type: 'success', msg: 'VIRAL REPORT SYNTHESIZED.' });
      } else {
        setFireStatus({ type: 'error', msg: 'ANALYSIS BREECHED.' });
      }
    } catch (e: any) {
      setFireStatus({ type: 'error', msg: `NODE LINK ERROR: ${e.message}` });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerRadarScan = async () => {
    setIsScanning(true);
    setFireStatus({ type: 'idle', msg: '🛰️ VPH RADAR: OPTICAL SCAN INITIATED...' });
    try {
      const resp = await fetch('http://localhost:51124/api/radar/scan', { method: 'POST' });
      if (resp.ok) {
        setFireStatus({ type: 'success', msg: 'WILL TRANSMITTED: RADAR MATERIALIZING...' });
        // Wait bit for execution then refresh
        setTimeout(fetchRadarData, 15000);
      }
    } catch (e: any) {
      setFireStatus({ type: 'error', msg: `RADAR LINK ERROR: ${e.message}` });
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const newSocket = io('http://localhost:51124');

    newSocket.on('connect', () => {
      console.log('Connected to DCCP');
    });

    newSocket.on('nodesSnapshot', (data: NodeStatus[]) => {
      setNodes(data);
    });

    newSocket.on('dccpEvent', (event: DCCPEvent) => {
      setEvents(prev => [...prev.slice(-99), event]);

      if (event.type === 'auditComplete') {
        setStats(prev => {
          const isSuccess = event.payload?.audit?.passed === true;
          return {
            ...prev,
            totalExecutions: prev.totalExecutions + 1,
            successful: prev.successful + (isSuccess ? 1 : 0)
          };
        });
      }
    });

    newSocket.on('statsSnapshot', (data: any) => {
      if (data && typeof data.totalExecutions === 'number') {
        setStats({
          totalExecutions: data.totalExecutions,
          successful: Math.round(data.totalExecutions * (data.successRate || 1))
        });
        if (data.config) {
          setSysConfig(data.config);
        }
      }
    });

    setSocket(newSocket);
    fetchRadarData();
    const timer = setInterval(fetchRadarData, 30000);

    return () => {
      newSocket.close();
      clearInterval(timer);
    };
  }, []);

  const handleCommand = (nodeId: string, command: string) => {
    socket?.emit('nodeCommand', { command, nodeId });
  };

  const handleFireIntent = async () => {
    if (!testIntent || isFiring) return;
    setIsFiring(true);
    setFireStatus({ type: 'idle', msg: 'COMMUNICATING WITH NEURAL ROUTER...' });

    try {
      const resp = await fetch('http://localhost:51124/api/dccp/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rawIntent: testIntent,
          agentTier: selectedTier,
          targetFilePath: `workspace/ui_test_${Date.now()}.json`
        })
      });

      if (resp.ok) {
        setFireStatus({ type: 'success', msg: 'INTENT MATERIALIZED SUCCESSFULLY' });
        setTestIntent('');
      } else {
        const errorData = await resp.json();
        setFireStatus({ type: 'error', msg: `BLOCKAGE: ${errorData.message || 'Unknown Error'}` });
      }
    } catch (e: any) {
      setFireStatus({ type: 'error', msg: `PHYSICAL LINK FAILURE: ${e.message}` });
    } finally {
      setIsFiring(false);
      setTimeout(() => setFireStatus({ type: 'idle', msg: '' }), 5000);
    }
  };

  const toggleConfig = async (key: 'enableAudit' | 'enableAutoSwitch') => {
    const newConfig = { ...sysConfig, [key]: !sysConfig[key] };
    try {
      await fetch('http://localhost:51124/api/dccp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      setSysConfig(newConfig);
    } catch (e) {
      console.error('Config update failed', e);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return COLORS.success;
    if (status === 'dormant') return COLORS.warning;
    return COLORS.danger;
  };

  const renderCenterPanel = () => {
    if (viewMode === 'ANALYSIS') {
      return (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.primary}`, padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {/* Background Glow */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: `radial-gradient(circle, ${COLORS.secondary}22 0%, transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '16px', zIndex: 1 }}>
            <div>
              <h2 style={{ margin: 0, color: COLORS.primary, fontSize: '20px', letterSpacing: '2px' }}>VIRAL INTELLIGENCE REPORT</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: COLORS.textDim }}>SOVEREIGN GENOME ANALYSIS // PROTOCOL V4.1</p>
            </div>
            <button onClick={() => setViewMode('RADAR')} style={{ background: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>CLOSE</button>
          </div>

          {!selectedAnalysis || isAnalyzing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{ width: '40px', height: '40px', border: `2px solid ${COLORS.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '12px', color: COLORS.primary, letterSpacing: '4px', animation: 'pulse 2s infinite' }}>SYNTHESIZING...</div>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
              `}</style>
            </div>
          ) : (
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ marginBottom: '24px' }}>
                <a
                  href={selectedAnalysis.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: COLORS.text, fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginBottom: '8px', borderBottom: `1px dashed ${COLORS.primary}`, paddingBottom: '2px', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = COLORS.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = COLORS.text)}
                >
                  ▶ {selectedAnalysis.title}
                </a>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: COLORS.secondary, padding: '2px 8px', border: `1px solid ${COLORS.secondary}`, borderRadius: '10px' }}>HOT_TARGET</span>
                  <span style={{ fontSize: '10px', color: COLORS.primary, padding: '2px 8px', border: `1px solid ${COLORS.primary}`, borderRadius: '10px' }}>GENOME_SEQ_OK</span>
                  <a
                    href={selectedAnalysis.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '10px', color: COLORS.warning, padding: '2px 8px', border: `1px solid ${COLORS.warning}`, borderRadius: '10px', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = COLORS.warning; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.warning; }}
                  >
                    ▶ WATCH ON YOUTUBE
                  </a>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Viral Score Gauge */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: '10px', color: COLORS.textDim, marginBottom: '8px' }}>VIRALITY EXPONENT</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.success }}>{selectedAnalysis.analysis.viralScore}</div>
                    <div style={{ fontSize: '12px', color: COLORS.textDim }}>/ 100</div>
                  </div>
                  <div style={{ height: '4px', background: COLORS.bg, marginTop: '8px' }}>
                    <div style={{ width: `${selectedAnalysis.analysis.viralScore}%`, height: '100%', background: COLORS.success, boxShadow: `0 0 10px ${COLORS.success}` }} />
                  </div>
                </div>

                {/* Sentiment Score */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: '10px', color: COLORS.textDim, marginBottom: '8px' }}>SENTIMENT RESONANCE</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.primary }}>{selectedAnalysis.analysis.sentimentScore}</div>
                    <div style={{ fontSize: '12px', color: COLORS.textDim }}>POS_RESONANCE</div>
                  </div>
                  <div style={{ height: '4px', background: COLORS.bg, marginTop: '8px' }}>
                    <div style={{ width: `${selectedAnalysis.analysis.sentimentScore}%`, height: '100%', background: COLORS.primary, boxShadow: `0 0 10px ${COLORS.primary}` }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.primary, fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '12px', background: COLORS.primary }} /> EMOTIONAL TRIGGERS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedAnalysis.analysis.keyTriggers?.map((t: string, i: number) => (
                      <div key={i} style={{ fontSize: '12px', color: COLORS.text, padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderLeft: `2px solid ${COLORS.secondary}` }}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.primary, fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '12px', background: COLORS.primary }} /> TARGET DEMOGRAPHIC
                  </div>
                  <div style={{ fontSize: '13px', color: COLORS.textDim, fontStyle: 'italic', padding: '10px', border: `1px dashed ${COLORS.border}` }}>
                    "{selectedAnalysis.analysis.demographic}"
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '10px', color: COLORS.textDim, marginBottom: '4px' }}>TRAJECTORY PREDICTION</div>
                    <div style={{ fontSize: '12px', color: COLORS.warning, fontWeight: 'bold' }}>{selectedAnalysis.analysis.prediction}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: `${COLORS.secondary}11`, border: `1px solid ${COLORS.secondary}` }}>
                <div style={{ fontSize: '11px', color: COLORS.secondary, fontWeight: 'bold', marginBottom: '8px' }}>STRATEGIC BLUEPRINT</div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.6', color: COLORS.text }}>{selectedAnalysis.analysis.blueprint}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (viewMode === 'RADAR') {
      return (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, color: COLORS.primary, fontSize: '18px' }}>🛰️ VPH RADAR SYSTEMS</h2>
              <p style={{ margin: 0, fontSize: '10px', color: COLORS.textDim }}>SURVEILLANCE ENGINE v2.0 // YOUTUBE FEED</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setViewMode('DCCP')}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${COLORS.primary}`, color: COLORS.primary, cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >
                BACK
              </button>
              <button
                onClick={triggerRadarScan}
                disabled={isScanning}
                style={{ padding: '8px 16px', background: isScanning ? COLORS.textDim : COLORS.secondary, color: '#fff', border: 'none', cursor: isScanning ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >
                {isScanning ? 'SCANNING...' : 'EXECUTE SCAN'}
              </button>
            </div>
          </div>

          {!radarData ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textDim }}>
              WAITING FOR INTEL...
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ fontSize: '10px', color: COLORS.success, marginBottom: '12px' }}>
                LAST CAPTURE: {new Date(radarData.timestamp).toLocaleString()} | SOURCE: {radarData.source}
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {radarData.data.map((item: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderLeft: `2px solid ${COLORS.secondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.text, textDecoration: 'none', borderBottom: `1px dashed ${COLORS.border}`, paddingBottom: '1px', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = COLORS.primary)}
                        onMouseLeave={e => (e.currentTarget.style.color = COLORS.text)}
                      >
                        ▶ {item.title}
                      </a>
                      <div style={{ fontSize: '10px', color: COLORS.textDim, marginTop: '2px' }}>{item.views} views</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: 'transparent', color: COLORS.warning, fontSize: '10px', fontWeight: 'bold', border: `1px solid ${COLORS.warning}`, padding: '4px 8px', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        ▶ PLAY
                      </a>
                      <button
                        onClick={() => handleAnalyzeVideo(item)}
                        style={{ background: 'transparent', color: COLORS.primary, fontSize: '10px', fontWeight: 'bold', border: `1px solid ${COLORS.primary}`, padding: '4px 8px', cursor: 'pointer' }}
                      >
                        INTELLIGENCE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', color: COLORS.primary, fontWeight: 'bold', letterSpacing: '8px' }}>DCCP</div>
          <div style={{ fontSize: '12px', color: COLORS.textDim, marginTop: '8px' }}>DIGITAL COMMAND & CONTROL PROTOCOL</div>
          <div style={{ marginTop: '20px', padding: '8px 16px', border: `1px solid ${COLORS.success}`, color: COLORS.success, fontSize: '11px' }}>
            ALL SYSTEMS OPERATIONAL
          </div>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setViewMode('DCCP')} style={{ padding: '6px 12px', background: COLORS.primary, border: `1px solid ${COLORS.primary}`, color: '#000', cursor: 'pointer', fontSize: '10px' }}>DCCP CORE</button>
            <button onClick={() => setViewMode('RADAR')} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${COLORS.secondary}`, color: COLORS.secondary, cursor: 'pointer', fontSize: '10px' }}>VPH RADAR</button>
          </div>
          <div style={{ marginTop: '40px', fontSize: '10px', color: COLORS.success, borderTop: `1px dashed ${COLORS.border}`, paddingTop: '12px', opacity: 0.7 }}>
            🧬 EVOMAP INTEGRITY: 100% // HEARTBEAT: NOMINAL
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, padding: '20px', fontFamily: 'monospace' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <h1 style={{ margin: 0, color: COLORS.primary, letterSpacing: '2px' }}>SOVEREIGN DCCP CORE</h1>
          <p style={{ color: COLORS.textDim, fontSize: '12px', margin: '4px 0' }}>NEURAL ROUTER // WAR ROOM</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: COLORS.textDim }}>EXECUTIONS</div>
            <div style={{ fontSize: '20px', color: COLORS.primary }}>{stats.totalExecutions}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: COLORS.textDim }}>SUCCESS</div>
            <div style={{ fontSize: '20px', color: COLORS.success }}>
              {stats.totalExecutions > 0 ? ((stats.successful / stats.totalExecutions) * 100).toFixed(1) : '100.0'}%
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: COLORS.textDim }}>NODES</div>
            <div style={{ fontSize: '20px', color: COLORS.primary }}>{nodes.filter(n => n.status === 'active').length}</div>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: '20px' }}>
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, padding: '16px' }}>
          <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '12px', marginTop: 0 }}>COMPUTE NODES</h3>
          {nodes.map(node => (
            <div key={node.nodeId} style={{ marginBottom: '12px', padding: '12px', borderLeft: `3px solid ${getStatusColor(node.status)}`, background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{node.provider}</span>
                <span style={{ fontSize: '10px', color: COLORS.textDim }}>{node.status}</span>
              </div>
              <div style={{ height: '4px', background: COLORS.bg, marginBottom: '8px' }}>
                <div style={{ width: `${node.load}%`, height: '100%', background: node.load > 80 ? COLORS.danger : COLORS.primary }} />
              </div>
              <div style={{ fontSize: '10px', color: COLORS.textDim }}>SOVEREIGNTY: {node.sovereigntyScore}%</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => handleCommand(node.nodeId, 'shutdown')} disabled={node.status === 'offline'}
                  style={{ flex: 1, padding: '4px', background: 'transparent', border: `1px solid ${COLORS.danger}`, color: COLORS.danger, fontSize: '10px', cursor: node.status === 'offline' ? 'not-allowed' : 'pointer' }}>
                  SHUTDOWN
                </button>
                <button onClick={() => handleCommand(node.nodeId, 'reload')} disabled={node.status === 'active'}
                  style={{ flex: 1, padding: '4px', background: 'transparent', border: `1px solid ${COLORS.primary}`, color: COLORS.primary, fontSize: '10px', cursor: node.status === 'active' ? 'not-allowed' : 'pointer' }}>
                  RELOAD
                </button>
              </div>
            </div>
          ))}
        </div>

        {renderCenterPanel()}

        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, padding: '16px' }}>
          <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '12px', marginTop: 0 }}>EVENT LOG</h3>
          <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '11px', marginBottom: '16px' }}>
            {events.slice().reverse().map((event, idx) => (
              <div key={idx} style={{ padding: '4px 0', color: COLORS.textDim, borderLeft: `2px solid ${COLORS.primary}`, paddingLeft: '8px', marginBottom: '4px' }}>
                [{event.type}] {new Date(event.timestamp).toLocaleTimeString()}: {event.payload?.message || JSON.stringify(event.payload)}
              </div>
            ))}
          </div>

          <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '12px', marginTop: 16 }}>TACTICAL INJECTOR</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              disabled={isFiring}
              style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${COLORS.secondary}`, color: COLORS.text, fontFamily: 'monospace', outline: 'none', opacity: isFiring ? 0.5 : 1 }}
            >
              <option value="v3.0_gpt4">v3.0_gpt4 (High Priority)</option>
              <option value="v2.0_claude">v2.0_claude (Standard)</option>
              <option value="v1.0_gemini">v1.0_gemini (Creative)</option>
              <option value="v4.0_arena">v4.0_arena (Consensus)</option>
            </select>
            <input
              type="text"
              value={testIntent}
              onChange={e => setTestIntent(e.target.value)}
              disabled={isFiring}
              placeholder="Inject Raw Intent String..."
              style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${COLORS.border}`, color: COLORS.primary, fontFamily: 'monospace', outline: 'none', opacity: isFiring ? 0.5 : 1 }}
              onKeyDown={e => e.key === 'Enter' && handleFireIntent()}
            />
            <button
              onClick={handleFireIntent}
              disabled={isFiring || !testIntent}
              style={{
                padding: '12px',
                background: isFiring ? COLORS.textDim : COLORS.primary,
                color: '#000',
                border: 'none',
                fontWeight: 'bold',
                cursor: (isFiring || !testIntent) ? 'not-allowed' : 'pointer',
                letterSpacing: '2px',
                marginTop: '4px',
                transition: 'all 0.2s'
              }}
            >
              {isFiring ? 'COMMUNICATING...' : 'FIRE INTENT'}
            </button>
            {fireStatus.msg && (
              <div style={{
                fontSize: '10px',
                marginTop: '4px',
                color: fireStatus.type === 'success' ? COLORS.success : (fireStatus.type === 'error' ? COLORS.danger : COLORS.primary),
                textAlign: 'center',
                padding: '4px',
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${fireStatus.type === 'idle' ? COLORS.primary : 'transparent'}`
              }}>
                {fireStatus.msg}
              </div>
            )}
          </div>

          <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '12px', marginTop: 24 }}>SYSTEM CONFIGURATION</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px' }}>ROUTER AUDIT (IPE)</span>
              <button
                onClick={() => toggleConfig('enableAudit')}
                style={{ width: '40px', height: '20px', background: sysConfig.enableAudit ? COLORS.success : COLORS.textDim, border: 'none', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}
              >
                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: sysConfig.enableAudit ? '22px' : '2px', transition: 'all 0.2s' }} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px' }}>AUTO-SWITCH (FAILOVER)</span>
              <button
                onClick={() => toggleConfig('enableAutoSwitch')}
                style={{ width: '40px', height: '20px', background: sysConfig.enableAutoSwitch ? COLORS.success : COLORS.textDim, border: 'none', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}
              >
                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: sysConfig.enableAutoSwitch ? '22px' : '2px', transition: 'all 0.2s' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
