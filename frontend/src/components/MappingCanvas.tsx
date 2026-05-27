import React, { useEffect, useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath
} from '@xyflow/react'
import type { NodeProps, EdgeProps, Connection, Edge, Node } from '@xyflow/react'
import { Database, Check, Play } from 'lucide-react'
import '@xyflow/react/dist/style.css'

export const CustomMappingEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY
  })

  const { setEdges } = useReactFlow()

  const handleRuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRule = e.target.value
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              rule: nextRule
            }
          }
        }
        return edge
      })
    )
  }

  const currentRule = (data?.rule as string) || 'NONE'

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: '#52525b', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan bg-black border border-zinc-800 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 shadow-md"
        >
          <span className="font-mono text-zinc-400">Rule:</span>
          <select
            value={currentRule}
            onChange={handleRuleChange}
            className="bg-transparent text-white font-mono focus:outline-none cursor-pointer pr-1"
          >
            <option value="NONE" className="bg-black text-white">NONE</option>
            <option value="CAST_INT" className="bg-black text-white">CAST_INT</option>
            <option value="UPPERCASE" className="bg-black text-white">UPPERCASE</option>
            <option value="LOWERCASE" className="bg-black text-white">LOWERCASE</option>
            <option value="TRIM" className="bg-black text-white">TRIM</option>
          </select>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const SourceNode: React.FC<NodeProps> = ({ data }) => {
  const fields = Array.isArray(data?.fields) ? data.fields : []

  return (
    <div className="bg-black border border-zinc-800 rounded-lg shadow-xl w-64 text-sm text-white font-sans overflow-hidden">
      <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800">
        <div className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Source API Schema</div>
        <div className="font-bold text-xs truncate">REST Payload Template</div>
      </div>
      <div className="divide-y divide-zinc-900">
        {fields.map((field) => (
          <div key={field} className="relative flex items-center justify-between py-2.5 px-4 h-10">
            <span className="font-mono text-xs text-zinc-300">{field}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={field}
              style={{ right: -4, top: '50%', transform: 'translateY(-50%)' }}
              className="w-2 h-2 bg-zinc-400 border border-black rounded-full hover:bg-white transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export const TargetNode: React.FC<NodeProps> = ({ data }) => {
  const fields = Array.isArray(data?.fields) ? data.fields : []

  return (
    <div className="bg-black border border-zinc-800 rounded-lg shadow-xl w-64 text-sm text-white font-sans overflow-hidden">
      <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800">
        <div className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Target Database Schema</div>
        <div className="font-bold text-xs truncate">Dest Table Schema</div>
      </div>
      <div className="divide-y divide-zinc-900">
        {fields.map((field) => (
          <div key={field} className="relative flex items-center justify-between py-2.5 px-4 h-10">
            <Handle
              type="target"
              position={Position.Left}
              id={field}
              style={{ left: -4, top: '50%', transform: 'translateY(-50%)' }}
              className="w-2 h-2 bg-zinc-400 border border-black rounded-full hover:bg-white transition-colors"
            />
            <span className="font-mono text-xs text-zinc-300">{field}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  sourceNode: SourceNode,
  targetNode: TargetNode
}

const edgeTypes = {
  customMappingEdge: CustomMappingEdge
}

interface MappingCanvasProps {
  sourceKeys?: string[]
  targetColumns?: string[]
}

const MappingCanvasInner: React.FC<MappingCanvasProps> = ({
  sourceKeys = ['user_id', 'email', 'created_at', 'status_flag', 'total_spent', 'ip_address'],
  targetColumns = ['id', 'contact_email', 'signup_date', 'active_status', 'lifetime_value', 'signup_ip']
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [serializedPayload, setSerializedPayload] = useState<string | null>(null)

  useEffect(() => {
    const mappedNodes: Node[] = [
      {
        id: 'source-node',
        type: 'sourceNode',
        position: { x: 50, y: 50 },
        data: { fields: sourceKeys }
      },
      {
        id: 'target-node',
        type: 'targetNode',
        position: { x: 450, y: 50 },
        data: { fields: targetColumns }
      }
    ]
    setNodes(mappedNodes)
  }, [sourceKeys, targetColumns, setNodes])

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'customMappingEdge',
            data: { rule: 'NONE' }
          } as any,
          eds
        )
      ),
    [setEdges]
  )

  const handleSaveMapping = () => {
    const serialized = edges.map((edge: Edge) => ({
      source_key: edge.sourceHandle,
      target_key: edge.targetHandle,
      rule: edge.data?.rule || 'NONE'
    }))

    console.log('Serialized Schema Mappings:', serialized)
    setSerializedPayload(JSON.stringify(serialized, null, 2))
    setSaveSuccess(true)

    setTimeout(() => {
      setSaveSuccess(false)
      setSerializedPayload(null)
    }, 5000)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">Schema Field Mapper</h2>
          <p className="text-sm text-text-muted">Drag edges to map keys extracted from REST source queries to target columns.</p>
        </div>
        <button
          onClick={handleSaveMapping}
          className="flex items-center gap-2 px-3.5 py-2 bg-text-primary text-background font-semibold hover:opacity-90 text-xs rounded-lg transition-all cursor-pointer shadow-lg animate-fadeIn"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Save Mapping
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold uppercase tracking-wide">Schema Mapping Saved!</span>
          </div>
          <pre className="p-3 bg-panel-card border border-border-primary rounded-lg text-[10px] font-mono text-text-secondary overflow-x-auto leading-relaxed">
            {serializedPayload}
          </pre>
        </div>
      )}

      <div className="h-[450px] w-full bg-black border border-zinc-800 rounded-xl overflow-hidden relative shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-black"
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls className="bg-black border border-zinc-800 text-white rounded-md" />
        </ReactFlow>
      </div>

      <div className="flex items-center gap-2 px-2 text-xs text-text-muted">
        <Database className="h-4 w-4 text-text-muted" />
        <span>Ensure all primary key identifiers are successfully mapped to prevent sync conflicts.</span>
      </div>
    </div>
  )
}

export const MappingCanvas: React.FC<MappingCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MappingCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

export default MappingCanvas
