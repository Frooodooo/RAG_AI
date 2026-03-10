💡 What: Added `aria-label="Rename conversation"` to the conversation rename `<input>` elements in `ChatPage.tsx` and `SessionSidebar.tsx`. Additionally, added `aria-hidden="true"` to decorative icons (`ChatBubbleIcon`, `EditIcon`, `TrashIcon`) that are either adjacent to text or purely visual in `ChatPage.tsx`.

🎯 Why: To improve the accessibility of the chat interface for screen reader users. Previously, the rename inputs lacked visible labels and accessible names, making their purpose unclear to screen readers. The decorative icons were also redundantly read out, cluttering the auditory experience.

📸 Before/After: Visuals remain unchanged, but the underlying HTML structure is now more semantic and accessible.

♿ Accessibility: Ensures that screen reader users can accurately identify and interact with the rename input fields and prevents them from being distracted by purely decorative SVG elements.
