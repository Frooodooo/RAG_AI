## 2024-06-25 - React render performance in ChatPage
**Learning:** `ChatMessage` components are currently re-rendering unnecessarily when the `ChatPage` updates, such as when the loading state changes. Although `ChatMessage` uses `React.memo`, its parent passes down an object from `sessions` which may change on every update if the session object is recreated. Oh wait, `ChatMessage` uses `React.memo`, and receives the `message` object directly. If `activeSession.messages` array identity changes or its items change, they will re-render. Let me actually find a measurable optimization.
**Action:** Let's look at `SessionSidebar` filtering and rendering, or `renderMarkdown` in `ChatMessage`.

## 2024-06-25 - React functional state updates
**Learning:** `useCallback` dependency array could trigger unnecessary re-renders when the dependency is a state variable like `activeSessionId`.
**Action:** Use a functional state update inside `setActiveSessionIdState` (e.g., `setActiveSessionIdState((currentActiveId) => {...})`) to remove `activeSessionId` from the `deleteSession` dependency array, avoiding re-render cascades in `SessionSidebar.tsx`.
