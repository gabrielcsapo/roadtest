import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react'
import * as THREE from 'three'
import type { TestSuite, IstanbulCoverage } from '../../framework/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GNode {
  id: string
  type: 'file' | 'suite'
  label: string
  cluster: string
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  coveragePct?: number
  suiteId?: string
  testCount?: number
  passCount?: number
  failCount?: number
}

interface GEdge { from: string; to: string; type: 'import' | 'coverage' }

interface GCluster {
  id: string; label: string
  cx: number; cy: number; cz: number
  radius: number; color: string
}

interface LayoutResult {
  nodes: GNode[]
  edges: GEdge[]
  clusters: GCluster[]
}

// ─── Force simulation ─────────────────────────────────────────────────────────

function runSimulation(nodes: GNode[], edges: GEdge[], clusterMap: Map<string, GCluster>) {
  const iters = Math.min(250, Math.max(80, 20000 / (nodes.length || 1)))
  const nodeIdx = new Map(nodes.map((n, i) => [n.id, i]))

  for (let it = 0; it < iters; it++) {
    const alpha = Math.max(0.001, 1 - it / iters)

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
        const d2 = Math.max(dx*dx + dy*dy + dz*dz, 0.01)
        const d = Math.sqrt(d2)
        const f = (12 / d2) * alpha
        a.vx += (dx/d)*f; a.vy += (dy/d)*f; a.vz += (dz/d)*f
        b.vx -= (dx/d)*f; b.vy -= (dy/d)*f; b.vz -= (dz/d)*f
      }
    }

    // Spring along edges
    for (const e of edges) {
      const ai = nodeIdx.get(e.from), bi = nodeIdx.get(e.to)
      if (ai == null || bi == null) continue
      const a = nodes[ai], b = nodes[bi]
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.01
      const rest = e.type === 'coverage' ? 8 : 3
      const f = (d - rest) * 0.06 * alpha
      a.vx += (dx/d)*f; a.vy += (dy/d)*f; a.vz += (dz/d)*f
      b.vx -= (dx/d)*f; b.vy -= (dy/d)*f; b.vz -= (dz/d)*f
    }

    // Cluster gravity
    for (const n of nodes) {
      const c = clusterMap.get(n.cluster)
      if (!c) continue
      n.vx += (c.cx - n.x) * 0.04 * alpha
      n.vy += (c.cy - n.y) * 0.04 * alpha
      n.vz += (c.cz - n.z) * 0.04 * alpha
    }

    // Integrate + dampen
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy; n.z += n.vz
      n.vx *= 0.82; n.vy *= 0.82; n.vz *= 0.82
    }
  }
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const PALETTE = [
  '#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#ec4899','#14b8a6','#84cc16','#f97316','#6366f1',
]

function clusterColor(idx: number) { return PALETTE[idx % PALETTE.length] }
function coverageColor(pct: number) {
  return pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
}
function suiteColor(pass: number, fail: number, total: number) {
  if (total === 0) return '#4b4b60'
  if (fail > 0) return '#ef4444'
  return '#22c55e'
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useGraphData(suites: TestSuite[], coverage: IstanbulCoverage | null) {
  const [raw, setRaw] = useState<{ nodes: {id:string;shortPath:string}[]; edges: {from:string;to:string}[] } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/__viewtest_graph__')
      .then(r => r.json())
      .then(setRaw)
      .catch(() => setError(true))
  }, [])

  const graphData = useMemo(() => {
    if (!raw) return null
    const nodes: GNode[] = []
    const edges: GEdge[] = []
    const fileIds = new Set<string>()

    // Source file nodes (skip test files — suites represent those)
    for (const mod of raw.nodes) {
      if (mod.id.includes('.test.') || mod.id.includes('.spec.')) continue
      fileIds.add(mod.id)
      const parts = mod.shortPath.split('/')
      const cluster = parts.length > 2 ? parts.slice(0, 2).join('/') : (parts[0] ?? 'src')

      const fileCov = coverage?.[mod.id]
      let coveragePct: number | undefined
      if (fileCov) {
        const stmts = Object.values(fileCov.s)
        if (stmts.length > 0)
          coveragePct = Math.round((stmts.filter(n => (n as number) > 0).length / stmts.length) * 100)
      }

      nodes.push({
        id: mod.id, type: 'file', label: parts[parts.length - 1] ?? mod.shortPath,
        cluster, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, coveragePct,
      })
    }

    // Import edges (file→file only)
    for (const e of raw.edges) {
      if (fileIds.has(e.from) && fileIds.has(e.to))
        edges.push({ from: e.from, to: e.to, type: 'import' })
    }

    // Suite nodes + coverage edges (deduplicated per suite→file)
    const seen = new Set<string>()
    for (const suite of suites) {
      const sid = `suite:${suite.id}`
      const passCount = suite.tests.filter(t => t.status === 'pass').length
      const failCount = suite.tests.filter(t => t.status === 'fail').length

      nodes.push({
        id: sid, type: 'suite', label: suite.name, cluster: '__tests__',
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
        suiteId: suite.id, testCount: suite.tests.length, passCount, failCount,
      })

      for (const test of suite.tests) {
        if (!test.testCoverage) continue
        for (const filePath of Object.keys(test.testCoverage)) {
          const key = `${sid}::${filePath}`
          if (seen.has(key) || !fileIds.has(filePath)) continue
          seen.add(key)
          edges.push({ from: filePath, to: sid, type: 'coverage' })
        }
      }
    }

    return { nodes, edges }
  }, [raw, suites, coverage])

  return { graphData, error }
}

