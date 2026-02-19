import { useEffect, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    type Node,
    type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLocale } from '../../i18n';
import workflowData from '../../assets/chat-workflow.json';

interface WorkflowVisualizerProps {
    isActive?: boolean
}

// Map n8n node types to visual styles
const getNodeStyle = (type: string, isActive: boolean) => {
    const baseStyle = {
        padding: '10px 15px',
        borderRadius: '8px',
        border: isActive ? '2px solid #1b9aaa' : '1px solid var(--border-subtle)',
        background: isActive ? 'rgba(27, 154, 170, 0.2)' : 'var(--bg-secondary)',
        color: isActive ? '#fff' : 'var(--text-primary)',
        width: 180,
        fontSize: '12px',
        fontWeight: 500,
        boxShadow: isActive ? '0 0 15px rgba(27, 154, 170, 0.4)' : 'none',
        transition: 'all 0.3s ease'
    };

    if (type.includes('webhook')) {
        return { ...baseStyle, borderLeft: '4px solid #f2cf59' }; // Yellow
    }
    if (type.includes('httpRequest')) {
        return { ...baseStyle, borderLeft: '4px solid #e35a5a' }; // Red
    }
    if (type.includes('code')) {
        return { ...baseStyle, borderLeft: '4px solid #4a90e2' }; // Blue
    }
    return baseStyle;
};

// Pre-compute workflow data
const computeWorkflowData = () => {
    if (!workflowData.nodes || !workflowData.connections) {
         return { nodes: [], edges: [] };
    }

    // 1. Map Nodes
    const initialNodes: Node[] = workflowData.nodes.map((n: any) => ({
        id: n.name,
        position: { x: n.position[0], y: n.position[1] },
        data: { label: n.name },
        type: 'default',
        // Style is applied dynamically in rendering, but we set initial here
        style: getNodeStyle(n.type, false)
    }));

    // 2. Map Edges
    const initialEdges: Edge[] = [];
    Object.keys(workflowData.connections).forEach(sourceName => {
        const outputs = (workflowData.connections as any)[sourceName];
        // outputs is usually { main: [ [ { node: 'Target', ... } ] ] }
        Object.keys(outputs).forEach(outputType => {
            outputs[outputType].forEach((connectionGroup: any[]) => {
                connectionGroup.forEach((conn: any) => {
                    initialEdges.push({
                        id: `${sourceName}-${conn.node}`,
                        source: sourceName,
                        target: conn.node,
                        animated: true,
                        style: { stroke: 'var(--text-muted)' },
                        markerEnd: { type: MarkerType.ArrowClosed }
                    });
                });
            });
        });
    });

    return { nodes: initialNodes, edges: initialEdges };
};

const { nodes: initialNodes, edges: initialEdges } = computeWorkflowData();

export default function WorkflowVisualizer({ isActive = false }: WorkflowVisualizerProps) {
    const { t } = useLocale();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
    const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

    // Animation Logic
    useEffect(() => {
        let timeoutIds: ReturnType<typeof setTimeout>[] = [];

        if (isActive) {
            // Start sequence
            setActiveNodeIds(['Webhook']);
            timeoutIds.push(setTimeout(() => setActiveNodeIds(prev => [...prev, 'Parse Input']), 800));
            timeoutIds.push(setTimeout(() => setActiveNodeIds(prev => [...prev, 'Ollama Chat']), 1600));
        } else {
            // End sequence (if we were active)
            if (activeNodeIds.includes('Ollama Chat')) {
                setActiveNodeIds(prev => [...prev, 'Format Response']);
                timeoutIds.push(setTimeout(() => setActiveNodeIds(prev => [...prev, 'Respond']), 600));
                timeoutIds.push(setTimeout(() => setActiveNodeIds([]), 2500)); // Reset
            } else {
                setActiveNodeIds([]);
            }
        }

        return () => timeoutIds.forEach(clearTimeout);
    }, [isActive]);

    // Apply Active Styles
    useEffect(() => {
        setNodes(nds => nds.map(node => ({
            ...node,
            style: getNodeStyle(
                // Find original type from ID? We lost explicit type in state, 
                // but we can infer or store it. For simplicity, just check label/id.
                // Fallback safe checks
                (node.id || '').toLowerCase().includes('webhook') ? 'webhook' :
                    (node.id || '').toLowerCase().includes('chat') ? 'httpRequest' : 'code',
                activeNodeIds.includes(node.id)
            )
        })));
    }, [activeNodeIds, setNodes]);

    return (
        <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {t('wf.title') as string}
                </h2>
                <div className="flex items-center gap-2">
                    <p className="text-sm opacity-80" style={{ color: 'var(--text-secondary)' }}>
                        {t('wf.description') as string}
                    </p>
                    {isActive && (
                        <span className="flex h-2 w-2 relative ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Background color="var(--border-subtle)" gap={16} />
                    <Controls />
                    <MiniMap
                        nodeColor={(n) => {
                            return n.style?.background as string || '#eee';
                        }}
                        maskColor="rgba(0,0,0,0.4)"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}
