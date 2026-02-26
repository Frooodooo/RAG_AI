import { useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    type Node,
    type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLocale } from '../../i18n';
import chatWorkflow from '../../assets/chat-workflow.json';
import uploadWorkflow from '../../assets/upload-workflow.json';
import ExecutionNode, { type NodeExecStatus, type ExecutionNodeType } from './ExecutionNode';
import { useExecutionTracker } from '../../hooks/useExecutionTracker';

const nodeTypes = { execution: ExecutionNode };

type WorkflowType = 'chat' | 'upload';

// Build ReactFlow nodes + edges from a workflow JSON definition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGraph(wf: any): { nodes: Node[]; edges: Edge[] } {
    if (!wf.nodes || !wf.connections) return { nodes: [], edges: [] };

    const nodes: Node[] = (wf.nodes as Array<{ name: string; type: string; position: [number, number]; description?: string }>).map(n => ({
        id: n.name,
        position: { x: n.position[0], y: n.position[1] },
        type: 'execution',
        data: {
            label: n.name,
            nodeType: n.type ?? '',
            description: n.description ?? '',
            status: 'idle' as NodeExecStatus,
        },
    } satisfies ExecutionNodeType));

    const edges: Edge[] = [];
    const connections = wf.connections as Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }>;

    Object.entries(connections).forEach(([src, outputs]) => {
        outputs.main.forEach(group => {
            group.forEach(conn => {
                edges.push({
                    id: `${src}->${conn.node}`,
                    source: src,
                    target: conn.node,
                    animated: true,
                    style: { stroke: 'rgba(255,255,255,0.09)' },
                    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.09)' },
                });
            });
        });
    });

    return { nodes, edges };
}

export interface WorkflowVisualizerProps {
    /** n8n execution ID to poll for real-time node status */
    executionId?: string | null;
    /** Which workflow definition to display */
    workflowType?: WorkflowType;
    /** Simple on/off flag used when no executionId is available */
    isActive?: boolean;
}

export default function WorkflowVisualizer({
    executionId = null,
    workflowType = 'chat',
    isActive = false,
}: WorkflowVisualizerProps) {
    const { t } = useLocale();

    const wfData = workflowType === 'upload' ? uploadWorkflow : chatWorkflow;
    const { nodes: initNodes, edges: initEdges } = useMemo(() => buildGraph(wfData), [wfData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

    // Re-init graph when workflow type switches
    useEffect(() => {
        const { nodes: n, edges: e } = buildGraph(wfData);
        setNodes(n);
        setEdges(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowType]);

    const execState = useExecutionTracker(executionId);

    // Map execution state → node status
    useEffect(() => {
        setNodes(nds =>
            nds.map(node => {
                let status: NodeExecStatus = 'idle';

                if (executionId) {
                    // Real execution data from n8n API
                    if (execState.errorNodes.has(node.id)) {
                        status = 'error';
                    } else if (execState.doneNodes.has(node.id)) {
                        status = 'done';
                    } else if (execState.runningNodes.has(node.id)) {
                        status = 'running';
                    }
                } else if (isActive) {
                    // Fallback: highlight entry node while processing
                    status = node.id === 'Webhook' ? 'running' : 'idle';
                }

                return { ...node, data: { ...node.data, status } };
            })
        );
    }, [execState, executionId, isActive, setNodes]);

    const wfLabel = workflowType === 'upload'
        ? (uploadWorkflow as any).name
        : (chatWorkflow as any).name;

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#06091a' }}>
            {/* Compact header strip */}
            <div style={{
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.055)',
                background: '#0b0f23',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-accent, #7c87fe)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {t('wf.title') as string}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>·</span>
                <span style={{ fontSize: 11, color: '#4a5578' }}>{wfLabel}</span>

                {(isActive || (executionId && !execState.finished)) && (
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent-2, #7c87fe)' }}>
                        <span style={{
                            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                            background: '#5d6bfe',
                            animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                        }} />
                        {t('wf.description') as string}
                    </span>
                )}

                {executionId && execState.finished && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#34d399' }}>
                        ✓ {execState.errorNodes.size === 0 ? 'Completed' : 'Finished with errors'}
                    </span>
                )}
            </div>

            {/* ReactFlow canvas */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Background color="rgba(255,255,255,0.04)" gap={20} />
                    <Controls />
                    <MiniMap
                        nodeColor={(n) => {
                            const status = (n.data as any)?.status as NodeExecStatus;
                            if (status === 'done')    return '#34d399';
                            if (status === 'running') return '#5d6bfe';
                            if (status === 'error')   return '#f87171';
                            return '#19203a';
                        }}
                        maskColor="rgba(6,9,26,0.6)"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}
