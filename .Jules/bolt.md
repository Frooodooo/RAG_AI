## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2025-03-04 - React Hook Rules and Conditional Rendering
**Learning:** Fixing conditional hook calls by moving them up before early returns is critical. Wrapping the expensive logic (like `renderMarkdown` for only non-user messages) in a condition inside `useMemo` preserves both hook rules and performance optimizations.
**Action:** When finding conditional rendering that uses `useMemo`, move the hook to the top of the component and use a ternary operation within the hook's callback to conditionally execute the heavy logic.
