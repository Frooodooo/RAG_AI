## 2024-05-22 - Memoization in Chat Lists
**Learning:** In a chat application where the parent component manages a high-frequency "typing" or "loading" state (e.g., updating a timer every second), failing to memoize the message list items (`ChatMessage`) causes the entire history to re-render on every tick. This is a critical performance bottleneck when messages involve expensive operations like Markdown parsing.
**Action:** Always wrap `ChatMessage` components in `React.memo` when the parent component has frequent state updates that don't affect individual messages.

## 2025-05-24 - Optimizing React List Rendering with Stateful Components
**Learning:** When optimizing list rendering by reusing components (e.g. changing `key` from unique ID to index), internal state of reused components (like `useState`) persists across props updates. This can lead to stale UI states (e.g. "Copied!" message persisting).
**Action:** Always implement a state reset pattern (using `prevProps` state derivation during render) when reusing stateful components in dynamic lists to ensure correct behavior without cascading renders.
