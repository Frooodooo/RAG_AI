## 2024-05-22 - Tailwind and Inline Styles Conflict
**Learning:** The 'Cosmos Dark' design system heavily relies on inline styles for component states (hover/active), which often override Tailwind utility classes for `box-shadow` or `border`.
**Action:** When adding focus states to existing components with inline styles, use `focus-visible:outline` instead of `focus-visible:ring` (which uses box-shadow) to avoid conflicts and ensure accessibility features work as intended.

## 2024-05-23 - Accessibility of Nested Actions
**Learning:** List items with actions that appear on hover (`opacity: 0`) are inaccessible to keyboard users. simply adding `tabIndex="0"` to the row isn't enough; the nested actions remain invisible even if focusable.
**Action:** Use `.group:focus-within` to toggle visibility of nested actions alongside `.group:hover`, ensuring keyboard users can see and interact with secondary actions when tabbing through the list item.

## 2024-05-24 - Dynamic ARIA Labels on Toggle Buttons
**Learning:** Toggle buttons that change icon/state (like sidebar collapse) must update their `aria-label` dynamically to reflect the current state, not just the action.
**Action:** Use conditional logic for `aria-label` (e.g., `collapsed ? 'Expand' : 'Collapse'`) to ensure screen reader users know the current context, not just the static button name.

## 2025-02-12 - Keyboard Shortcut Hints for Accessibility
**Learning:** Adding keyboard shortcut hints directly to a button's `aria-label` and `title` (e.g., 'Expand sidebar (Ctrl+B)') significantly improves discoverability for power users and ensures screen reader users are also informed of the alternative interaction method.
**Action:** Always include keyboard shortcuts in tooltips and ARIA labels when introducing global hotkeys for UI toggles or actions.

## 2025-02-12 - Proper ARIA Attributes for Keyboard Shortcuts
**Learning:** While appending a keyboard shortcut hint like "(Ctrl+B)" to a `title` attribute is good for discoverability, it shouldn't be hardcoded into the `aria-label`. Instead, the `aria-keyshortcuts` attribute (e.g., `aria-keyshortcuts="Control+b"`) is the semantic and accessible way to expose keyboard shortcuts to screen readers.
**Action:** Use `aria-keyshortcuts` when implementing global shortcuts alongside standard `aria-label` descriptions, keeping the label clean while properly announcing the shortcut.