// ─── Layout hook ──────────────────────────────────────────────────────────────

function useLayout(graphData: { nodes: GNode[]; edges: GEdge[] } | null): LayoutResult | null {
  return useMemo(() => {
    if (!graphData) return null
    const nodes: GNode[] = graphData.nodes.map(n => ({ ...n }))
    const edges = graphData.edges

    // Build cluster map with spread positions
    const clusterIds = [...new Set(nodes.map(n => n.cluster))]
    const fileClusterIds = clusterIds.filter(c => c !== '__tests__')
    const spread = Math.max(18, fileClusterIds.length * 3.5)
    const clusterMap = new Map<string, GCluster>()

    fileClusterIds.forEach((id, i) => {
      const angle = (i / fileClusterIds.length) * Math.PI * 2
      clusterMap.set(id, {
        id, label: id,
        cx: Math.cos(angle) * spread, cy: 0, cz: Math.sin(angle) * spread,
        radius: 4, color: clusterColor(i),
      })
    })
    clusterMap.set('__tests__', {
      id: '__tests__', label: 'Tests',
      cx: 0, cy: 0, cz: 0,
      radius: 4, color: '#6366f1',
    })

    // Initialize node positions near cluster centers with jitter
    for (const n of nodes) {
      const c = clusterMap.get(n.cluster)!
      n.x = c.cx + (Math.random() - 0.5) * 5
      n.y = (Math.random() - 0.5) * 5
      n.z = c.cz + (Math.random() - 0.5) * 5
      n.vx = n.vy = n.vz = 0
    }

    runSimulation(nodes, edges, clusterMap)

    // Recompute cluster centers + radii from final positions
    const byCluster = new Map<string, GNode[]>()
    for (const n of nodes) {
      const arr = byCluster.get(n.cluster) ?? []
      arr.push(n)
      byCluster.set(n.cluster, arr)
    }
    const clusters: GCluster[] = []
    for (const [cid, c] of clusterMap) {
      const cNodes = byCluster.get(cid) ?? []
      if (cNodes.length === 0) continue
      const cx = cNodes.reduce((s, n) => s + n.x, 0) / cNodes.length
      const cy = cNodes.reduce((s, n) => s + n.y, 0) / cNodes.length
      const cz = cNodes.reduce((s, n) => s + n.z, 0) / cNodes.length
      let maxR = 0
      for (const n of cNodes) {
        const dx = n.x - cx, dy = n.y - cy, dz = n.z - cz
        maxR = Math.max(maxR, Math.sqrt(dx*dx + dy*dy + dz*dz))
      }
      clusters.push({ ...c, cx, cy, cz, radius: maxR + 2.5 })
    }

    return { nodes, edges, clusters }
  }, [graphData])
}

// ─── Edge lines ───────────────────────────────────────────────────────────────

