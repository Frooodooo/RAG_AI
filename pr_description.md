💡 What: Implemented code splitting using `React.lazy` and `Suspense` for the `WorkflowVisualizer` component in `App.tsx`.

🎯 Why: `WorkflowVisualizer` imports heavy charting/graphing dependencies (`@xyflow/react`). By lazy loading this component, we prevent these substantial dependencies from blocking the initial render of the application, particularly for users who only want to use the "Chat" or "Documents" tabs. This also fixes a severe bug in `ChatMessage.tsx` where a `useMemo` hook was called conditionally after an early return, resolving a React Rules of Hooks violation.

📊 Impact: Reduces the initial JavaScript bundle size significantly, leading to faster Time to Interactive (TTI) and First Contentful Paint (FCP) for the default chat view.

🔬 Measurement: Verify the bundle size using `pnpm build` or monitor the network tab in DevTools to confirm that the `@xyflow/react` chunks are only fetched when clicking the "Workflow" tab.
