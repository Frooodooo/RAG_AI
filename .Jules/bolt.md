## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2024-05-23 - Array filtering in React Renders
**Learning:** Performing `Array.prototype.filter` coupled with string manipulations like `.toLowerCase()` on every single React render pass is a hidden `O(N)` cost that scales poorly with user data (like chat history). Even if `N` is relatively small, unnecessary repeated operations block the main thread unnecessarily.
**Action:** Always wrap list filtering logic that relies on component state (e.g., a search string) inside `useMemo`, and hoist expensive invariant calculations (like `.toLowerCase()` on the search string) outside of the iterator callbacks.

## 2024-05-24 - Cascading Re-renders in React Polling Hooks
**Learning:** When a custom hook polls an external API (like n8n execution status) and calls `setState` with structurally equivalent but referentially distinct objects (e.g., new `Set` instances for done/error nodes), it bypasses React's default equality checks. This forces the entire consumer component tree (e.g., `WorkflowVisualizer`) to re-render on every poll interval, severely degrading frontend performance.
**Action:** In React polling hooks, implement structural equality checks (e.g., deep comparing `Set` items using a helper) before executing `setState` to prevent unnecessary state updates from failing React's equality checks and causing cascading re-renders.

## 2024-05-25 - Heavy Dependency Splitting in Single Page Apps
**Learning:** In a Single Page Application, heavy library dependencies for specialized views (like `@xyflow/react` for the `WorkflowVisualizer` tab) are bundled into the main JS payload by default, significantly degrading the initial load time and Time-to-Interactive (TTI) even for users who never visit that specific tab.
**Action:** Always consider using `React.lazy` and `Suspense` to code-split expensive components that are not immediately required for the critical rendering path (e.g., hidden tabs or modals), deferring their network load until the user actually requests them.
