
## 2025-02-17 - [Optimized SessionSidebar filtering]
**Learning:** Found an $O(N)$ string conversion inside the `.filter` loop for `SessionSidebar` search. Wrapping it in a `useMemo` hook (dependent on `sessions` and `search`) and extracting `search.toLowerCase()` outside the `.filter` loop prevents redundant $O(N)$ string conversions and recalculations on every render.
**Action:** Be mindful of redundant work inside loop iterations, and move work that doesn't depend on the loop iteration out of the loop.
