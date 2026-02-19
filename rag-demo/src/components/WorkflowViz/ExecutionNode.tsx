import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export type NodeExecStatus = 'idle' | 'running' | 'done' | 'error';

export interface ExecutionNodeData extends Record<string, unknown> {
    label: string;
    nodeType: string;
    description?: string;
    status: NodeExecStatus;
}

export type ExecutionNodeType = Node<ExecutionNodeData, 'execution'>;

// Left-border accent colour by n8n node type keyword
const TYPE_ACCENT: Record<string, string> = {
    webhook:          '#f2cf59',
    respondToWebhook: '#52d399',
    httpRequest:      '#e35a5a',
    code:             '#4a90e2',
    if:               '#d97706',
};

function accentFor(nodeType: string): string {
    for (const [key, color] of Object.entries(TYPE_ACCENT)) {
        if (nodeType.includes(key)) return color;
    }
    return '#4a90e2';
}

const STATUS: Record<NodeExecStatus, { border: string; bg: string; shadow: string; dot: string | null }> = {
    idle:    { border: 'rgba(255,255,255,0.08)', bg: '#101628',              shadow: 'none',                              dot: null },
    running: { border: 'rgba(93,107,254,0.8)',   bg: 'rgba(93,107,254,0.1)', shadow: '0 0 14px rgba(93,107,254,0.45)',    dot: '#5d6bfe' },
    done:    { border: 'rgba(52,211,153,0.6)',   bg: 'rgba(52,211,153,0.07)', shadow: '0 0 10px rgba(52,211,153,0.25)',   dot: '#34d399' },
    error:   { border: 'rgba(248,113,113,0.6)',  bg: 'rgba(248,113,113,0.07)', shadow: '0 0 10px rgba(248,113,113,0.25)', dot: '#f87171' },
};

const ExecutionNode = memo(function ExecutionNode({ data }: NodeProps<ExecutionNodeType>) {
    const s = STATUS[data.status];
    const accent = accentFor(data.nodeType ?? '');

    return (
        <div
            style={{
                position: 'relative',
                padding: '9px 13px 9px 11px',
                borderRadius: '8px',
                border: `1.5px solid ${s.border}`,
                borderLeft: `4px solid ${accent}`,
                background: s.bg,
                boxShadow: s.shadow,
                width: 188,
                fontFamily: 'var(--font, system-ui)',
                transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: accent, width: 8, height: 8, border: 'none' }}
            />

            {/* Status dot */}
            {s.dot && (
                <span
                    style={{
                        position: 'absolute',
                        top: 7,
                        right: 7,
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: s.dot,
                        animation: data.status === 'running' ? 'ping 1s cubic-bezier(0,0,0.2,1) infinite' : 'none',
                    }}
                />
            )}

            {/* Node name */}
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#eef0f8',
                    lineHeight: 1.3,
                    paddingRight: 14,
                }}
            >
                {data.label}
            </div>

            {/* Description (first line only to keep it compact) */}
            {data.description && (
                <div
                    style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: '#4a5578',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-line',
                    }}
                >
                    {data.description.split('\n')[0]}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: accent, width: 8, height: 8, border: 'none' }}
            />
        </div>
    );
});

export default ExecutionNode;