function EdgeLines({ nodes, edges, focusId }: {
  nodes: GNode[]; edges: GEdge[]; focusId: string | null
}) {
  const importRef = useRef<THREE.LineSegments>(null)
  const covRef = useRef<THREE.LineSegments>(null)

  const { importPos, importCol, covPos, covCol } = useMemo(() => {
    const posMap = new Map<string, THREE.Vector3>()
    for (const n of nodes) posMap.set(n.id, new THREE.Vector3(n.x, n.y, n.z))

    const importPos: number[] = [], importCol: number[] = []
    const covPos: number[] = [], covCol: number[] = []

    const cImport = new THREE.Color('#374151')
    const cImportHi = new THREE.Color('#93c5fd')
    const cCov = new THREE.Color('#312e81')
    const cCovHi = new THREE.Color('#a5b4fc')

    for (const e of edges) {
      const a = posMap.get(e.from), b = posMap.get(e.to)
      if (!a || !b) continue
      const isHi = focusId != null && (e.from === focusId || e.to === focusId)
      const dim = focusId != null && !isHi

      if (e.type === 'import') {
        const c = isHi ? cImportHi : cImport
        const m = dim ? 0.15 : 1
        importPos.push(a.x, a.y, a.z, b.x, b.y, b.z)
        importCol.push(c.r*m, c.g*m, c.b*m, c.r*m, c.g*m, c.b*m)
      } else {
        const c = isHi ? cCovHi : cCov
        const m = dim ? 0.15 : 1
        covPos.push(a.x, a.y, a.z, b.x, b.y, b.z)
        covCol.push(c.r*m, c.g*m, c.b*m, c.r*m, c.g*m, c.b*m)
      }
    }
    return {
      importPos: new Float32Array(importPos), importCol: new Float32Array(importCol),
      covPos: new Float32Array(covPos), covCol: new Float32Array(covCol),
    }
  }, [nodes, edges, focusId])

  useLayoutEffect(() => {
    if (importRef.current) {
      const g = importRef.current.geometry
      g.setAttribute('position', new THREE.BufferAttribute(importPos, 3))
      g.setAttribute('color', new THREE.BufferAttribute(importCol, 3))
      g.computeBoundingSphere()
    }
  }, [importPos, importCol])

  useLayoutEffect(() => {
    if (covRef.current) {
      const g = covRef.current.geometry
      g.setAttribute('position', new THREE.BufferAttribute(covPos, 3))
      g.setAttribute('color', new THREE.BufferAttribute(covCol, 3))
      g.computeBoundingSphere()
    }
  }, [covPos, covCol])

  return (
    <>
      <lineSegments ref={importRef}>
        <bufferGeometry />
        <lineBasicMaterial vertexColors />
      </lineSegments>
      <lineSegments ref={covRef}>
        <bufferGeometry />
        <lineBasicMaterial vertexColors />
      </lineSegments>
    </>
  )
}

// ─── Cluster bubble ───────────────────────────────────────────────────────────

