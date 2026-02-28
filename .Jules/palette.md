## 2024-05-22 - Tailwind and Inline Styles Conflict
**Learning:** The 'Cosmos Dark' design system heavily relies on inline styles for component states (hover/active), which often override Tailwind utility classes for `box-shadow` or `border`.
**Action:** When adding focus states to existing components with inline styles, use `focus-visible:outline` instead of `focus-visible:ring` (which uses box-shadow) to avoid conflicts and ensure accessibility features work as intended.

## 2024-05-23 - Accessibility of Nested Actions
**Learning:** List items with actions that appear on hover (`opacity: 0`) are inaccessible to keyboard users. simply adding `tabIndex="0"` to the row isn't enough; the nested actions remain invisible even if focusable.
**Action:** Use `.group:focus-within` to toggle visibility of nested actions alongside `.group:hover`, ensuring keyboard users can see and interact with secondary actions when tabbing through the list item.

## 2024-05-24 - Dynamic ARIA Labels on Toggle Buttons
**Learning:** Toggle buttons that change icon/state (like sidebar collapse) must update their `aria-label` dynamically to reflect the current state, not just the action.
**Action:** Use conditional logic for `aria-label` (e.g., `collapsed ? 'Expand' : 'Collapse'`) to ensure screen reader users know the current context, not just the static button name.

## 2025-02-28 - Destructive Action Confirmation in Cosmos Dark
**Learning:** Destructive actions like "Clear Conversation" can easily wipe out significant user context if triggered accidentally. The 'Cosmos Dark' design system effectively utilizes a "double-tap" confirmation pattern.
**Action:** When implementing destructive single-click buttons, always add a timed confirmation state. Use `var(--red-dim)` background and `var(--red)` text/border to clearly signal the danger of the second click.
