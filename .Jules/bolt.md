## 2024-03-06 - Prevent Polling Hook Re-renders with Structural Equality
**Learning:** In React, hooks that perform background polling (like `useExecutionTracker` checking n8n workflows) often reconstruct data structures like `Set`s on every tick, causing cascading re-renders in consuming components even when the underlying data hasn't changed.
**Action:** Implement structural equality checks (e.g., `areSetsEqual`) before calling `setState` in polling hooks. Returning the previous state object reference allows React to safely bail out of the render cycle.
