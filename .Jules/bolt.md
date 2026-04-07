## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2024-05-23 - Array filtering in React Renders
**Learning:** Performing `Array.prototype.filter` coupled with string manipulations like `.toLowerCase()` on every single React render pass is a hidden `O(N)` cost that scales poorly with user data (like chat history). Even if `N` is relatively small, unnecessary repeated operations block the main thread unnecessarily.
**Action:** Always wrap list filtering logic that relies on component state (e.g., a search string) inside `useMemo`, and hoist expensive invariant calculations (like `.toLowerCase()` on the search string) outside of the iterator callbacks.

## 2024-05-24 - Cascading Re-renders in React Polling Hooks
**Learning:** When a custom hook polls an external API (like n8n execution status) and calls `setState` with structurally equivalent but referentially distinct objects (e.g., new `Set` instances for done/error nodes), it bypasses React's default equality checks. This forces the entire consumer component tree (e.g., `WorkflowVisualizer`) to re-render on every poll interval, severely degrading frontend performance.
**Action:** In React polling hooks, implement structural equality checks (e.g., deep comparing `Set` items using a helper) before executing `setState` to prevent unnecessary state updates from failing React's equality checks and causing cascading re-renders.

## 2024-05-25 - Code Splitting Heavy Node Visualization Dependencies
**Learning:** Statically importing heavy specialized UI libraries (like `@xyflow/react` used for workflow node visualization) at the root level of a multi-tab application (`App.tsx`) forces the bundler to include the massive dependency in the initial chunk. This severely degrades initial page load performance for all users, even if they only ever use the basic "Chat" or "Documents" views and never navigate to the workflow tab.
**Action:** When a heavy UI component library is only used conditionally or in a specific isolated route/tab, always dynamically import it using `React.lazy()` at the highest boundary level where it is consumed (e.g., `const WorkflowVisualizer = React.lazy(() => import('./WorkflowVisualizer'))`), and wrap the conditionally rendered element in `<React.Suspense>`.
