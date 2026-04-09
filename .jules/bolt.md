## 2024-05-18 - Avoid synchronous localStorage inside React state setters
**Learning:** Calling synchronous operations like `localStorage.setItem` inside React state setter functional updates blocks the main thread and causes duplicate writes in React StrictMode.
**Action:** Always synchronize state to localStorage asynchronously using a `useEffect` hook instead.