function ClusterBubble({ cluster }: { cluster: GCluster }) {
  const color = new THREE.Color(cluster.color)
  return (
    <group position={[cluster.cx, cluster.cy, cluster.cz]}>
      <mesh>
        <sphereGeometry args={[cluster.radius, 32, 32]} />
        <meshStandardMaterial
          color={color} transparent opacity={0.06}
          side={THREE.BackSide} depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[cluster.radius, 32, 32]} />
        <meshBasicMaterial
          color={color} transparent opacity={0.12}
          wireframe side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

// ─── Node sphere ──────────────────────────────────────────────────────────────

function NodeSphere({ node, color, selected, hovered, onClick, onHover }: {
  node: GNode; color: string; selected: boolean; hovered: boolean
  onClick: () => void; onHover: (v: boolean) => void
}) {
  const size = node.type === 'suite' ? 0.65 : 0.4
  const scale = selected ? 1.5 : hovered ? 1.25 : 1
  const c = new THREE.Color(color)

  return (
    <mesh
      position={[node.x, node.y, node.z]}
      scale={[scale, scale, scale]}
      onClick={e => { e.stopPropagation(); onClick() }}
      onPointerOver={e => { e.stopPropagation(); onHover(true) }}
      onPointerOut={() => onHover(false)}
    >
      <sphereGeometry args={[size, 20, 20]} />
      <meshStandardMaterial
        color={c} emissive={c}
        emissiveIntensity={selected ? 0.6 : hovered ? 0.35 : 0.12}
        roughness={0.35} metalness={0.15}
      />
      {(hovered || selected) && (
        <Html center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(15,15,19,0.95)', border: '1px solid #2a2a36',
            borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#c4c4d4',
            fontFamily: 'monospace', whiteSpace: 'nowrap', transform: 'translateY(-20px)',
          }}>
            {node.label}
          </div>
        </Html>
      )}
    </mesh>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({ layout, selectedId, onSelect }: {
  layout: LayoutResult; selectedId: string | null; onSelect: (id: string | null) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const focusId = selectedId ?? hoveredId

  const nodeColor = useCallback((n: GNode) => {
    if (n.type === 'suite')
      return suiteColor(n.passCount ?? 0, n.failCount ?? 0, n.testCount ?? 0)
    return n.coveragePct != null ? coverageColor(n.coveragePct) : '#3b82f6'
  }, [])

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[20, 30, 20]} intensity={60} />
      <pointLight position={[-20, -10, -20]} intensity={20} color="#6366f1" />
      <OrbitControls makeDefault dampingFactor={0.1} />

      {/* Cluster bubbles */}
      {layout.clusters.map(c => <ClusterBubble key={c.id} cluster={c} />)}

      {/* Cluster labels */}
      {layout.clusters.map(c => (
        <Html key={`label-${c.id}`} position={[c.cx, c.cy + c.radius + 0.8, c.cz]} center>
          <div style={{
            fontSize: 10, color: c.color, fontFamily: 'monospace', fontWeight: 600,
            pointerEvents: 'none', whiteSpace: 'nowrap', opacity: 0.8,
          }}>
            {c.label === '__tests__' ? 'Tests' : c.label}
          </div>
        </Html>
      ))}

      {/* Edges */}
      <EdgeLines nodes={layout.nodes} edges={layout.edges} focusId={focusId} />

      {/* Nodes */}
      {layout.nodes.map(n => (
        <NodeSphere
          key={n.id} node={n}
          color={nodeColor(n)}
          selected={n.id === selectedId}
          hovered={n.id === hoveredId}
          onClick={() => onSelect(n.id === selectedId ? null : n.id)}
          onHover={v => setHoveredId(v ? n.id : null)}
        />
      ))}

      {/* Click background to deselect */}
      <mesh
        position={[0, 0, 0]}
        onClick={() => onSelect(null)}
        visible={false}
      >
        <sphereGeometry args={[200, 8, 8]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>
    </>
  )
}

// ─── Popover ─────────────────────────────────────────────────────────────────

function InfoPopover({ node, layout, onClose, onSelectSuite }: {
  node: GNode; layout: LayoutResult
  onClose: () => void; onSelectSuite: (suiteId: string) => void
}) {
  const nodeMap = useMemo(() => new Map(layout.nodes.map(n => [n.id, n])), [layout.nodes])

  const connectedEdges = useMemo(
    () => layout.edges.filter(e => e.from === node.id || e.to === node.id),
    [layout.edges, node.id]
  )

  const importers = connectedEdges
    .filter(e => e.type === 'import' && e.from === node.id)
    .map(e => nodeMap.get(e.to)).filter(Boolean) as GNode[]

  const imports = connectedEdges
    .filter(e => e.type === 'import' && e.to === node.id)
    .map(e => nodeMap.get(e.from)).filter(Boolean) as GNode[]

  const coveredBy = connectedEdges
    .filter(e => e.type === 'coverage' && e.from === node.id)
    .map(e => nodeMap.get(e.to)).filter(Boolean) as GNode[]

  const covers = connectedEdges
    .filter(e => e.type === 'coverage' && e.to === node.id)
    .map(e => nodeMap.get(e.from)).filter(Boolean) as GNode[]

  const color = node.type === 'suite'
    ? suiteColor(node.passCount ?? 0, node.failCount ?? 0, node.testCount ?? 0)
    : node.coveragePct != null ? coverageColor(node.coveragePct) : '#3b82f6'

  return (
    <div style={{
      position: 'fixed', right: 16, top: 56, width: 300,
      background: '#16161d', border: '1px solid #2a2a36', borderRadius: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 100, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid #2a2a36',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#c4c4d4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.label}
        </span>
        <span style={{ fontSize: 10, color: '#4b4b60', flexShrink: 0, background: '#1e1e2e', borderRadius: 4, padding: '1px 6px' }}>
          {node.type === 'file' ? 'file' : 'suite'}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b4b60', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      <div style={{ maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
        {/* File stats */}
        {node.type === 'file' && node.coveragePct != null && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e2e', display: 'flex', gap: 12 }}>
            <Stat label="Coverage" value={`${node.coveragePct}%`} color={color} />
          </div>
        )}

        {/* Suite stats */}
        {node.type === 'suite' && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e2e', display: 'flex', gap: 12 }}>
            <Stat label="Tests" value={String(node.testCount ?? 0)} />
            <Stat label="Pass" value={String(node.passCount ?? 0)} color="#22c55e" />
            {(node.failCount ?? 0) > 0 && <Stat label="Fail" value={String(node.failCount)} color="#ef4444" />}
          </div>
        )}

        {/* Connections */}
        {node.type === 'file' && importers.length > 0 && (
          <Section title={`Imported by (${importers.length})`} color="#93c5fd">
            {importers.map(n => <NodeChip key={n.id} node={n} />)}
          </Section>
        )}
        {node.type === 'file' && imports.length > 0 && (
          <Section title={`Imports (${imports.length})`} color="#374151">
            {imports.map(n => <NodeChip key={n.id} node={n} />)}
          </Section>
        )}
        {coveredBy.length > 0 && (
          <Section title={`Tested by (${coveredBy.length})`} color="#818cf8">
            {coveredBy.map(n => (
              <NodeChip key={n.id} node={n} onClick={n.suiteId ? () => onSelectSuite(n.suiteId!) : undefined} />
            ))}
          </Section>
        )}
        {covers.length > 0 && (
          <Section title={`Covers (${covers.length} files)`} color="#6b7280">
            {covers.map(n => <NodeChip key={n.id} node={n} />)}
          </Section>
        )}
        {node.type === 'suite' && node.suiteId && (
          <div style={{ padding: '10px 14px' }}>
            <button
              onClick={() => onSelectSuite(node.suiteId!)}
              style={{
                width: '100%', padding: '7px 12px', borderRadius: 6,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc', fontSize: 12, cursor: 'pointer', fontWeight: 600,
              }}
            >
              View in Detail →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color = '#c4c4d4' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#4b4b60', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e1e2e' }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {children}
      </div>
    </div>
  )
}

function NodeChip({ node, onClick }: { node: GNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 11, color: '#8888a0', fontFamily: 'monospace',
        padding: '2px 6px', borderRadius: 4,
        background: hov ? '#1e1e2e' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}
    >
      {node.label}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16,
      background: 'rgba(22,22,29,0.85)', backdropFilter: 'blur(8px)',
      border: '1px solid #2a2a36', borderRadius: 8, padding: '8px 12px',
      display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, color: '#4b4b60',
    }}>
      {[
        { color: '#3b82f6', label: 'Source file' },
        { color: '#22c55e', label: 'File — well covered' },
        { color: '#f59e0b', label: 'File — partial coverage' },
        { color: '#ef4444', label: 'File — uncovered / failing suite' },
        { color: '#6366f1', label: 'Test suite' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          {label}
        </div>
      ))}
      <div style={{ marginTop: 2, borderTop: '1px solid #2a2a36', paddingTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 16, height: 1, background: '#374151' }} /> Import edge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 16, height: 1, background: '#6366f1' }} /> Coverage edge
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  suites: TestSuite[]
  coverage: IstanbulCoverage | null
  onSelectSuite: (suiteId: string) => void
}

export function GraphView({ suites, coverage, onSelectSuite }: Props) {
  const { graphData, error } = useGraphData(suites, coverage)
  const layout = useLayout(graphData)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedNode = useMemo(
    () => layout?.nodes.find(n => n.id === selectedId) ?? null,
    [layout, selectedId]
  )

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b60' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>◌</div>
          <div style={{ fontSize: 13 }}>Graph endpoint unavailable — start with <code style={{ color: '#a5b4fc' }}>viewtest --ui</code></div>
        </div>
      </div>
    )
  }

  if (!layout) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b60' }}>
        <div style={{ fontSize: 13 }}>Building graph…</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, position: 'relative', background: '#0a0a0f' }}>
      <Canvas
        camera={{ position: [0, 20, 40], fov: 60, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <Scene layout={layout} selectedId={selectedId} onSelect={setSelectedId} />
      </Canvas>

      <Legend />

      {selectedNode && layout && (
        <InfoPopover
          node={selectedNode}
          layout={layout}
          onClose={() => setSelectedId(null)}
          onSelectSuite={suiteId => { onSelectSuite(suiteId); setSelectedId(null) }}
        />
      )}
    </div>
  )
}
