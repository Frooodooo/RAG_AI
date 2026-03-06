import { useState, useEffect, useRef } from 'react';
import { getExecution } from '../api';

export interface ExecutionTrackState {
    doneNodes: Set<string>;
    errorNodes: Set<string>;
    runningNodes: Set<string>;
    finished: boolean;
}

const EMPTY: ExecutionTrackState = {
    doneNodes: new Set(),
    errorNodes: new Set(),
    runningNodes: new Set(),
    finished: false,
};

const POLL_INTERVAL_MS = 1500;

function setsAreEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
        if (!b.has(item)) return false;
    }
    return true;
}

/**
 * Polls the n8n execution API for a given executionId and returns the
 * per-node state (done / error / running) in real time.
 *
 * Returns EMPTY state when executionId is null/undefined.
 * Polling stops automatically once the execution finishes.
 */
export function useExecutionTracker(executionId: string | null | undefined): ExecutionTrackState {
    const [state, setState] = useState<ExecutionTrackState>(EMPTY);
    const [prevId, setPrevId] = useState(executionId);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Synchronously reset state if executionId changes (avoids react-hooks/set-state-in-effect)
    if (executionId !== prevId) {
        setPrevId(executionId);
        setState(EMPTY);
    }

    useEffect(() => {
        if (!executionId) {
            return;
        }

        let cancelled = false;

        const poll = async () => {
            try {
                const exec = await getExecution(executionId);
                if (cancelled) return;

                const runData = exec.data?.resultData?.runData ?? {};
                const doneNodes = new Set<string>();
                const errorNodes = new Set<string>();

                for (const [nodeName, runs] of Object.entries(runData)) {
                    if (runs.some(r => r.error != null)) {
                        errorNodes.add(nodeName);
                    } else {
                        doneNodes.add(nodeName);
                    }
                }

                const runningNodes = new Set<string>(
                    (exec.data?.executionData?.nodeExecutionStack ?? []).map(s => s.node.name)
                );

                const finished =
                    exec.finished || exec.status === 'success' || exec.status === 'error';

                // ⚡ Bolt: Prevent redundant re-renders by doing a deep comparison
                // of the Sets. Since we poll every 1.5s, avoiding setState when
                // structural state hasn't changed saves the entire WorkflowViz from re-rendering.
                setState(prev => {
                    if (
                        prev.finished === finished &&
                        setsAreEqual(prev.doneNodes, doneNodes) &&
                        setsAreEqual(prev.errorNodes, errorNodes) &&
                        setsAreEqual(prev.runningNodes, runningNodes)
                    ) {
                        return prev;
                    }
                    return { doneNodes, errorNodes, runningNodes, finished };
                });

                if (finished && intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } catch {
                // Ignore polling errors — n8n API may not have the API key configured
            }
        };

        poll();
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [executionId]);

    return state;
}
