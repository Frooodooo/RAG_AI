## 2024-05-22 - Undefined CSS Variables in SessionSidebar
**Learning:** `SessionSidebar.tsx` uses CSS variables (`--accent-primary`, `--accent-rose`, `--text-accent`) that are NOT defined in `index.css` (which uses `--accent`, `--red`, `--t-accent`). This likely results in broken UI states (invisible active borders, missing focus rings).
**Action:** When refactoring or adding features, always verify variable existence in `index.css`. Future tasks should prioritize fixing these undefined variables to restore intended visual hierarchy.
