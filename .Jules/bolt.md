## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2024-05-23 - Array filtering in React Renders
**Learning:** Performing `Array.prototype.filter` coupled with string manipulations like `.toLowerCase()` on every single React render pass is a hidden `O(N)` cost that scales poorly with user data (like chat history). Even if `N` is relatively small, unnecessary repeated operations block the main thread unnecessarily.
**Action:** Always wrap list filtering logic that relies on component state (e.g., a search string) inside `useMemo`, and hoist expensive invariant calculations (like `.toLowerCase()` on the search string) outside of the iterator callbacks.

## 2025-05-24 - Unnecessary state updates in hooks polling
**Learning:** Polling external APIs at a high frequency (like 1.5s) and updating state variables without verifying if data genuinely changed (e.g., re-instantiating empty `Set`s) causes React hooks to fail equality checks, thereby triggering a cascade of unnecessary re-renders in subscribing components (like a complex Workflow canvas). Furthermore, resolving lint errors about calling `setState` inside `useEffect` during prop changes should be fixed by updating the state during render (`if (prop !== prevProp) ...`) instead of moving `setState` around inside effects.
**Action:** Always implement a deep or structural equality check (e.g., comparing size and items of Sets) within polling hooks before executing `setState`. Update derived state directly within the component render block when responding to prop changes.
