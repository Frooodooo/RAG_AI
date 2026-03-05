## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2024-05-23 - Array filtering in React Renders
**Learning:** Performing `Array.prototype.filter` coupled with string manipulations like `.toLowerCase()` on every single React render pass is a hidden `O(N)` cost that scales poorly with user data (like chat history). Even if `N` is relatively small, unnecessary repeated operations block the main thread unnecessarily.
**Action:** Always wrap list filtering logic that relies on component state (e.g., a search string) inside `useMemo`, and hoist expensive invariant calculations (like `.toLowerCase()` on the search string) outside of the iterator callbacks.

## 2024-05-24 - Unnecessary Re-renders in React Polling Hooks
**Learning:** When using `setInterval` to poll an API in a React custom hook, calling `setState` with deeply nested structures (like sets of strings representing API status flags) on every tick creates a new object reference. This fails React's default equality checks and forces the parent component (and its children) to needlessly re-render, even if the actual data hasn't changed.
**Action:** In React polling hooks, always implement structural equality checks (e.g., using a deep compare or `Set` equality helper) inside a functional `setState` updater. If the old and new data are structurally identical, explicitly return the previous state reference (`return prevState`) to bypass the re-render cycle.
