## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2024-05-23 - Array filtering in React Renders
**Learning:** Performing `Array.prototype.filter` coupled with string manipulations like `.toLowerCase()` on every single React render pass is a hidden `O(N)` cost that scales poorly with user data (like chat history). Even if `N` is relatively small, unnecessary repeated operations block the main thread unnecessarily.
**Action:** Always wrap list filtering logic that relies on component state (e.g., a search string) inside `useMemo`, and hoist expensive invariant calculations (like `.toLowerCase()` on the search string) outside of the iterator callbacks.

## 2024-05-24 - Cascading Re-renders in React Polling Hooks
**Learning:** When a custom hook polls an external API (like n8n execution status) and calls `setState` with structurally equivalent but referentially distinct objects (e.g., new `Set` instances for done/error nodes), it bypasses React's default equality checks. This forces the entire consumer component tree (e.g., `WorkflowVisualizer`) to re-render on every poll interval, severely degrading frontend performance.
**Action:** In React polling hooks, implement structural equality checks (e.g., deep comparing `Set` items using a helper) before executing `setState` to prevent unnecessary state updates from failing React's equality checks and causing cascading re-renders.

## 2024-05-25 - React.lazy for Heavy Dependencies in ReactFlow
**Learning:** Large graphing libraries like `@xyflow/react` significantly increase the initial bundle size of the main application. If the workflow visualizer is only one tab among many, forcing the user to download the entire library immediately creates a major frontend performance bottleneck.
**Action:** Use `React.lazy` and `Suspense` to code-split heavy dependencies like `ReactFlow`, `MiniMap`, `Controls`, and `Background` so they are only loaded when the component is actually rendered.

## 2024-05-25 - Rules of Hooks and Expensive Markdown Parsing
**Learning:** React requires hooks like `useMemo` to be called unconditionally. However, extracting an expensive operation (like markdown parsing) into a `useMemo` block that runs *before* early returns (e.g. `if (isUser) return null`) means the expensive operation still executes unnecessarily.
**Action:** Move early returns below hook calls, but within the hook's callback itself, check the condition (e.g., `if (isUser) return null;`) to avoid performing the expensive calculation when it's not needed, satisfying both the linter and performance requirements.

## 2024-05-25 - React.lazy Code Splitting Location Matters
**Learning:** Using `React.lazy` on a component but keeping synchronous hooks/imports from the same underlying package in the exact same file defeats code splitting. To truly defer the loading of a heavy dependency like `@xyflow/react`, the component using those hooks (e.g. `WorkflowVisualizer`) must be entirely code-split from its parent (e.g. `App.tsx`), ensuring no synchronous references to the library exist in the initial bundle.
**Action:** When code-splitting a library, split at the boundary of the highest-level component that consumes it, rather than trying to split individual sub-components within a file that still synchronously imports library hooks.
